/**
 * 家猫カードジェネレーター「またたび会議」Discord中継
 * -------------------------------------------------------------
 * ブラウザ → このGAS(doPost) → Discord Webhook へ転送する中継。
 * Webhook URL は Script Properties に隠すので、公開index.htmlに秘密は出ません。
 * （任意）同時にスプレッドシートにも1行ずつ記録します。
 *
 * ■ 事前設定（1回だけ）
 *   1) Discordで対象チャンネル → 連携サービス → ウェブフック → 新規作成 → URLをコピー
 *   2) このプロジェクトの「プロジェクトの設定 > スクリプト プロパティ」に追加:
 *        DISCORD_WEBHOOK = 上でコピーしたWebhook URL
 *      （任意）SHEET_ID     = 記録用スプレッドシートのID（省略で記録しない）
 *   3) デプロイ > 新しいデプロイ > 種類=ウェブアプリ
 *        実行するユーザー: 自分 ／ アクセスできるユーザー: 全員
 *      発行された /exec のURLを、アプリの「🗣 またたび会議設定」に貼る
 *      （全員で使うなら index.html の const DISCORD_RELAY="" に貼る）
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    var props = PropertiesService.getScriptProperties();
    var hook = props.getProperty('DISCORD_WEBHOOK');

    var nick = (data.nick && String(data.nick).slice(0, 40)) || '名無しねこ';
    var no   = data.no || '';
    var name = data.name || '';
    var cat  = data.catname || '';
    var msg;

    if (data.kind === 'vote') {
      // 投票（👍/🤔/🙅）
      msg = {
        embeds: [{
          title: '🗳 またたび会議：投票',
          color: 3447003,
          fields: [
            { name: 'タイプ', value: 'No.' + no + '　' + name + '（' + cat + '）' },
            { name: '判定', value: String(data.vote || ''), inline: true },
            { name: '今のチュール', value: trunc(data.churu, 300) || '—' }
          ],
          footer: { text: 'from ' + nick + '｜家猫カードジェネレーター' },
          timestamp: new Date().toISOString()
        }]
      };
    } else if (data.kind === 'idea') {
      // 改善アイデア
      msg = {
        embeds: [{
          title: '💡 またたび会議：改善アイデア',
          color: 5763719,
          fields: [
            { name: 'タイプ', value: 'No.' + no + '　' + name + '（' + cat + '）' },
            { name: '提案', value: trunc(data.idea, 900) || '—' },
            { name: '今のまたたび', value: trunc(data.kaizen, 300) || '—' }
          ],
          footer: { text: 'from ' + nick + '｜家猫カードジェネレーター' },
          timestamp: new Date().toISOString()
        }]
      };
    } else {
      return out({ ok: false, error: 'unknown kind' });
    }

    if (hook) {
      UrlFetchApp.fetch(hook, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(msg),
        muteHttpExceptions: true
      });
    }

    // （任意）スプレッドシートにも記録
    var sid = props.getProperty('SHEET_ID');
    if (sid) {
      var sh = SpreadsheetApp.openById(sid).getSheets()[0];
      if (sh.getLastRow() === 0) {
        sh.appendRow(['ts', 'kind', 'no', 'name', 'catname', 'vote', 'idea', 'churu', 'kaizen', 'nick']);
      }
      sh.appendRow([
        new Date(), data.kind, no, name, cat,
        data.vote || '', data.idea || '', data.churu || '', data.kaizen || '', nick
      ]);
    }

    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function trunc(s, n) { s = s == null ? '' : String(s); return s.length > n ? s.slice(0, n) + '…' : s; }
function out(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return out({ ok: true, msg: '家猫 Discord中継 稼働中' }); }
