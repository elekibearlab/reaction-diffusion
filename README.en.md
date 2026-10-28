English | [日本語](README.md)

# Reaction-Diffusion — 2D / 3D

A sample that runs the Gray-Scott model, a classic reaction-diffusion model, with Three.js.\
Two chemicals only "spread to the cells next door (diffusion)" and "meet and multiply (reaction)", and patterns like spots, mazes and waves appear.\
Switch between 2D and 3D from the menu at the top.\
It will be featured on the YouTube channel "Elekibear Digital Lab".

## Features

- **Try each term by itself** (diffusion only, reaction only, both)
- Choose a pattern preset (coral, maze, dividing spots, waves, holes)
- Change feed F, kill k and the diffusion rates with sliders
- In 2D, drag to add v. "Clear" empties the dish so you can draw your own seeds
- Choose the grid size (2D: 192×108 to 512×288, 3D: 32³ to 64³)
- Choose from 3 color sets
- In 3D, see the pattern growing inside a cube, with a threshold and a cut view. The camera can be turned
- Shows the FPS, so you can see how the grid size affects the load

## Tech stack

- React 19
- TypeScript
- Vite
- Three.js
- Vitest
- Prettier

## Getting started

**Requirements**

- [Node.js](https://nodejs.org/) 22.12 or later

Run these commands in the repository folder.

```bash
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173/`) in your browser.

Press "JA | EN" at the top right, or add `?lang=en` to the URL, to show English. End the URL with `#3d` to open the 3D screen.

## Keys

| Key | Action |
|---|---|
| Space | Play / stop |
| → | Step one frame |
| 1–7 | Choose a pattern (6 and 7: diffusion only, reaction only) |
| R | Seed again |
| C | Clear the dish (2D) |
| M | Switch 2D ↔ 3D |
| A | Auto rotate (3D) |
| X | Cut in half to see inside (3D) |
| + / − | Zoom in / out (3D) |

## Folders

```
src/
  core/      Gray-Scott core logic. Read this first
  data/      Pattern presets
  view2d/    The 2D screen
  view3d/    The 3D screen
  ui/        Parts shared by 2D and 3D
  shared/    Keyboard, language and colors
tests/       Tests
```

## Where to read the code

The logic is in `src/core/`. It does not depend on any framework, so reading it shows how it works.

1. **[`src/core/grayScott2d.ts`](src/core/grayScott2d.ts)** — grid → Laplacian → one step (diffusion + reaction)
2. **[`src/core/reaction.ts`](src/core/reaction.ts)** — the reaction (U + 2V → 3V). It looks at one cell only, so 2D and 3D share it
3. **[`src/core/grayScott3d.ts`](src/core/grayScott3d.ts)** — the 3D version in the same order. Only the neighbors go from 4 to 6
4. **[`src/core/params.ts`](src/core/params.ts)** — diffusion rates, feed and kill

One step of one cell is these two lines (u is the "food", v eats u and grows).

```ts
u += (du × laplacian(u) − u·v² + F·(1 − u)) × DT  // spreads − eaten + fed
v += (dv × laplacian(v) + u·v² − (F + k)·v) × DT  // spreads + grows − removed
```

The Laplacian is "sum of the neighbors − the cell × the number of neighbors": a cell with less than its neighbors gains, a cell with more loses (that is diffusion).\
v spreads slower than u (dv = du / 2), so v gathers into spots and u flows in around them. This is where the patterns come from.

The screens use `stepFast`. It is the same equation as `step`, made faster by working out the neighbors' indexes first (tests check they give the same result).

## References

- John E. Pearson, "Complex Patterns in a Simple System", *Science* 261 (1993)
- Robert Munafo, "Reaction-Diffusion by the Gray-Scott Model: Pearson's Parametrization" (mrob.com)

## Docs

- [Code guide](docs/code_guide.md) (Japanese) — rules for changing the code
