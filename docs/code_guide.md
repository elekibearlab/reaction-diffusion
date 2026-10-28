# コードガイド

このサンプルに手を入れるときの決まり。いちばん大事なのは **「Gray-Scott の式（拡散と反応）が真っ先に読める」こと**。
機能を足すより、読んで分かることを優先する。作りは game-of-life・boids サンプルにそろえている。

## 構成

React は画面の組み立てと操作パネルだけを担当し、描画は Three.js の API を直接書く（React Three Fiber は使わない）。

```
src/
  core/                Gray-Scott のロジック。React も three も import しない。まずここを読む
    params.ts           拡散の速さ（du・dv）・補充 feed・除去 kill と、1 ステップの時間 DT
    reaction.ts         反応（U + 2V → 3V）。1 マスだけを見るので 2D と 3D で共通
    grayScott2d.ts      盤面 → 作る → 添字 → 種を置く → ラプラシアン → 1 ステップ（step）→ 速い版（stepFast）
    grayScott3d.ts      3D 版。grayScott2d.ts と同じ順・同じ中身。違うのは z があり、となりが 6 つになることだけ
  data/
    presets.ts          模様のプリセット 7 種（両方の項で出る模様 5 つ → 拡散だけ・反応だけ。2D と 3D で共通）
  view2d/              2D の画面（平らな皿。v の量を色にしたテクスチャ 1 枚）
    ReactionDiffusion2D.tsx  入口。UI に出す state を持ち、部品を組み立てる
    seed.ts  types.ts        最初の種のまき方と、画面の中で共有する型
    components/         React の部品（PascalCase.tsx だけ）
    scene/              Three.js の描画。useFieldScene と、React を知らない描画処理（camelCase.ts だけ）
  view3d/              3D の画面（v がしきい値以上のマスを立方体で描く。view2d と同じ並び）
  ui/                  2D と 3D の両方で使う React の部品
  shared/              2D と 3D の両方で使う、部品ではない処理（言語・キーボード・色）
  App.tsx              タイトルと 2D / 3D のメニュー
tests/                 Vitest。core を直接テストする
```

## 依存方向

```
core  →  data  →  view2d / view3d  →  App
          ↑             ↑
        shared  ───→   ui
```

- **view2d と view3d は直接 import し合わない**。両方で使うものは `ui/`（React の部品）か `shared/`（それ以外）に置く。
- `shared/` は three を import しない（`palette.ts` は色の表を返すだけで、テクスチャやインスタンスの色にするのは各 view）。

## コアロジックの書き方

- `grayScott2d.ts` は上から **盤面の形 → 作る → 添字 → 種を置く → ラプラシアン → 1 ステップ（`step`）→ 速い版（`stepFast`）** の順。
- `step` は 1 マスごとに「拡散（`du × ラプラシアン`）」と「反応（`reactU` / `reactV`）」を足し、`DT` を掛けて次の盤面へ書く。
  どちらの項を使うかは `Terms` で切り替える（プリセットの「拡散だけ」「反応だけ」）。
- 盤面は 2 枚を交互に使う（古い盤面を読み、新しい盤面に書く）。同じ配列に書くと、先に書いたマスを後のマスが読んでしまうため。
- 端は反対側とつながる（トーラス）。`index` が `%` で折り返す。
- `grayScott3d.ts` は `grayScott2d.ts` をそのまま写し、z の分だけを変える。反応は `reaction.ts` を共通で使う。
  `tests/grayScott3d.test.ts` が「z の向きに一様なら 2D と同じ動き」を確かめている。
- 素直な `step` が説明用の基準。画面は `stepFast`（`%` を使わず、となりの添字を行・列ごとに 1 回だけ求め、式を展開したもの）を使う。
  両者の結果が同じことはテストで確かめる。式を変えたら両方を直す。

## 数値

- `du = 0.16`・`dv = 0.08`・`DT = 1` は多くの Gray-Scott のデモと同じ値。プリセットで変わるのは feed と kill だけ。
- 3D のラプラシアンはとなりが 6 つなので、`du × DT ≤ 1/6` でないと値が発散する。パネルの拡散のスライダーの上限を 0.16 にしているのはこのため。
- 同じ feed・kill でも 2D と 3D で出る模様がずれる。3D で別の値が要るプリセットは `in3d` に書く（いまはサンゴだけ）。
- プリセットの値は Pearson（1993）と Munafo の F-k の地図から取り、種の大きさ（`seed.ts`）と合わせて画面で確かめて決めた。
  元の値で消えてしまったもの（波）は、近くで動き続ける値に変えて、理由をコメントに書いている。

## 状態

- 再生中・速さ・数値・表示など UI に出す値は、各画面（`ReactionDiffusion2D` / `ReactionDiffusion3D`）の React state に置く。
- 盤面は毎ステップ変わるので React state に入れず、`useFieldScene` の ref に持つ。描画ループも React の外で回す。
- シミュレーションは 1/60 秒ごとに「速さ」の回数だけステップを進める（画面の fps によって進み方が変わらないように）。
  遅れを取り戻すのは 1 フレームに 2 回分まで（`MAX_FRAMES_PER_FRAME`）。重いときはゆっくり進む。
- プリセットを選ぶと種をまき直す。前の模様から始めると、見える模様が前に選んだものによって変わるため。
- 盤面の大きさのようにシーンの作り直しが要る変更は、`FieldCanvas` の `key` を変えて作り直す。

## 表示・見た目

- 色・しきい値・断面などの表示はすべて模様の動きに影響させない。
- 色は v の量を `shared/palette.ts` の表で引く。v は 0.4 程度までしか増えないので、0〜0.4 を色の端から端に当てている（`VALUE_RANGE`）。
- 3D は v がしきい値以上のマスだけを InstancedMesh の立方体で描く。盤面か表示が変わったときだけ書き直す。
- 画面の文字の決まり（`t({ ja, en })`・`?lang=en`・iframe の中では切り替えを出さない）は game-of-life と同じ。

## 命名・コメント・書式

- 命名・JSDoc・Prettier・`if` の本体を必ず `{ }` で囲む、などは game-of-life のコードガイドと同じ。
- コード中のコメントは英語で、**なぜその形にしたか**を書く。調整用の数値は名前付き定数にしてファイル先頭に置く。

## 確認

```bash
npm run typecheck
npm test
npm run format:check
npm run build
```
