/**
 * 家猫アプリ共有バックエンド v3.1（列ずれ対策版）
 *
 * cats シートの正規列順：
 * ts, cid, mode, x, y, quad, typeName, catname, persona, kit, holo
 *
 * 重要：過去に ts,cid,x,y,quad,typeName... など別列順で作られた cats シートがある場合、
 * 先に cats シートをバックアップし、この同梱 cats_fixed_for_ienekomap.csv の列順で置き換えてください。
 */
const SPREADSHEET_ID = '1qjEheZWVJxPiw_tZfRrUnIsOCXIfE5x1y0Jeo8T670A';

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.what === 'cats') return json_(readObjects_('cats'));
    if (p.what === 'meeting') return json_({ votes: readObjects_('votes'), ideas: readObjects_('ideas') });

    const action = p.action || p.kind || '';

    // index.html v4/v5 は action=record、旧版は action=cat / kind=cat のことがある
    if (action === 'record' || action === 'cat' || p.kind === 'cat') {
      const row = normalizeCatParams_(p);
      appendObject_('cats', row);
      // Discord通知は失敗しても保存を止めない
      try { postDiscord_(Object.assign({}, row, { kind: 'cat' })); } catch (err) {}
      return json_({ ok: true, saved: 'cat', row: row });
    }

    if (action === 'vote' || p.kind === 'vote') {
      const row = pick_(p, ['ts','cid','no','name','catname','vote','nick']);
      row.ts = row.ts || new Date().toISOString();
      appendObject_('votes', row);
      try { postDiscord_(Object.assign({}, row, { kind: 'vote' })); } catch (err) {}
      return json_({ ok: true, saved: 'vote' });
    }

    if (action === 'idea' || p.kind === 'idea') {
      const row = pick_(p, ['ts','cid','no','name','catname','idea','nick']);
      row.ts = row.ts || new Date().toISOString();
      appendObject_('ideas', row);
      if (!p.nodisc) { try { postDiscord_(Object.assign({}, row, { kind: 'idea' })); } catch (err) {} }
      return json_({ ok: true, saved: 'idea' });
    }

    if (action === 'discord') return json_(postDiscord_(p));
    return json_({ ok: true, app: 'ieneko-backend-v3.1' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.stack || err) });
  }
}

function doPost(e) {
  try {
    const text = e && e.postData && e.postData.contents || '{}';
    const p = JSON.parse(text);
    p.ts = p.ts || new Date().toISOString();
    appendObject_('logs', p);
    return json_({ ok: true, saved: 'log' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function normalizeCatParams_(p) {
  return {
    ts: p.ts || new Date().toISOString(),
    cid: p.cid || '',
    mode: p.mode || '',
    x: p.x || p.X || '',
    y: p.y || p.Y || '',
    quad: p.quad || '',
    typeName: p.typeName || p.nearestName || p.name || '',
    catname: p.catname || p.catName || '',
    persona: p.persona || '',
    kit: p.kit || '',
    holo: p.holo || ''
  };
}

function ss_() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function sheet_(name, headers) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}
function headersFor_(name) {
  if (name === 'cats') return ['ts','cid','mode','x','y','quad','typeName','catname','persona','kit','holo'];
  if (name === 'votes') return ['ts','cid','no','name','catname','vote','nick'];
  if (name === 'ideas') return ['ts','cid','no','name','catname','idea','nick'];
  return ['ts','cid','app','ver','mode','x','y','total','quad','persona','answers','nearestNo','nearestName','catname','scores','raw'];
}
function appendObject_(name, obj) {
  const headers = headersFor_(name);
  const sh = sheet_(name, headers);
  // 既存シートのヘッダーが古い場合でも、正規ヘッダーを優先して列ずれを起こさない
  if (name === 'cats') ensureCatsHeader_(sh);
  const finalHeaders = name === 'cats' ? headersFor_('cats') : headers;
  const row = finalHeaders.map(h => obj[h] == null ? '' : String(obj[h]).slice(0, 5000));
  sh.appendRow(row);
}
function ensureCatsHeader_(sh) {
  const headers = headersFor_('cats');
  const current = sh.getRange(1, 1, 1, Math.max(headers.length, sh.getLastColumn())).getValues()[0].map(String);
  const same = headers.every((h, i) => current[i] === h);
  if (!same) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
}
function readObjects_(name) {
  const headers = headersFor_(name);
  const sh = sheet_(name, headers);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const head = values[0].map(String);
  return values.slice(1).filter(r => r.some(c => c !== '')).map(r => {
    const o = {}; head.forEach((h,i) => o[h] = r[i]); return normalizeReadObject_(name, o, r);
  });
}

function normalizeReadObject_(name, o, r) {
  if (name !== 'cats') return o;
  // 正規形式ならそのまま
  if (isValidXY_(o.x, o.y)) return o;
  // 混在してしまった古い行を読み取り時にも救済
  // 例：ts,cid,nearestNo,nearestName,catname,x,y,kit,quad,mode,rawJson
  if (isValidXY_(r[5], r[6])) {
    return {
      ts: r[0], cid: r[1], mode: r[9], x: r[5], y: r[6], quad: r[8],
      typeName: r[3], catname: r[4], persona: '', kit: r[7], holo: ''
    };
  }
  // 旧正規：ts,cid,x,y,quad,typeName,catname,persona,kit,holo
  if (isValidXY_(r[2], r[3])) {
    return {
      ts: r[0], cid: r[1], mode: '', x: r[2], y: r[3], quad: r[4],
      typeName: r[5], catname: r[6], persona: r[7], kit: r[8], holo: r[9]
    };
  }
  return o;
}
function isValidXY_(x, y) {
  const nx = Number(x), ny = Number(y);
  return isFinite(nx) && isFinite(ny) && nx >= 0 && nx <= 10 && ny >= 0 && ny <= 10;
}
function pick_(p, keys) { const o={}; keys.forEach(k => o[k]=p[k] || ''); return o; }
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function postDiscord_(p) {
  const kind = p.kind || '';
  let content = '';
  if (kind === 'cat') content = `🐾 **家猫カード生成**\nタイプ: ${p.typeName || ''}（${p.catname || ''}）\n座標: X=${p.x || ''} / Y=${p.y || ''}　象限: ${p.quad || ''}\nモード: ${p.mode || ''}`;
  else if (kind === 'vote') content = `🗳 **またたび会議 投票**\n${p.name || ''}（${p.catname || ''}）: ${p.vote || ''}\nfrom: ${p.nick || '名無しねこ'}`;
  else if (kind === 'idea') content = `🌿 **またたび会議 アイデア**\n${p.name || ''}（${p.catname || ''}）\n> ${p.idea || ''}\nfrom: ${p.nick || '名無しねこ'}`;
  else content = '🐾 家猫アプリ通知';
  const webhook = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  if (!webhook) return { ok: false, error: 'DISCORD_WEBHOOK_URL is not set in Script Properties' };
  const res = UrlFetchApp.fetch(webhook, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ username: '家猫またたび会議', content })
  });
  return { ok: res.getResponseCode() >= 200 && res.getResponseCode() < 300, status: res.getResponseCode() };
}
function setupDiscordWebhookOnce() {
  PropertiesService.getScriptProperties().setProperty('DISCORD_WEBHOOK_URL', 'PASTE_NEW_DISCORD_WEBHOOK_URL_HERE');
}
