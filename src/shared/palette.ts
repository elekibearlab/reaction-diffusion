import type { LocalizedText } from './i18n';

/**
 * Colors for the amount of v. Both screens use them.
 * This file does not import three; each screen turns the table into a texture or instance colors.
 */
export type Palette = 'cyan' | 'mono' | 'fire';

/**
 * v rarely goes past this, so this amount gets the last color.
 * Mapping 0–1 would leave the pattern dark, because spots of v are about 0.3
 */
const VALUE_RANGE = 0.4;

/** Colors along the way from no v (0) to the most v (1). sRGB, 0–255 */
const STOPS: Record<Palette, [number, [number, number, number]][]> = {
  // Starts at --color-bg in styles.css, so a dish with no v is the same color as the page
  cyan: [
    [0, [5, 7, 15]],
    [0.45, [26, 58, 140]],
    [0.8, [62, 242, 255]],
    [1, [235, 255, 255]],
  ],
  mono: [
    [0, [0, 0, 0]],
    [1, [255, 255, 255]],
  ],
  fire: [
    [0, [5, 7, 15]],
    [0.35, [150, 20, 30]],
    [0.7, [255, 140, 20]],
    [1, [255, 245, 170]],
  ],
};

/** Palettes in the menu */
export const PALETTES: { id: Palette; name: LocalizedText }[] = [
  { id: 'cyan', name: { ja: 'シアン', en: 'Cyan' } },
  { id: 'mono', name: { ja: '白黒', en: 'Black and white' } },
  { id: 'fire', name: { ja: '炎', en: 'Fire' } },
];

export const FIRST_PALETTE: Palette = 'cyan';

/** Number of entries in a table. One per byte value, so a texture can use it as it is */
export const TABLE_SIZE = 256;

/**
 * Makes a table of colors, so drawing does not blend colors for every cell.
 *
 * @param palette Which colors
 * @returns r, g, b (0–255, sRGB) for entry 0 … TABLE_SIZE − 1, side by side
 */
export function paletteTable(palette: Palette): Uint8Array {
  const stops = STOPS[palette];
  const table = new Uint8Array(TABLE_SIZE * 3);
  for (let i = 0; i < TABLE_SIZE; i++) {
    const t = i / (TABLE_SIZE - 1);
    const upper = stops.findIndex(([at]) => at >= t);
    const [toAt, to] = stops[upper];
    const [fromAt, from] = stops[Math.max(upper - 1, 0)];
    const mix = toAt === fromAt ? 1 : (t - fromAt) / (toAt - fromAt);
    for (let c = 0; c < 3; c++) {
      table[i * 3 + c] = Math.round(from[c] + (to[c] - from[c]) * mix);
    }
  }
  return table;
}

/**
 * Which table entry an amount of v uses.
 *
 * @param v Amount of v (0–1)
 */
export function tableIndex(v: number): number {
  return Math.max(0, Math.min(TABLE_SIZE - 1, Math.floor((v / VALUE_RANGE) * (TABLE_SIZE - 1))));
}
