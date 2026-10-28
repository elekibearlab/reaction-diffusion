/**
 * Numbers that decide the pattern. 2D and 3D use the same ones.
 *
 * The diffusion rates and the time step are the values used in most Gray-Scott demos
 * (a grid spacing of 1 and a time step of 1). Mostly feed and kill change between presets.
 */
export type Params = {
  /** How fast u spreads to its neighbors */
  du: number;
  /** How fast v spreads. Half of u, so v stays in spots while u flows in around it */
  dv: number;
  /** How fast u is added back toward 1 (the "food" poured into the dish) */
  feed: number;
  /** How fast v disappears */
  kill: number;
};

/**
 * Which terms of the equation are on. Both are on except in the "diffusion only" and "reaction only" presets,
 * which show what each term does by itself
 */
export type Terms = {
  diffusion: boolean;
  reaction: boolean;
};

/**
 * Time that one step moves forward.
 * The 3D Laplacian has 6 neighbors, so a step is stable only while du × DT ≤ 1/6.
 * With du = 0.16 that holds, so 2D and 3D can share the same numbers
 */
export const DT = 1;

export const DEFAULT_PARAMS: Params = {
  du: 0.16,
  dv: 0.08,
  feed: 0.0367,
  kill: 0.0649,
};
