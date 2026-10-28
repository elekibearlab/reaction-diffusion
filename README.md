[English](README.en.md) | 日本語

# Reaction-Diffusion — 2D / 3D

反応拡散（Reaction-Diffusion）の代表的なモデル「Gray-Scott モデル」を Three.js で動かすサンプルです。\
2 つの物質が「となりへ広がる（拡散）」と「混ざって増える（反応）」を繰り返すだけで、斑点・迷路・波のような模様が生まれます。\
画面上部のメニューで 2D・3D を切り替えて遊べます。\
YouTube チャンネル「エレキベアのデジタルラボ」で紹介する予定です。

## できること

- **項を 1 つずつ試せる**（拡散だけ・反応だけ・両方）
- 模様のプリセットを選べる（分裂する斑点・迷路・サンゴ・穴・波）
- 補充 F・除去 k・拡散の速さを、スライダーで変えられる
- 2D はドラッグで v を置ける。「空にする」で皿を空にして、自分で種を描ける
- 盤面の大きさを選べる（2D は 192×108〜512×288、3D は 32³〜64³）
- 色を 3 種類から選べる
- 3D は立方体の中に育つ模様を、見せる量（しきい値）と断面で見られる。カメラを回せる
- FPS を表示するので、盤面の大きさと重さの関係を見られる

## 技術構成

- React 19
- TypeScript
- Vite
- Three.js
- Vitest
- Prettier

## 起動方法

**必要なもの**

- [Node.js](https://nodejs.org/) 22.12 以上

リポジトリのフォルダで、次のコマンドを実行します。

```bash
npm install
npm run dev
```

表示された URL（通常は `http://localhost:5173/`）をブラウザで開きます。

右上の「JA | EN」を押すか、URL に `?lang=en` を付けると英語で表示します。末尾を `#3d` にすると 3D の画面から開きます。

## キー操作

| キー | 操作 |
|---|---|
| Space | 再生 / 停止 |
| → | 1 コマ進める |
| 1〜7 | 模様を選ぶ |
| R | 種をまき直す |
| C | 皿を空にする（2D） |
| M | 2D ↔ 3D の切り替え |
| A | 自動回転（3D） |
| X | 半分に切って中を見る（3D） |
| + / − | 拡大 / 縮小（3D） |

## フォルダ構成

```
src/
  core/      Gray-Scott のコアロジック。まずここを読む
  data/      模様のプリセット
  view2d/    2D の画面
  view3d/    3D の画面
  ui/        2D と 3D で共通の部品
  shared/    キーボード操作・言語・色
tests/       テストコード
```

## コードの読みどころ

ロジックは `src/core/` にまとまっています。フレームワークに依存しない処理なので、ここを読むと仕組みが分かります。

1. **[`src/core/grayScott2d.ts`](src/core/grayScott2d.ts)** — 盤面 → ラプラシアン → 1 ステップ（拡散 + 反応）
2. **[`src/core/reaction.ts`](src/core/reaction.ts)** — 反応（U + 2V → 3V）。1 マスだけを見るので 2D と 3D で共通
3. **[`src/core/grayScott3d.ts`](src/core/grayScott3d.ts)** — 同じ順に並べた 3D 版。となりが 4 つから 6 つになるだけ
4. **[`src/core/params.ts`](src/core/params.ts)** — 拡散の速さ・補充・除去

1 マスの 1 ステップは、次の 2 行です（u は「えさ」、v は u を食べて増える物質）。

```ts
u += (du × ラプラシアン(u) − u·v² + F·(1 − u)) × DT  // 広がる − 食べられる + 補充される
v += (dv × ラプラシアン(v) + u·v² − (F + k)·v) × DT  // 広がる + 増える − 取り除かれる
```

ラプラシアンは「となりのマスの合計 − 自分 × となりの数」で、となりより少なければ増え、多ければ減ります（＝拡散）。\
v は u より広がるのが遅い（dv = du / 2）ので、v は固まって斑点になり、そのまわりに u が流れ込みます。これが模様の元です。

画面は `stepFast` を使います。中身は `step` と同じ式で、となりの添字を先に求めて速くしたものです（同じ結果になることをテストで確かめています）。

## 参考

- John E. Pearson, "Complex Patterns in a Simple System", *Science* 261 (1993)
- Robert Munafo, "Reaction-Diffusion by the Gray-Scott Model: Pearson's Parametrization" (mrob.com)

## ドキュメント

- [コードガイド](docs/code_guide.md) — 手を入れるときの決まり
