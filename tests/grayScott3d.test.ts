import { describe, expect, it } from 'vitest';
import * as grid2d from '@/core/grayScott2d';
import {
  addSeed,
  createField,
  type Field,
  index,
  laplacian,
  step,
  stepFast,
} from '@/core/grayScott3d';
import { DEFAULT_PARAMS } from '@/core/params';

const BOTH = { diffusion: true, reaction: true };

describe('laplacian', () => {
  it('has 6 neighbors', () => {
    const field = createField(5);
    field.v[index(field, 2, 2, 2)] = 1;
    expect(laplacian(field.v, field, 2, 2, 2)).toBe(-6);
    expect(laplacian(field.v, field, 2, 2, 3)).toBe(1);
  });

  it('sees the other side of the grid at a face', () => {
    const field = createField(5);
    field.v[index(field, 0, 0, 4)] = 1;
    expect(laplacian(field.v, field, 0, 0, 0)).toBe(1);
  });
});

describe('step', () => {
  it('moves the same as 2D when nothing changes along z', () => {
    // A 2D pattern copied to every layer: the two neighbors along z are the cell itself,
    // so the 3D Laplacian is the 2D one and both grids must move the same
    const size = 12;
    let flat = grid2d.createField(size, size);
    grid2d.addSeed(flat, 4, 6, 2);
    let cube = createField(size);
    for (let z = 0; z < size; z++) {
      cube.u.set(flat.u, z * size * size);
      cube.v.set(flat.v, z * size * size);
    }
    for (let i = 0; i < 40; i++) {
      flat = grid2d.step(flat, DEFAULT_PARAMS, BOTH);
      cube = step(cube, DEFAULT_PARAMS, BOTH);
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        expect(cube.v[index(cube, x, y, 7)]).toBeCloseTo(flat.v[grid2d.index(flat, x, y)], 6);
      }
    }
  });
});

describe('stepFast', () => {
  it('gives the same field as step', () => {
    let slow = createField(10);
    addSeed(slow, 2, 3, 4, 2);
    addSeed(slow, 8, 8, 0, 1);
    let fast: Field = { ...slow, u: slow.u.slice(), v: slow.v.slice() };
    let spare = createField(10);
    for (let i = 0; i < 30; i++) {
      slow = step(slow, DEFAULT_PARAMS, BOTH);
      [fast, spare] = [stepFast(fast, DEFAULT_PARAMS, BOTH, spare), fast];
    }
    for (let i = 0; i < slow.v.length; i++) {
      expect(fast.u[i]).toBeCloseTo(slow.u[i], 6);
      expect(fast.v[i]).toBeCloseTo(slow.v[i], 6);
    }
  });
});
