import type { Params } from './params';

/*
 * The reaction part of Gray-Scott: U + 2V → 3V.
 * Two v and one u meet and become three v, so v grows by eating u. The chance of the three meeting is u·v·v.
 * These look at one cell only, so 2D and 3D use the same functions.
 */

/**
 * Change of u in one cell per unit time, without diffusion.
 *
 * @param u      Amount of u in the cell (0–1)
 * @param v      Amount of v in the cell (0–1)
 * @param params feed and kill
 */
export function reactU(u: number, v: number, params: Params): number {
  // Eaten by v, and filled back toward 1 by feed
  return -u * v * v + params.feed * (1 - u);
}

/**
 * Change of v in one cell per unit time, without diffusion.
 *
 * @param u      Amount of u in the cell (0–1)
 * @param v      Amount of v in the cell (0–1)
 * @param params feed and kill
 */
export function reactV(u: number, v: number, params: Params): number {
  // Grows by eating u, and is removed by feed + kill.
  // feed is a flow through the dish: the same flow that brings u in carries v out
  return u * v * v - (params.feed + params.kill) * v;
}
