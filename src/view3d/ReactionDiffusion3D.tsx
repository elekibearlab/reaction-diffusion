import { useRef, useState } from 'react';
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
 * Grid sizes to choose from. The cell count grows with the cube of the side,
 * so 64 is already about 7 times the cells of the 2D medium grid
 */
const BOARDS: BoardChoice[] = [
  { id: 's', name: { ja: '小さい', en: 'Small' }, size: 32 },
  { id: 'm', name: { ja: 'ふつう', en: 'Medium' }, size: 48 },
  { id: 'l', name: { ja: '大きい', en: 'Large' }, size: 64 },
];
const DEFAULT_BOARD = BOARDS[1];
/** Steps per frame at first. Lower than 2D, because one step in 3D goes through many more cells */
const DEFAULT_SPEED = 4;
const FIRST_DISPLAY: Display = { palette: FIRST_PALETTE, threshold: 0.2, cut: false };
/** How much one press of zoom changes the camera distance */
const ZOOM_STEP = 1.25;

/**
 * The 3D screen. Same as the 2D screen, plus the camera.
 */
export function ReactionDiffusion3D() {
  const sceneRef = useRef<FieldSceneHandle>(null);
  const [preset, setPreset] = useState(FIRST_PRESET);
  const [params, setParams] = useState(() => paramsFor(FIRST_PRESET, true));
  const [board, setBoard] = useState(DEFAULT_BOARD);
  // A new grid size makes a new canvas, so keep the first field for it
  const [initialField, setInitialField] = useState(() => scatterSeeds(board.size));
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [autoRotate, setAutoRotate] = useState(true);
  const [display, setDisplay] = useState(FIRST_DISPLAY);
  const [stats, setStats] = useState<FieldStats>({ steps: 0, cells: board.size ** 3, fps: 0 });

  const actions = {
    choosePreset: (next: Preset) => {
      // Each pattern starts again from fresh seeds, the same as 2D
      setPreset(next);
      setParams(paramsFor(next, true));
      sceneRef.current?.load(scatterSeeds(board.size));
    },
    toggleRunning: () => setRunning((value) => !value),
    step: () => {
      // Auto play while stepping one frame at a time is confusing, so stop it
      setRunning(false);
      sceneRef.current?.step();
    },
    toggleRotate: () => setAutoRotate((value) => !value),
    zoomIn: () => sceneRef.current?.zoom(1 / ZOOM_STEP),
    zoomOut: () => sceneRef.current?.zoom(ZOOM_STEP),
    restart: () => sceneRef.current?.load(scatterSeeds(board.size)),
    /** Makes a new canvas with new seeds, for a new grid size */
    rebuild: (next: BoardChoice) => {
      setBoard(next);
      setInitialField(scatterSeeds(next.size));
    },
  };

  useKeyboardShortcuts({
    Space: actions.toggleRunning,
    ArrowRight: actions.step,
    KeyA: actions.toggleRotate,
    // The + key is Shift + = on most keyboards, so = also works
    Equal: actions.zoomIn,
    NumpadAdd: actions.zoomIn,
    Minus: actions.zoomOut,
    NumpadSubtract: actions.zoomOut,
    KeyR: actions.restart,
    KeyX: () => setDisplay((value) => ({ ...value, cut: !value.cut })),
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
          <p>{t(preset.description)}</p>
        </>
      }
      panel={
        <ControlPanel
          presets={PRESETS}
          presetId={preset.id}
          running={running}
          speed={speed}
          autoRotate={autoRotate}
          boards={BOARDS}
          boardId={board.id}
          params={params}
          display={display}
          stats={stats}
          onPresetChange={(id) => actions.choosePreset(PRESETS.find((item) => item.id === id)!)}
          onToggleRunning={actions.toggleRunning}
          onStep={actions.step}
          onSpeedChange={setSpeed}
          onToggleRotate={actions.toggleRotate}
          onZoomIn={actions.zoomIn}
          onZoomOut={actions.zoomOut}
          onBoardChange={(id) => actions.rebuild(BOARDS.find((item) => item.id === id)!)}
          onParamsChange={setParams}
          onRestart={actions.restart}
          onDisplayChange={setDisplay}
        />
      }
    >
      {/* A new grid size changes the cubes and the camera, so change the key to make a new scene */}
      <FieldCanvas
        key={board.id}
        ref={sceneRef}
        initialField={initialField}
        running={running}
        speed={speed}
        params={params}
        terms={preset.terms}
        autoRotate={autoRotate}
        display={display}
        onStats={setStats}
      />
    </Workspace>
  );
}
