import { describe, expect, it } from 'vitest';
import {
  addSeed,
  createField,
  type Field,
  index,
  laplacian,
  step,
  stepFast,
} from '@/core/grayScott2d';
import { DEFAULT_PARAMS } from '@/core/params';

const BOTH = { diffusion: true, reaction: true };
const DIFFUSION_ONLY = { diffusion: true, reaction: false };
const REACTION_ONLY = { diffusion: false, reaction: true };

const sum = (values: Float32Array) => values.reduce((total, value) => total + value, 0);

describe('index', () => {
  it('wraps past the edges to the other side', () => {
    const field = createField(4, 3);
    expect(index(field, -1, 0)).toBe(index(field, 3, 0));
    expect(index(field, 4, 0)).toBe(index(field, 0, 0));
    expect(index(field, 0, -1)).toBe(index(field, 0, 2));
    expect(index(field, 0, 3)).toBe(index(field, 0, 0));
  });
});

describe('laplacian', () => {
  it('is 0 where the amount is the same everywhere', () => {
    const field = createField(5, 5);
    expect(laplacian(field.u, field, 2, 2)).toBe(0);
  });

  it('is negative at a peak and positive next to it', () => {
    const field = createField(5, 5);
    field.v[index(field, 2, 2)] = 1;
    expect(laplacian(field.v, field, 2, 2)).toBe(-4);
    expect(laplacian(field.v, field, 3, 2)).toBe(1);
  });

  it('sees the other side of the grid at an edge', () => {
    const field = createField(5, 5);
    field.v[index(field, 4, 0)] = 1;
    expect(laplacian(field.v, field, 0, 0)).toBe(1);
  });
});

describe('step', () => {
  it('does nothing in a dish with no v', () => {
    const field = createField(8, 8);
    const next = step(field, DEFAULT_PARAMS, BOTH);
    expect(next.u.every((value) => value === 1)).toBe(true);
    expect(next.v.every((value) => value === 0)).toBe(true);
  });

  it('diffusion only spreads v out without changing the total', () => {
    let field = createField(16, 16);
    addSeed(field, 8, 8, 1);
    const before = sum(field.v);
    for (let i = 0; i < 20; i++) {
      field = step(field, DEFAULT_PARAMS, DIFFUSION_ONLY);
    }
    expect(sum(field.v)).toBeCloseTo(before, 3);
    // The peak got lower and a cell far from the seed got some v
    expect(field.v[index(field, 8, 8)]).toBeLessThan(0.25);
    expect(field.v[index(field, 8, 13)]).toBeGreaterThan(0);
  });

  it('reaction only changes each cell by itself, so v never leaves the seed', () => {
    let field = createField(16, 16);
    addSeed(field, 8, 8, 1);
    for (let i = 0; i < 20; i++) {
      field = step(field, DEFAULT_PARAMS, REACTION_ONLY);
    }
    expect(field.v[index(field, 8, 8)]).not.toBe(0.25);
    expect(field.v[index(field, 8, 11)]).toBe(0);
  });
});

describe('stepFast', () => {
  it('gives the same field as step', () => {
    let slow = createField(24, 16);
    addSeed(slow, 3, 2, 2);
    addSeed(slow, 20, 12, 3);
    let fast: Field = { ...slow, u: slow.u.slice(), v: slow.v.slice() };
    let spare = createField(24, 16);
    for (const terms of [BOTH, DIFFUSION_ONLY, REACTION_ONLY]) {
      for (let i = 0; i < 30; i++) {
        slow = step(slow, DEFAULT_PARAMS, terms);
        [fast, spare] = [stepFast(fast, DEFAULT_PARAMS, terms, spare), fast];
      }
      for (let i = 0; i < slow.v.length; i++) {
        expect(fast.u[i]).toBeCloseTo(slow.u[i], 6);
        expect(fast.v[i]).toBeCloseTo(slow.v[i], 6);
      }
    }
  });
});
