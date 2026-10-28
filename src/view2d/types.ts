import type { Field } from '@/core/grayScott2d';
import type { Params, Terms } from '@/core/params';
import type { LocalizedText } from '@/shared/i18n';
import type { Palette } from '@/shared/palette';

/** Numbers shown on screen. Sent a few times a second, not every frame, so React doesn't re-render all the time */
export type FieldStats = {
  steps: number;
  cells: number;
  /** Frames drawn per second. Shows how heavy the work is on the CPU */
  fps: number;
};

/** A grid size to choose from on the panel */
export type BoardChoice = {
  id: string;
  name: LocalizedText;
  width: number;
  height: number;
};

/** Lets other code control the scene. Passed to ReactionDiffusion2D through a React ref */
export type FieldSceneHandle = {
  /** Moves forward one frame (`speed` steps) */
  step: () => void;
  /** Replaces the field and sets the step count back to 0 */
  load: (field: Field) => void;
};

/** How the field looks. None of it changes the pattern */
export type Display = {
  palette: Palette;
};

export type FieldSceneOptions = {
  /** Whether the pattern moves on its own */
  running: boolean;
  /** Steps per frame (1/60 s) */
  speed: number;
  params: Params;
  terms: Terms;
  display: Display;
  onStats: (stats: FieldStats) => void;
};
