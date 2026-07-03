/**
 * 家猫 共有API（Google Apps Script Web App）— v2
 * 全端末で「家猫マップ」と「またたび会議」を共有＋Discord転送する“読み書き両対応”サーバー。
 *
 * ★ポイント：読み取りも書き込みも「GET」で動くようにしてあります（静的サイトから一番確実）。
 *
 * ============ セットアップ（所要10分・順番どおりに） ============
 * 1) スプレッドシートを新規作成 → 上部メニュー「拡張機能 → Apps Script」
 * 2) 開いたエディタの中身を全部消し、このファイルの内容を丸ごと貼り付けて保存（💾）
 * 3) （Discordに流したい場合）左メニュー「⚙ プロジェクトの設定」→「スクリプト プロパティ」→
 *      プロパティ名: DISCORD_WEBHOOK   値: DiscordのWebhook URL   → 保存
 *      ※Webhookは Discordの対象チャンネル →「連携サービス」→「ウェブフック」→「新しいウェブフック」→ URLをコピー
 * 4) 右上「デプロイ」→「新しいデプロイ」→ 種類（⚙）＝「ウェブアプリ」
 *      説明：任意 ／ 次のユーザーとして実行：自分 ／ アクセスできるユーザー：★「全員」★
 *      →「デプロイ」→ 権限を承認（自分のGoogleアカウントを選び「許可」）
 * 5) 表示された「ウェブアプリ URL（.../exec で終わる）」をコピー
 *      → index.html と ienekomap.html の先頭 const SHARED_API="..." に貼る（すでに貼ってあればOK）
 *
 * ============ 動作テスト ============
 * ・ブラウザで  <あなたのexec URL>?what=cats  を開く → [] または [{...}] のJSONが出れば読取OK
 * ・            <あなたのexec URL>?action=vote&no=1&name=test&vote=%F0%9F%91%8D  を開く → {"ok":true}
 *   （その後 ?what=meeting を開くと票が増えている）
 *
 * ============ よくある“つながらない”原因 ============
 * ・「アクセスできるユーザー」が自分だけ → ★必ず「全員」★
 * ・コードを直したのに再デプロイしていない → 「デプロイ」→「デプロイを管理」→ ✏編集 →
 *     バージョン＝「新バージョン」→「デプロイ」（※URLは変わりません）
 * ・DISCORD_WEBHOOK 未設定 → シートには貯まるがDiscordには出ません（3を実施）
 */

function doGet(e)  { return handle_(e && e.parameter ? e.parameter : {}); }
function doPost(e) {
  var p = {};
  try { p = JSON.parse(e.postData.contents || '{}'); } catch (err) {}
  return handle_(p);
}

function handle_(p) {
  try {
    var a = p.action || p.kind || '';
    if (a === 'cat')  { appendCat_(p);        return json({ ok: true }); }
    if (a === 'vote' || a === 'idea') { appendMeeting_(p, a); forwardDiscord_(p, a); return json({ ok: true }); }
    if (p.what === 'cats')    return json(readCats_());
    if (p.what === 'meeting') return json(readMeeting_());
    return json({ ok: true, msg: 'iemeko shared api v2 alive', cats: readCats_().length });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ---------- 書き込み ---------- */
function appendCat_(p) {
  sheet_('cats', ['ts','cid','x','y','quad','typeName','catname','persona','kit','holo'])
    .appendRow([p.ts || new Date().toISOString(), p.cid||'', p.x, p.y, p.quad||'',
                p.typeName||'', p.catname||'', p.persona||'', p.kit||'', p.holo||0]);
}
function appendMeeting_(p, kind) {
  sheet_('meeting', ['ts','cid','kind','no','name','catname','vote','idea','nick'])
    .appendRow([p.ts || new Date().toISOString(), p.cid||'', kind, p.no||'',
                p.name||'', p.catname||'', p.vote||'', p.idea||'', p.nick||'名無しねこ']);
}

/* ---------- 読み取り ---------- */
var LIMIT = 4000;
function readCats_() {
  return allRows_('cats').map(function(r){
    return { x:num_(r.x), y:num_(r.y), quad:r.quad, typeName:r.typeName, catname:r.catname, persona:r.persona, kit:r.kit, ts:r.ts };
  }).filter(function(o){ return o.x!=null && o.y!=null; }).slice(-LIMIT);
}
function readMeeting_() {
  var votes = [], ideas = [];
  allRows_('meeting').forEach(function(r){
    if (r.kind === 'idea') ideas.push({ no:r.no, name:r.name, catname:r.catname, idea:r.idea, nick:r.nick, ts:r.ts });
    else                    votes.push({ no:r.no, name:r.name, catname:r.catname, vote:r.vote, ts:r.ts });
  });
  return { votes: votes.slice(-LIMIT), ideas: ideas.slice(-LIMIT) };
}

/* ---------- Discord転送 ---------- */
function forwardDiscord_(p, kind) {
  var hook = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK');
  if (!hook) return;
  var nick = p.nick || '名無しねこ';
  var msg = { embeds: [{
    title: kind === 'idea' ? '💡 またたび会議：改善アイデア' : '🗳 またたび会議：投票',
    color: kind === 'idea' ? 5763719 : 3447003,
    fields: [
      { name: 'タイプ', value: 'No.' + (p.no||'') + '　' + (p.name||'') + '（' + (p.catname||'') + '）' },
      { name: kind === 'idea' ? '提案' : '判定', value: String(kind === 'idea' ? (p.idea||'') : (p.vote||'')).slice(0,900) || '—' }
    ],
    footer: { text: 'from ' + nick },
    timestamp: new Date().toISOString()
  } ] };
  UrlFetchApp.fetch(hook, { method:'post', contentType:'application/json',
    payload: JSON.stringify(msg), muteHttpExceptions:true });
}

/* ---------- ユーティリティ ---------- */
function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(header);
  return sh;
}
function allRows_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), head = v[0], out = [];
  for (var i = 1; i < v.length; i++) { var o = {}; for (var j = 0; j < head.length; j++) o[head[j]] = v[i][j]; out.push(o); }
  return out;
}
function num_(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
