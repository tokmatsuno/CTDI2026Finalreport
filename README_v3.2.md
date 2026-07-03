# 家猫アプリ v3.2 「都市 × 猫」edition

## 変更点サマリ

### 🎨 UI
- 都市スカイライン＋歩く猫のヒーローセクション（`index.html` / `ienekomap.html`）
- 都市トーンの CSS 変数（`--city-navy` / `--city-copper` / `--city-glow` 等）を追加
- SVG による軽量アニメーション: 耳ピクピク（`earTwitch`）、尻尾ふりふり（`tailWave`）、肉球ステップ（`pawStep`）
- ボタン `.go` にグラデーション＋ホバー浮遊効果、タブに影付きホバー
- `.discord-hub` パネルで「またたび会議」を主役化、`.dchip` タグで「🍶 チュール議論 / 🌿 またたび議論 / 🏙 街の記録」を明示
- `.dbtn` は Discord ブランドカラー（#5865F2）＋Discord公式SVG付き

### 🔄 全端末同期
- `index.html` / `ienekomap.html` の `SHARED_API` を新GAS URLへ差替済
  - 旧: `AKfycbxRpYhB5mTB5O9zZ_VthkBvSwTLdOnGjeY6u6eZH_bw2tC0HLTTbDNd4-LhfjUfX7K2/exec`
  - 新: `AKfycbzBaagdobV2ixb6GwVpAFDmCN4tOwmvAseuPq8OvXnZsoOcUJ5kwD8Ih11TOKjYSf8U/exec`
- `logResult` を **GET+`action=record`** に変更（新GASと整合）。診断結果は毎回自動送信

### 💬 Discord連携（Embed＋スレッド自動作成）
GAS `Code.gs` を新規添付。次の3種類の Embed をwebhookに送信し、スレッドを自動作成します。

| トリガー | Embed色 | スレッド名 |
|---|---|---|
| 診断カード生成 (`record`) | 🔵 #1F3864 | `🍶 {猫ネーム} を語ろう` |
| またたび会議で投票 (`vote`) | 🟢 #2E9E5B | `🌿 またたび議論: {タイプ名}` |
| またたび会議のアイデア送信 (`idea`) | 🟡 #D6A400 | `🌿 またたび議論: {タイプ名}` |

Webhook URL は GAS 内にハードコード済（`WEBHOOK` 定数）。

## デプロイ手順

### 1. GAS の更新
1. https://docs.google.com/spreadsheets/d/1qjEheZWVJxPiw_tZfRrUnIsOCXIfE5x1y0Jeo8T670A/edit の「拡張機能 → Apps Script」を開く
2. 添付の `Code.gs` の内容で置き換え保存
3. 「デプロイ → 新しいデプロイ → ウェブアプリ」
   - 実行ユーザ: **自分**
   - アクセスできるユーザ: **全員**
4. 発行された `/exec` URL を確認（既存の `AKfycbzBaagdob...` と一致していれば追加作業不要）

### 2. GitHub Pages への反映
既存リポジトリの以下3ファイルを差し替え：
- `index.html`
- `ienekomap.html`
- `ienekoform.html`

CSV (`家猫_データソース.csv`) と `README.md` は現状維持で構いません。
git push すれば GitHub Pages が自動で更新されます。

### 3. 動作確認
- `index.html` を開き、診断カードを生成 → Discordチャンネルに Embed が届き、スレッドが自動作成されることを確認
- `ienekomap.html` を開き、右上「🟢 共有サーバに接続OK」が表示されることを確認
- 「またたび会議」で投票／アイデアを送ると、Discord に投稿されスレッドで議論可能なことを確認

## トラブルシュート

**Q. Discord に届かない**
→ GAS の実行ログ（表示 → ログ）で `UrlFetchApp.fetch` エラーを確認。Webhookが失効している場合は Discord チャンネル設定から再発行。

**Q. スレッドが作られない**
→ webhook末尾に `?wait=true` が付いているか（`Code.gs` の `_sendDiscord` 内）。付いていないと Discord は message id を返さずスレッド化ができない。

**Q. GAS の CORS で失敗する**
→ すべての通信を **GET** に統一しているため CORS プリフライトは発生しないはず。ブラウザ側で 401/403 が出る場合は「アクセス: 全員」を再確認。

## ファイル構成（変更なし）
```
/
├── index.html               ← 診断＋図鑑（今回改修）
├── ienekomap.html           ← 街の猫マップ（今回改修）
├── ienekoform.html          ← CSV編集ツール（軽微改修）
├── 家猫_データソース.csv    ← マスターデータ
└── Code.gs                  ← GAS中継（Apps Scriptに貼り付け）
```
