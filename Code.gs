/**
 * 家猫アプリ 中継GAS ver.2
 * ─────────────────────────────────────────────
 * ・全端末の診断結果／投票／アイデアをスプレッドシートに集約
 * ・Discordへ埋め込みメッセージ＋スレッド自動作成で送信
 * ・すべて doGet で受ける（CORSプリフライトを避ける）
 *
 * デプロイ手順:
 *   1) このコードをスプレッドシートに紐づいたスクリプトエディタに貼る
 *   2) 「デプロイ→新しいデプロイ→ウェブアプリ」
 *      ・実行ユーザ: 自分／アクセス: 全員
 *   3) 発行された /exec URL を index.html / ienekomap.html の SHARED_API に反映
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

    // 書込系
    if(action === 'record') return _json(_recordCat(p));
    if(action === 'vote')   return _json(_recordVote(p));
    if(action === 'idea')   return _json(_recordIdea(p));

    return _json({ok:false, error:'no action', got:p});
  }catch(err){
    return _json({ok:false, error:String(err && err.message || err)});
  }
}
function doPost(e){
  // フォールバック：JSONボディをパラメータ扱いで転送
  try{
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    e.parameter = Object.assign({}, e.parameter || {}, body);
    return doGet(e);
  }catch(err){
    return _json({ok:false, error:'bad json', detail:String(err)});
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
function _recordCat(p){
  const sh = _sheet('cats', ['ts','cid','no','name','catname','x','y','score','quadrant','mode','extra']);
  const row = [p.ts||new Date().toISOString(), p.cid||'', p.no||'', p.name||'', p.catname||'',
               p.x||'', p.y||'', p.score||'', p.quadrant||'', p.mode||'', JSON.stringify(p)];
  sh.appendRow(row);
  // Discord通知（カード生成時）
  _notifyDiscord_card(p);
  return {ok:true};
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

// ─── Discord送信（Embed＋スレッド自動作成） ──────
function _notifyDiscord_card(p){
  const embed = {
    title: `🐾 ${p.name || '家猫'}（${p.catname || ''}）`,
    description: `新しい家猫カードが生成されました\n**総合家猫度**: ${p.score || '—'}／ **象限**: ${p.quadrant || '—'}`,
    color: 0x1F3864,
    fields: [
      {name:'X（公的↔私的）', value:String(p.x||'—'), inline:true},
      {name:'Y（半野良↔家猫）', value:String(p.y||'—'), inline:true},
      {name:'モード', value:String(p.mode||'—'), inline:true}
    ],
    footer:{text:`cid:${(p.cid||'').slice(0,8)}  •  ${new Date().toLocaleString('ja-JP')}`}
  };
  _sendDiscord({
    content: `**${p.catname || '家猫'}** さんが街に現れました 🏙`,
    embeds: [embed],
    thread_name: `🍶 ${p.catname || p.name || '猫'} を語ろう`
  }, p);
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
  }, p);
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
  }, p);
}

// Discord送信共通（?wait=true でスレッド作成できる形式）
function _sendDiscord(payload, p){
  if(!WEBHOOK) return;
  try{
    const url = WEBHOOK + '?wait=true';
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const log = _sheet('discord', ['ts','type','name','status','msgId']);
    let body = {}; try{ body = JSON.parse(res.getContentText()||'{}'); }catch(e){}
    log.appendRow([new Date().toISOString(), payload.thread_name||'', (p&&p.name)||'', res.getResponseCode(), body.id||'']);
  }catch(err){
    // 失敗しても本処理は継続
  }
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
