# 家猫カード名と ienekomap 表示名の一致修正

## 原因
`index.html` の診断結果カードでは、カード名として `persona`（例：ご近所大事猫、など）が表示されていました。
一方、`ienekomap.html` は共有CSV/GASから読み込んだ `catname`（46タイプ図鑑側の猫ネーム）をカード名として表示していました。

そのため、同じ診断結果でも

- index.html のカード名：`persona`
- ienekomap.html のカード名：`catname`

となり、カード名が違って見えていました。

## 修正方針
`ienekomap.html` 側では、表示カード名を次の優先順位に変更しました。

1. `cardName`
2. `persona`
3. `catname`
4. 無名の猫

つまり、indexで生成されたカードの表面名とmap上の表示名を合わせます。

## 変更ファイル

- `index_card_map_consistent.html`
  - 2軸診断のローカル保存に `cardName: persona` を追加
  - 8軸診断の送信に `persona: q.name` を追加

- `ienekomap_card_map_consistent.html`
  - `cardNameOf()` を追加
  - ギャラリー・詳細モーダル・地図ツールチップの表示名を `persona/cardName` 優先へ変更
  - 近い46タイプはサブ表示として残す

## 反映方法

GitHub上では以下のように置き換えてください。

- `index_card_map_consistent.html` → `index.html`
- `ienekomap_card_map_consistent.html` → `ienekomap.html`

Apps Scriptは、前回の `apps_script_code_fixed.gs` のままで動きます。

## 注意
既存のスプレッドシート行のうち、`persona` が空の行は過去データなので、mapでは従来通り `catname` 表示になります。
新しく index.html から生成したカードは、indexとmapで同じカード名になります。
