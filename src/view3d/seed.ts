import { addSeed, createField, type Field } from '@/core/grayScott3d';

/**
 * One seed for about this many cells, so a bigger grid gets more seeds and fills up in the same time.
 * Fewer per cell than 2D, because a seed in 3D grows in every direction and fills more space
 */
const CELLS_PER_SEED = 12000;
/** Half of a seed's side (cells). Smaller seeds fade away before they can grow */
const SEED_RADIUS = 3;

/**
 * Makes a cube full of u with cubes of v here and there.
 *
 * @param size   Cells on each side
 * @param random Random numbers in [0, 1). Tests pass a fixed sequence
 */
export function scatterSeeds(size: number, random = Math.random): Field {
  const field = createField(size);
  const count = Math.max(1, Math.round(size ** 3 / CELLS_PER_SEED));
  for (let i = 0; i < count; i++) {
    addSeed(
      field,
      Math.floor(random() * size),
      Math.floor(random() * size),
      Math.floor(random() * size),
      SEED_RADIUS,
    );
  }
  return field;
}
