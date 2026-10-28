import { addSeed, createField, type Field } from '@/core/grayScott2d';

/** One seed for about this many cells, so a bigger grid gets more seeds and fills up in the same time */
const CELLS_PER_SEED = 2000;
/** Half of a seed's side (cells). Smaller seeds fade away before they can grow */
const SEED_RADIUS = 3;

/**
 * Makes a dish full of u with squares of v here and there.
 *
 * @param width  Cells across
 * @param height Cells up
 * @param random Random numbers in [0, 1). Tests pass a fixed sequence
 */
export function scatterSeeds(width: number, height: number, random = Math.random): Field {
  const field = createField(width, height);
  const count = Math.max(1, Math.round((width * height) / CELLS_PER_SEED));
  for (let i = 0; i < count; i++) {
    addSeed(field, Math.floor(random() * width), Math.floor(random() * height), SEED_RADIUS);
  }
  return field;
}
