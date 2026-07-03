/**
 * 家猫アプリ 中継GAS ver.2.1（画像付き投稿対応）
 * ─────────────────────────────────────────────
 * ・全端末の診断結果／投票／アイデアをスプレッドシートに集約
 * ・Discordへ埋め込みメッセージ＋家猫カード画像＋スレッド自動作成で送信
 * ・書込系は doPost（画像Base64が大きいため）、参照系は doGet
 *
 * デプロイ手順:
 *   1) このコードをスプレッドシートに紐づいたスクリプトエディタに貼る
 *   2) 「デプロイ→デプロイを管理→編集→新バージョン→デプロイ」
 *      ・実行ユーザ: 自分／アクセス: 全員
 *   3) 発行された /exec URL は既存のまま維持されます
 *
 * シート構成（初回自動作成）:
 *   cats     : 診断結果ログ
 *   votes    : またたび会議の投票
 *   ideas    : またたび会議のアイデア
 *   discord  : Discord送信ログ
 */

const SS_ID    = '1qjEheZWVJxPiw_tZfRrUnIsOCXIfE5x1y0Jeo8T670A';
const WEBHOOK  = 'https://discord.com/api/webhooks/1522470516764446750/YKJgLmuR94FE2qzPEyxPX9pC8Lp_ZdKhDHVYaSLVO7IlvW02F-cHb28AA5H-nWqXtP7I';

// ─── メインエントリ ─────────────────────────────
function doGet(e){
  try{
    const p = e.parameter || {};
    const what   = (p.what   || '').toLowerCase();
    const action = (p.action || '').toLowerCase();

    // 参照系
    if(what === 'cats')     return _json(_readCats());
    if(what === 'meeting')  return _json(_readMeeting());
    if(what === 'ping')     return _json({ok:true, ts:new Date().toISOString()});

    // 書込系（軽量）
    if(action === 'record') return _json(_recordCat(p, null));
    if(action === 'vote')   return _json(_recordVote(p));
    if(action === 'idea')   return _json(_recordIdea(p));

    return _json({ok:false, error:'no action', got:p});
  }catch(err){
    return _json({ok:false, error:String(err && err.message || err)});
  }
}

// POST: 画像Base64付きの record を受ける
function doPost(e){
  try{
    let body = {};
    if(e && e.postData && e.postData.contents){
      try{ body = JSON.parse(e.postData.contents); }catch(_){ body = {}; }
    }
    const p = Object.assign({}, e.parameter || {}, body);
    const action = (p.action || '').toLowerCase();

    if(action === 'record'){
      // image (dataURL: "data:image/png;base64,....") を切り離す
      const imgData = p.image || '';
      const clean = Object.assign({}, p); delete clean.image;
      return _json(_recordCat(clean, imgData));
    }
    if(action === 'vote')   return _json(_recordVote(p));
    if(action === 'idea')   return _json(_recordIdea(p));

    // フォールバック: doGet へ流す
    e.parameter = p;
    return doGet(e);
  }catch(err){
    return _json({ok:false, error:'post error', detail:String(err && err.message || err)});
  }
}

// ─── 参照 ───────────────────────────────────────
function _readCats(){
  const sh = _sheet('cats', ['ts','cid','no','name','catname','x','y','score','quadrant','mode','extra']);
  const v  = sh.getDataRange().getValues();
  if(v.length < 2) return {cats:[]};
  const hd = v.shift();
  const cats = v.map(r=>{
    const o={}; hd.forEach((k,i)=>o[k]=r[i]); return o;
  });
  return {cats};
}
function _readMeeting(){
  const sv = _sheet('votes', ['ts','cid','no','name','catname','vote','nick']);
  const si = _sheet('ideas', ['ts','cid','no','name','catname','idea','nick']);
  const V  = sv.getDataRange().getValues();  V.shift();
  const I  = si.getDataRange().getValues();  I.shift();
  return {
    votes: V.map(r=>({ts:r[0],cid:r[1],no:+r[2],name:r[3],catname:r[4],vote:r[5],nick:r[6]})),
    ideas: I.map(r=>({ts:r[0],cid:r[1],no:+r[2],name:r[3],catname:r[4],idea:r[5],nick:r[6]}))
  };
}

// ─── 書込 ───────────────────────────────────────
function _recordCat(p, imgData){
  // 便宜: p.nearestNo / p.nearestName / p.catname を no/name/catname に流し込む
  const no      = p.no || p.nearestNo || '';
  const name    = p.name || p.nearestName || p.typeName || '';
  const catname = p.catname || '';

  const sh = _sheet('cats', ['ts','cid','no','name','catname','x','y','score','quadrant','mode','extra']);
  const row = [p.ts||new Date().toISOString(), p.cid||'', no, name, catname,
               p.x||'', p.y||'', p.total||p.score||'', p.quad||p.quadrant||'', p.mode||'', JSON.stringify(p)];
  sh.appendRow(row);

  // Discord通知（カード生成時。画像があれば multipart で添付）
  _notifyDiscord_card(Object.assign({}, p, {no:no, name:name, catname:catname}), imgData);
  return {ok:true, hasImage: !!imgData};
}
function _recordVote(p){
  const sh = _sheet('votes', ['ts','cid','no','name','catname','vote','nick']);
  sh.appendRow([p.ts||new Date().toISOString(), p.cid||'', p.no||'', p.name||'', p.catname||'', p.vote||'', p.nick||'']);
  _notifyDiscord_vote(p);
  return {ok:true};
}
function _recordIdea(p){
  const sh = _sheet('ideas', ['ts','cid','no','name','catname','idea','nick']);
  sh.appendRow([p.ts||new Date().toISOString(), p.cid||'', p.no||'', p.name||'', p.catname||'', p.idea||'', p.nick||'']);
  _notifyDiscord_idea(p);
  return {ok:true};
}

// ─── Discord送信 ───────────────────────────────

// カード生成通知：画像あれば multipart/form-data で添付
function _notifyDiscord_card(p, imgData){
  const embed = {
    title: `🐾 ${p.name || '家猫'}（${p.catname || ''}）`,
    description: `新しい家猫カードが生成されました\n**総合家猫度**: ${p.total || p.score || '—'}／ **象限**: ${p.quad || p.quadrant || '—'}`,
    color: 0x1F3864,
    fields: [
      {name:'X（公的↔私的）',    value:String(p.x||'—'), inline:true},
      {name:'Y（半野良↔家猫）',  value:String(p.y||'—'), inline:true},
      {name:'モード',            value:String(p.mode||'—'), inline:true}
    ],
    footer:{text:`cid:${(p.cid||'').slice(0,8)}  •  ${new Date().toLocaleString('ja-JP')}`}
  };
  if(imgData){
    // dataURL に対応するファイル名を Embed の image.url に指定
    embed.image = { url: 'attachment://ieneko_card.png' };
  }
  const payload = {
    content: `**${p.catname || '家猫'}** さんが街に現れました 🏙`,
    embeds: [embed],
    thread_name: `🍶 ${p.catname || p.name || '猫'} を語ろう`
  };
  _sendDiscord(payload, p, imgData);
}

function _notifyDiscord_vote(p){
  const embed = {
    title: `🗳 またたび会議の投票: ${p.vote || ''}`,
    description: `**${p.name}**（${p.catname}） No.${p.no}\nby ${p.nick || '名無しねこ'}`,
    color: 0x2E9E5B,
    footer:{text:`cid:${(p.cid||'').slice(0,8)}`}
  };
  _sendDiscord({
    content: `🌿 ${p.nick || '名無しねこ'} が投票しました`,
    embeds: [embed],
    thread_name: `🌿 またたび議論: ${p.name || 'No.'+(p.no||'')}`
  }, p, null);
}

function _notifyDiscord_idea(p){
  const embed = {
    title: `💡 新しいまたたびアイデア`,
    description: `**${p.name}**（${p.catname}） No.${p.no}\n\n> ${p.idea || ''}\n\n— ${p.nick || '名無しねこ'}`,
    color: 0xD6A400,
    footer:{text:`cid:${(p.cid||'').slice(0,8)}`}
  };
  _sendDiscord({
    content: `🌿 新しいアイデアが届きました`,
    embeds: [embed],
    thread_name: `🌿 またたび議論: ${p.name || 'No.'+(p.no||'')}`
  }, p, null);
}

// Discord送信共通
//   - imgData（dataURL）ありなら multipart/form-data で画像添付
//   - なければ JSON で送信
//   - ?wait=true でスレッド作成
function _sendDiscord(payload, p, imgData){
  if(!WEBHOOK) return;
  try{
    const url = WEBHOOK + '?wait=true';
    let res;
    if(imgData){
      // dataURL → Blob
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imgData);
      if(m){
        const mime = m[1] || 'image/png';
        const b64  = m[2];
        const bytes = Utilities.base64Decode(b64);
        const blob  = Utilities.newBlob(bytes, mime, 'ieneko_card.png');
        // Apps Script の UrlFetchApp は payload に blob を含めると multipart になる
        res = UrlFetchApp.fetch(url, {
          method: 'post',
          payload: {
            'payload_json': JSON.stringify(payload),
            'files[0]': blob
          },
          muteHttpExceptions: true
        });
      }else{
        res = _sendJSON(url, payload);
      }
    }else{
      res = _sendJSON(url, payload);
    }
    const log = _sheet('discord', ['ts','type','name','status','msgId','hasImage']);
    let body = {}; try{ body = JSON.parse(res.getContentText()||'{}'); }catch(e){}
    log.appendRow([new Date().toISOString(), payload.thread_name||'', (p&&p.name)||'', res.getResponseCode(), body.id||'', imgData?'yes':'no']);
  }catch(err){
    // 失敗しても本処理は継続
    try{
      const log = _sheet('discord', ['ts','type','name','status','msgId','hasImage']);
      log.appendRow([new Date().toISOString(), (payload&&payload.thread_name)||'', (p&&p.name)||'', 'err', String(err), imgData?'yes':'no']);
    }catch(e2){}
  }
}
function _sendJSON(url, payload){
  return UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

// ─── ヘルパー ───────────────────────────────────
function _sheet(name, header){
  const ss = SpreadsheetApp.openById(SS_ID);
  let sh = ss.getSheetByName(name);
  if(!sh){
    sh = ss.insertSheet(name);
    sh.appendRow(header);
  }else if(sh.getLastRow() === 0){
    sh.appendRow(header);
  }
  return sh;
}
function _json(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
