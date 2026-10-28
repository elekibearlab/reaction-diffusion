import { useRef, useState } from 'react';
import { createField } from '@/core/grayScott2d';
import { FIRST_PRESET, paramsFor, PRESETS, type Preset } from '@/data/presets';
import { Workspace } from '@/ui';
import { t } from '@/shared/i18n';
import { FIRST_PALETTE } from '@/shared/palette';
import { useKeyboardShortcuts } from '@/shared/useKeyboardShortcuts';
import type { BoardChoice, Display, FieldSceneHandle, FieldStats } from './types';
import { scatterSeeds } from './seed';
import { FieldCanvas } from './components/FieldCanvas';
import { ControlPanel } from './components/ControlPanel';

/**
 * Grid sizes to choose from. All 16:9, the same shape as the video.
 * The pattern keeps its size in cells, so a bigger grid shows more of it, smaller
 */
const BOARDS: BoardChoice[] = [
  { id: 's', name: { ja: '小さい', en: 'Small' }, width: 192, height: 108 },
  { id: 'm', name: { ja: 'ふつう', en: 'Medium' }, width: 256, height: 144 },
  { id: 'l', name: { ja: '大きい', en: 'Large' }, width: 384, height: 216 },
  { id: 'xl', name: { ja: 'とても大きい', en: 'Extra large' }, width: 512, height: 288 },
];
const DEFAULT_BOARD = BOARDS[1];
/** Steps per frame at first. A pattern needs thousands of steps, so one step per frame would be too slow to watch */
const DEFAULT_SPEED = 12;
const FIRST_DISPLAY: Display = { palette: FIRST_PALETTE };

/**
 * The 2D screen. It keeps the numbers, play state and display in state, and builds the canvas and panel.
 */
export function ReactionDiffusion2D() {
  const sceneRef = useRef<FieldSceneHandle>(null);
  const [preset, setPreset] = useState(FIRST_PRESET);
  const [params, setParams] = useState(() => paramsFor(FIRST_PRESET));
  const [board, setBoard] = useState(DEFAULT_BOARD);
  // A new grid size makes a new canvas, so keep the first field for it
  const [initialField, setInitialField] = useState(() => scatterSeeds(board.width, board.height));
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [display, setDisplay] = useState(FIRST_DISPLAY);
  const [stats, setStats] = useState<FieldStats>({
    steps: 0,
    cells: board.width * board.height,
    fps: 0,
  });

  const actions = {
    choosePreset: (next: Preset) => {
      // Each pattern starts again from fresh seeds. Starting from the last pattern would make
      // what you see depend on what was chosen before
      setPreset(next);
      setSpeed(next.speed ?? DEFAULT_SPEED);
      setParams(paramsFor(next));
      sceneRef.current?.load(scatterSeeds(board.width, board.height));
    },
    toggleRunning: () => setRunning((value) => !value),
    step: () => {
      // Auto play while stepping one frame at a time is confusing, so stop it
      setRunning(false);
      sceneRef.current?.step();
    },
    restart: () => sceneRef.current?.load(scatterSeeds(board.width, board.height)),
    clear: () => sceneRef.current?.load(createField(board.width, board.height)),
    /** Makes a new canvas with new seeds, for a new grid size */
    rebuild: (next: BoardChoice) => {
      setBoard(next);
      setInitialField(scatterSeeds(next.width, next.height));
    },
  };

  useKeyboardShortcuts({
    Space: actions.toggleRunning,
    ArrowRight: actions.step,
    KeyR: actions.restart,
    KeyC: actions.clear,
    // 1–7 pick a preset
    ...Object.fromEntries(
      PRESETS.map((item, i) => [`Digit${i + 1}`, () => actions.choosePreset(item)]),
    ),
  });

  return (
    <Workspace
      caption={
        <>
          <h2>{t(preset.name)}</h2>
          <p>
            {t(preset.description)}
            {t({ ja: ' · ドラッグで v を置ける', en: ' · drag to add v' })}
          </p>
        </>
      }
      panel={
        <ControlPanel
          presets={PRESETS}
          presetId={preset.id}
          running={running}
          speed={speed}
          boards={BOARDS}
          boardId={board.id}
          params={params}
          display={display}
          stats={stats}
          onPresetChange={(id) => actions.choosePreset(PRESETS.find((item) => item.id === id)!)}
          onToggleRunning={actions.toggleRunning}
          onStep={actions.step}
          onSpeedChange={setSpeed}
          onBoardChange={(id) => actions.rebuild(BOARDS.find((item) => item.id === id)!)}
          onParamsChange={setParams}
          onRestart={actions.restart}
          onClear={actions.clear}
          onDisplayChange={setDisplay}
        />
      }
    >
      {/* A new grid size changes the texture and the camera, so change the key to make a new scene */}
      <FieldCanvas
        key={board.id}
        ref={sceneRef}
        initialField={initialField}
        running={running}
        speed={speed}
        params={params}
        terms={preset.terms}
        display={display}
        onStats={setStats}
      />
    </Workspace>
  );
}
