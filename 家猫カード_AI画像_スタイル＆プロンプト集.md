# 家猫カード AI画像 スタイルガイド＆プロンプト集

PDFの絵柄を基準に、**8軸の「基準猫顔」＋軸の深度（5段階）で変わる背景**を、著作権リスクを抑えて生成するための一式です。
猫イラストだけをAIで生成し、カード枠・ステータスバー・文字はアプリ側のオリジナルSVG/CSSで重ねます。

> 免責：以下は一般的な情報であり法的助言ではありません。商用・配布の最終判断は弁護士等にご確認ください。

---

## 0. 著作権を「クリア」にするための要点

1. **オリジナル創作にする**：プロンプトに「特定の作家名」「既存キャラクター」「実在ブランド/商標/ロゴ」「既存カードゲームの枠（ポケカ・遊戯王・MTG等）」「実在の人物」を**入れない**。本資料の猫は当方のオリジナル設定です。
2. **権利がクリアなツールを優先**：学習データがライセンス済みで、商用利用可＋**補償（indemnification）**を明示するサービスは安全度が高い。
   - **Adobe Firefly**（Adobe Stock等のライセンス/パブリックドメイン学習、対象プランで知財補償、透過PNG書き出し可）← 版権重視なら第一候補
   - **Bria**（100%ライセンス学習・API・商用補償）
   - **Getty Images / iStock の生成AI**、**Shutterstock AI**（ライセンス素材ベース・商用クリア）
   - Midjourney / DALL·E（ChatGPT）：出力の所有・商用利用は各社規約で概ね可だが、学習データ起因の論点は係争中。版権を厳密にクリアしたい用途では上記を推奨。
3. **枠・文字・フォントもオリジナル/商用可ライセンス**：カード枠は当方SVG、フォントは Noto Sans（SIL OFL・商用可）など。AIに「枠ごと」描かせない（枠は重ねる）。
4. **画像内に文字・ロゴを描かせない**（誤った商標混入を防ぐ）。タイトル等はアプリ側で載せる。
5. **生成後チェック**：Google画像検索／TinEye等で既存作品との酷似がないか確認。生成元・日時・プロンプトを記録（後述の台帳）。

---

## 1. 共通スタイルアンカー（全カードの先頭に付ける）

PDFの雰囲気（太い黒主線・やわらかいセル塗り・擬人化した可愛い猫の上半身・温かい色）を再現します。

**PDF基準の絵柄メモ**：擬人化した猫が**人間の服を着て立っている上半身（腰から上）**の姿。役割を表す小物を持ち、頭は丸く・猫らしい顔（大きめの目）。**太い黒の主線＋やわらかい暖色のセル塗り**、絵本＋トレカ風。毛色は三毛・キジトラ・グレー・黒・白・シャムなどタイプごとに替える。

**英語プロンプト（推奨・全ツール共通の核）**
```
cute original anthropomorphic house-cat character, standing, waist-up (upper body) facing viewer,
wearing human clothing, holding a small role-related prop,
kawaii Japanese storybook trading-card illustration,
thick clean black outline, soft warm cel shading, gentle warm palette,
rounded head with expressive cat eyes, wholesome and charming,
clean original character design, high detail, centered composition
```
（毛色はタイプに合わせて指定：例 `calico coat` / `brown tabby` / `grey tabby` / `tuxedo black-and-white` / `solid black` / `cream siamese` など）

**ネガティブ（避ける要素）**
```
no text, no letters, no logo, no watermark, no signature, no brand, no trademark,
no existing cartoon character, no real person, not a trading card frame, no border,
no photorealism, no horror, no nsfw, no extra limbs, no deformed paws
```

**一貫性のコツ**：同じ猫の作風で揃えるため、(a) 上記スタイル文を**毎回まったく同じ文面**で先頭に付ける、(b) 1枚“決め画”を作って**参照画像／スタイル参照**に使う（Firefly「スタイル参照」、Midjourney `--sref`、SD は seed 固定＋同一モデル）、(c) 透過で書き出して背景と分離。

---

## 2. 8軸「基準猫顔」プロンプト（透過・背景なし）

各軸の“家猫化が極まった側”を象徴する**顔・表情・小物**。背景は付けず、後で重ねます。
末尾に各ツール用の指定（§4）を足してください。Fireflyなら「透過背景」をON、他は「plain solid pastel background, easy to cut out」を付与。

> 使い方：`[共通スタイルアンカー] + [下の軸文] + isolated character, plain solid pastel background, easy to cut out + [§4のツール指定]`

1. **経済自立（養われる猫）**
   `a plump well-fed content cat, soft cheeks, relaxed satisfied half-smile, tiny empty coin purse on a ribbon, paws resting, cozy fed look`
2. **意思決定（おまかせ猫）**
   `a cat with a gentle blank trusting expression, slight shrug of the shoulders, tilting head, "you decide" easygoing mood, soft eyes`
3. **依存先（飼い主に懐く猫）**
   `an affectionate cat gazing upward adoringly, wearing a neat collar with a small tag, seeking-care expression, sweet and attached`
   ※公的寄り＝濃紺の襟＋小さな丸バッジ／私的寄り＝クリーム色の襟＋小さな鈴、に色替えすると軸の向きを表現できます。
4. **自覚（とろ〜ん満足猫）**
   `a blissfully unaware cat, droopy half-closed content eyes, soft dreamy smile, totally at ease, "everything is fine" vibe`
5. **つながり（ひとり快適猫）**
   `a calm solitary cat enjoying being alone, slightly aloof but cozy, one paw holding a warm mug, self-contained serene look`
6. **生活技能（外注おまかせ猫）**
   `a helpless pampered cat with soft useless paws raised, surrounded by tiny plain delivery boxes, "someone will do it" expression`
7. **情報・注意の主権（画面に釘付け猫）**
   `a mesmerized cat, wide glassy eyes reflecting a soft glowing screen light on its face, transfixed dazed expression, holding a blank tablet (no logo)`
8. **参加・当事者性（傍観猫）**
   `a passive onlooker cat watching from behind a window, chin resting on paws, mildly indifferent bystander expression, detached calm`

---

## 3. 「深度で変わる背景」プロンプト（各軸 × 5段階）

背景＝**自律↔家猫化の深さ**を表現。低いほど外・開放・質素、高いほど閉じた快適・全自動・“金の檻”。
共通ランプ（背景のみ・キャラなし）に、各軸の小物を差し替えます。**キャラは描かない**（`no character, background only`）。

**共通の背景ランプ（depth 1→5）**
```
1 (Very Low / 半野良) : open outdoor dusk scene, alley or grassy lot, free and a bit bare, cool airy light, background only
2 (Low)               : a doorway between outside and a modest room, transitional, soft daylight, background only
3 (Medium)            : a plain simple room with a few comforts, neutral cozy, background only
4 (High)              : a warm well-equipped cozy room, soft lamps and conveniences, inviting, background only
5 (Very High / 純家猫) : a luxurious fully-automated comfort cocoon, plush and gilded, a beautiful gilded-cage feeling, background only
```
共通ネガティブ：`no character, no cat, no text, no logo, no watermark, no people`

**各軸で差し替える“小物・場面”（上のランプに足す）**

| 軸 | depth1（外/自律寄り） | depth5（全面依存寄り）に向けて増やす要素 |
|---|---|---|
| 経済自立 | 屋外で自分で探し回る雰囲気 | 豪華に給仕される食卓・満たされた食器が増える |
| 意思決定 | 分かれ道・選択肢のある屋外 | すべて用意・お膳立てされた整然空間 |
| 依存先 | 誰もいない開けた場所 | 手厚く世話される室内（公的＝役所風／私的＝家庭・店舗風） |
| 自覚 | 風通しのよい明るい外 | まどろむ快楽的な薄明かりの繭 |
| つながり | 人けのある広場 | 心地よいが閉じた一人空間 |
| 生活技能 | 質素で何もない屋外 | 宅配箱・全自動機器に囲まれた部屋 |
| 情報主権 | 看板の少ない静かな通り | 壁一面の光るスクリーンに囲まれた部屋（ロゴなし） |
| 参加 | にぎわう街角・集会 | 窓の内側から眺めるだけの閉じた室内 |

> 例（情報主権 depth5）：`a luxurious fully-automated comfort cocoon, plush and gilded, walls full of softly glowing blank screens (no logos, no text), gilded-cage feeling, background only` ＋ 共通ネガティブ。

---

## 4. ツール別の付け方

- **Adobe Firefly / Bria / Getty（版権重視・推奨）**：上記英語プロンプトをそのまま入力。Fireflyは「縦長 3:4」、参照スタイルに決め画を指定、基準顔は**背景透過**で書き出し。商用設定・補償の対象プランを使用。
- **ChatGPT / DALL·E**：自然文でOK。`square or portrait, plain pastel background, no text, original character` を明記。一貫性は前の画像を添付して「同じ作風・同じ猫で」と指示。
- **Midjourney / Niji**：末尾にパラメータ `--ar 3:4 --niji 6 --style cute --sref <決め画URL> --no text,logo,watermark,frame`。基準顔は `--no background` 風に「plain pastel background」を明記（透過は外部で抜く）。
- **Stable Diffusion**：タグ式に分解＋上のネガティブをNegative欄へ。`seed` 固定＋同一モデル/LoRAで作風統一。透過は `rembg` 等で抜く。

---

## 5. アプリ差し込み用の命名規則（重要）

改修後アプリは `images/` フォルダの画像を自動で使います（無ければ従来SVG表示）。次の名前で保存してください。

- **8軸の基準顔（透過PNG）**：`images/face_axis1.png` … `face_axis8.png`
  （軸番号：1経済自立／2意思決定／3依存先／4自覚／5つながり／6生活技能／7情報主権／8参加）
- **各軸の深度背景**：`images/bg_axis1_d1.png` … `bg_axis1_d5.png`（軸ごとに d1〜d5）
- **46タイプ図鑑のキャラ（任意・透過PNG）**：`images/cat_01.png` … `cat_46.png`（番号は図鑑のNo.）
- 推奨サイズ：基準顔 1024×1024（透過）／背景 1024×1365（縦3:4）／図鑑キャラ 1024×1024（透過）

## 6. 生成台帳（権利管理のため記録推奨）

| ファイル名 | ツール | プラン/ライセンス | 生成日 | プロンプト要旨 | 酷似チェック |
|---|---|---|---|---|---|
| face_axis1.png | Firefly | 有償・商用/補償 | 2026-06-26 | 養われる猫 透過 | OK |

---

## まとめ（手順）

1. §1のスタイルアンカーを固定し、決め画を1枚作る（作風の基準）。
2. §2で8軸の基準顔を**透過**生成 → `images/face_axisN.png`。
3. §3で各軸の背景を**5段階**生成 → `images/bg_axisN_dM.png`。
4. （任意）§2応用で46キャラ → `images/cat_NN.png`。
5. 改修版アプリの `images/` に置く → 自動でカードに反映、深度スライダーで背景が切替。
6. §6の台帳に記録。
