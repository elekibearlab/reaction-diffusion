import { DT, type Params, type Terms } from './params';
import { reactU, reactV } from './reaction';

/**
 * Amounts of the two chemicals on a 2D grid.
 * u is the "food" that fills the dish, v eats u and grows. Both are 0–1.
 * The grid is a torus: the left edge touches the right edge, and the top touches the bottom.
 */
export type Field = {
  width: number;
  height: number;
  /** One value per cell, row by row from the bottom (index = y × width + x) */
  u: Float32Array;
  v: Float32Array;
};

/**
 * Makes a dish full of u with no v. Nothing happens until v is added (addSeed).
 *
 * @param width  Cells across
 * @param height Cells up
 */
export function createField(width: number, height: number): Field {
  return {
    width,
    height,
    u: new Float32Array(width * height).fill(1),
    v: new Float32Array(width * height),
  };
}

/**
 * Array index of a cell. A position past an edge comes back from the other side.
 *
 * @param field The grid
 * @param x     Column (may be −1 or width)
 * @param y     Row (may be −1 or height)
 */
export function index(field: Field, x: number, y: number): number {
  const wx = (x + field.width) % field.width;
  const wy = (y + field.height) % field.height;
  return wy * field.width + wx;
}

/**
 * Puts a square of v in the dish, where the pattern starts to grow.
 * u is lowered at the same time, as if v had already eaten some of it.
 *
 * @param field  The grid. Changed in place
 * @param cx     Column of the center
 * @param cy     Row of the center
 * @param radius Half of the square's side (cells)
 */
export function addSeed(field: Field, cx: number, cy: number, radius: number) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      const i = index(field, x, y);
      field.u[i] = 0.5;
      field.v[i] = 0.25;
    }
  }
}

/**
 * Laplacian of one cell: (sum of the 4 neighbors) − 4 × (the cell).
 * Positive when the neighbors have more than the cell, so diffusion moves the amount toward them.
 *
 * @param values u or v
 * @param field  The grid (for its size)
 * @param x      Column
 * @param y      Row
 */
export function laplacian(values: Float32Array, field: Field, x: number, y: number): number {
  // The 4 neighbors: left, right, below, above
  const sum =
    values[index(field, x - 1, y)] +
    values[index(field, x + 1, y)] +
    values[index(field, x, y - 1)] +
    values[index(field, x, y + 1)];
  return sum - 4 * values[index(field, x, y)];
}

/**
 * Moves the field forward one step: diffusion + reaction for every cell, at the same time.
 * Every cell reads the old field and writes into `next`, so the order of the cells does not matter.
 *
 * @param field  The field now. Not changed
 * @param params Diffusion rates, feed and kill
 * @param terms  Which terms are on
 * @param next   Where to write. Pass the field from the step before to reuse its arrays
 * @returns `next`
 */
export function step(
  field: Field,
  params: Params,
  terms: Terms,
  next: Field = createField(field.width, field.height),
): Field {
  for (let y = 0; y < field.height; y++) {
    for (let x = 0; x < field.width; x++) {
      const i = index(field, x, y);
      const u = field.u[i];
      const v = field.v[i];
      let du = 0;
      let dv = 0;
      if (terms.diffusion) {
        du += params.du * laplacian(field.u, field, x, y);
        dv += params.dv * laplacian(field.v, field, x, y);
      }
      if (terms.reaction) {
        du += reactU(u, v, params);
        dv += reactV(u, v, params);
      }
      next.u[i] = u + du * DT;
      next.v[i] = v + dv * DT;
    }
  }
  return next;
}

/**
 * Same result as `step`, several times faster. The screens use this one; `step` is the one to read.
 * `index` wraps with % for every neighbor, which is most of the time in `step`.
 * Here the neighbors' indexes are worked out once per row and column, and the terms are written inline.
 * tests/grayScott2d.test.ts checks that both give the same field.
 *
 * @param field  The field now. Not changed
 * @param params Diffusion rates, feed and kill
 * @param terms  Which terms are on
 * @param next   Where to write. Must be a different field from `field`
 * @returns `next`
 */
export function stepFast(field: Field, params: Params, terms: Terms, next: Field): Field {
  const { width, height, u: us, v: vs } = field;
  const { u: nextU, v: nextV } = next;
  const du = terms.diffusion ? params.du : 0;
  const dv = terms.diffusion ? params.dv : 0;
  const react = terms.reaction ? 1 : 0;
  const { feed, kill } = params;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const down = (y === 0 ? height - 1 : y - 1) * width;
    const up = (y === height - 1 ? 0 : y + 1) * width;
    for (let x = 0; x < width; x++) {
      const left = x === 0 ? width - 1 : x - 1;
      const right = x === width - 1 ? 0 : x + 1;
      const i = row + x;
      const u = us[i];
      const v = vs[i];
      const lapU = us[row + left] + us[row + right] + us[down + x] + us[up + x] - 4 * u;
      const lapV = vs[row + left] + vs[row + right] + vs[down + x] + vs[up + x] - 4 * v;
      const uvv = u * v * v;
      nextU[i] = u + (du * lapU + react * (-uvv + feed * (1 - u))) * DT;
      nextV[i] = v + (dv * lapV + react * (uvv - (feed + kill) * v)) * DT;
    }
  }
  return next;
}
