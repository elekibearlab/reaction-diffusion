import { DEFAULT_PARAMS, type Params, type Terms } from '@/core/params';
import type { LocalizedText } from '@/shared/i18n';

/**
 * A named pattern. 2D and 3D use the same list.
 * First the patterns that appear when both terms are on (only feed and kill differ between them),
 * then each term by itself, to show how it works.
 * The values are from Pearson, "Complex Patterns in a Simple System" (1993), and Munafo's map of the F-k plane.
 */
export type Preset = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  /** 'pattern': a pattern to look at. 'term': one term by itself, to explain how it works */
  group: 'pattern' | 'term';
  feed: number;
  kill: number;
  /**
   * feed and kill for 3D, when the 2D ones don't give the same pattern there.
   * In 3D a cell has 6 neighbors, so v spreads thinner and the map of patterns shifts a little
   */
  in3d?: { feed: number; kill: number };
  terms: Terms;
  /**
   * Steps per frame when this preset is chosen. Without it the screen's default is used.
   * A term by itself is over in about 100 steps, which would be gone within a few frames at the default
   */
  speed?: number;
};

const BOTH_TERMS: Terms = { diffusion: true, reaction: true };

export const PRESETS: Preset[] = [
  {
    id: 'coral',
    name: { ja: 'サンゴ', en: 'Coral' },
    description: {
      ja: '枝分かれしながら広がり、指紋やサンゴのような模様になる',
      en: 'It spreads with branches into a pattern like coral or fingerprints',
    },
    group: 'pattern',
    feed: 0.0545,
    kill: 0.062,
    // At the 2D values the seeds stay as they are in 3D. Here they branch out into tubes
    in3d: { feed: 0.05, kill: 0.06 },
    terms: BOTH_TERMS,
  },
  {
    id: 'maze',
    name: { ja: '迷路', en: 'Maze' },
    description: {
      ja: '線が伸びて曲がり、迷路のような縞になる',
      en: 'Lines grow and bend into a maze of stripes',
    },
    group: 'pattern',
    feed: 0.029,
    kill: 0.057,
    terms: BOTH_TERMS,
  },
  {
    id: 'mitosis',
    name: { ja: '分裂する斑点', en: 'Dividing spots' },
    description: {
      ja: '斑点が育って 2 つに割れ、増えていく',
      en: 'Spots grow, split in two and multiply',
    },
    group: 'pattern',
    feed: 0.0367,
    kill: 0.0649,
    terms: BOTH_TERMS,
  },
  {
    id: 'waves',
    name: { ja: '波', en: 'Waves' },
    description: {
      ja: '模様が止まらず、波になって動き続ける',
      en: 'The pattern never settles. It keeps moving as waves',
    },
    group: 'pattern',
    // Pearson's 0.014 / 0.045 needs bigger seeds than ours and dies out, so this is a nearby point that keeps moving
    feed: 0.018,
    kill: 0.051,
    terms: BOTH_TERMS,
  },
  {
    id: 'holes',
    name: { ja: '穴', en: 'Holes' },
    description: {
      ja: 'v が一面に広がり、u の穴が点々と残る（斑点の裏返し）',
      en: 'v covers everything, leaving holes of u (spots turned inside out)',
    },
    group: 'pattern',
    feed: 0.039,
    kill: 0.058,
    terms: BOTH_TERMS,
  },
  {
    id: 'diffusion',
    name: { ja: '拡散だけ', en: 'Diffusion only' },
    description: {
      ja: 'となりのマスへ広がるだけ。にじんで薄くなり、やがて消える',
      en: 'Only spread to the cells next door. It blurs, fades and disappears',
    },
    group: 'term',
    feed: DEFAULT_PARAMS.feed,
    kill: DEFAULT_PARAMS.kill,
    terms: { diffusion: true, reaction: false },
    speed: 1,
  },
  {
    id: 'reaction',
    name: { ja: '反応だけ', en: 'Reaction only' },
    description: {
      ja: 'マスの中で反応するだけ。となりへ広がらないので、四角のまま薄れて消える',
      en: 'Only the reaction inside each cell. Nothing spreads, so the squares fade where they are',
    },
    group: 'term',
    feed: DEFAULT_PARAMS.feed,
    kill: DEFAULT_PARAMS.kill,
    terms: { diffusion: false, reaction: true },
    speed: 1,
  },
];

/** Shown first: coral, which visibly branches out over the first few seconds */
export const FIRST_PRESET = PRESETS[0];

/**
 * Default diffusion rates, with the preset's feed and kill
 *
 * @param preset The preset to use
 * @param is3d   Use the 3D feed and kill if the preset has them
 */
export function paramsFor(preset: Preset, is3d = false): Params {
  const { feed, kill } = (is3d && preset.in3d) || preset;
  return { ...DEFAULT_PARAMS, feed, kill };
}
