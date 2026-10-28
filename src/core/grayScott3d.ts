import { DT, type Params, type Terms } from './params';
import { reactU, reactV } from './reaction';

/**
 * Amounts of the two chemicals in a 3D grid (a cube).
 * Same as grayScott2d.ts with a z added. The grid is a torus on every face.
 */
export type Field = {
  /** Cells on each side of the cube */
  size: number;
  /** One value per cell (index = (z × size + y) × size + x) */
  u: Float32Array;
  v: Float32Array;
};

/**
 * Makes a cube full of u with no v. Nothing happens until v is added (addSeed).
 *
 * @param size Cells on each side
 */
export function createField(size: number): Field {
  return {
    size,
    u: new Float32Array(size ** 3).fill(1),
    v: new Float32Array(size ** 3),
  };
}

/**
 * Array index of a cell. A position past a face comes back from the other side.
 *
 * @param field The grid
 * @param x     Column (may be −1 or size)
 * @param y     Row (may be −1 or size)
 * @param z     Layer (may be −1 or size)
 */
export function index(field: Field, x: number, y: number, z: number): number {
  const n = field.size;
  const wx = (x + n) % n;
  const wy = (y + n) % n;
  const wz = (z + n) % n;
  return (wz * n + wy) * n + wx;
}

/**
 * Puts a cube of v in the field, where the pattern starts to grow.
 * u is lowered at the same time, as if v had already eaten some of it.
 *
 * @param field  The grid. Changed in place
 * @param cx     Column of the center
 * @param cy     Row of the center
 * @param cz     Layer of the center
 * @param radius Half of the cube's side (cells)
 */
export function addSeed(field: Field, cx: number, cy: number, cz: number, radius: number) {
  for (let z = cz - radius; z <= cz + radius; z++) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const i = index(field, x, y, z);
        field.u[i] = 0.5;
        field.v[i] = 0.25;
      }
    }
  }
}

/**
 * Laplacian of one cell: (sum of the 6 neighbors) − 6 × (the cell).
 * Positive when the neighbors have more than the cell, so diffusion moves the amount toward them.
 *
 * @param values u or v
 * @param field  The grid (for its size)
 * @param x      Column
 * @param y      Row
 * @param z      Layer
 */
export function laplacian(
  values: Float32Array,
  field: Field,
  x: number,
  y: number,
  z: number,
): number {
  // The 6 neighbors: left, right, below, above, behind, in front
  const sum =
    values[index(field, x - 1, y, z)] +
    values[index(field, x + 1, y, z)] +
    values[index(field, x, y - 1, z)] +
    values[index(field, x, y + 1, z)] +
    values[index(field, x, y, z - 1)] +
    values[index(field, x, y, z + 1)];
  return sum - 6 * values[index(field, x, y, z)];
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
  next: Field = createField(field.size),
): Field {
  const n = field.size;
  for (let z = 0; z < n; z++) {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const i = index(field, x, y, z);
        const u = field.u[i];
        const v = field.v[i];
        let du = 0;
        let dv = 0;
        if (terms.diffusion) {
          du += params.du * laplacian(field.u, field, x, y, z);
          dv += params.dv * laplacian(field.v, field, x, y, z);
        }
        if (terms.reaction) {
          du += reactU(u, v, params);
          dv += reactV(u, v, params);
        }
        next.u[i] = u + du * DT;
        next.v[i] = v + dv * DT;
      }
    }
  }
  return next;
}

/**
 * Same result as `step`, several times faster. The screens use this one; `step` is the one to read.
 * `index` wraps with % for every neighbor, which is most of the time in `step`.
 * Here the neighbors' indexes are worked out once per layer, row and column, and the terms are written inline.
 * tests/grayScott3d.test.ts checks that both give the same field.
 *
 * @param field  The field now. Not changed
 * @param params Diffusion rates, feed and kill
 * @param terms  Which terms are on
 * @param next   Where to write. Must be a different field from `field`
 * @returns `next`
 */
export function stepFast(field: Field, params: Params, terms: Terms, next: Field): Field {
  const { size: n, u: us, v: vs } = field;
  const { u: nextU, v: nextV } = next;
  const layer = n * n;
  const du = terms.diffusion ? params.du : 0;
  const dv = terms.diffusion ? params.dv : 0;
  const react = terms.reaction ? 1 : 0;
  const { feed, kill } = params;
  for (let z = 0; z < n; z++) {
    const slab = z * layer;
    const back = (z === 0 ? n - 1 : z - 1) * layer;
    const front = (z === n - 1 ? 0 : z + 1) * layer;
    for (let y = 0; y < n; y++) {
      const row = y * n;
      const down = (y === 0 ? n - 1 : y - 1) * n;
      const up = (y === n - 1 ? 0 : y + 1) * n;
      for (let x = 0; x < n; x++) {
        const left = x === 0 ? n - 1 : x - 1;
        const right = x === n - 1 ? 0 : x + 1;
        const i = slab + row + x;
        const u = us[i];
        const v = vs[i];
        const lapU =
          us[slab + row + left] +
          us[slab + row + right] +
          us[slab + down + x] +
          us[slab + up + x] +
          us[back + row + x] +
          us[front + row + x] -
          6 * u;
        const lapV =
          vs[slab + row + left] +
          vs[slab + row + right] +
          vs[slab + down + x] +
          vs[slab + up + x] +
          vs[back + row + x] +
          vs[front + row + x] -
          6 * v;
        const uvv = u * v * v;
        nextU[i] = u + (du * lapU + react * (-uvv + feed * (1 - u))) * DT;
        nextV[i] = v + (dv * lapV + react * (uvv - (feed + kill) * v)) * DT;
      }
    }
  }
  return next;
}
