import { useEffect, useRef, type RefObject } from 'react';
import { createField, type Field, stepFast } from '@/core/grayScott3d';
import { createStage, type Stage } from './createStage';
import { createVoxelMesh } from './voxelMesh';
import type { FieldSceneHandle, FieldSceneOptions } from '../types';

/** Seconds per frame of the simulation. Fixed, so the pattern grows at the same pace at any frame rate */
const FRAME_SECONDS = 1 / 60;
/** Max time (seconds) for one frame. Keeps the pattern from jumping when you come back to the tab */
const MAX_DELTA = 0.1;
/**
 * Most simulation frames in one drawn frame. Catching up with more makes the next frame even later,
 * so past this the time left over is dropped, and a heavy grid plays slower instead of freezing
 */
const MAX_FRAMES_PER_FRAME = 2;
/** How often (seconds) the numbers on the panel are updated */
const STATS_INTERVAL = 0.5;

/**
 * Makes a Three.js scene on the canvas and grows the pattern in a cube.
 *
 * The field changes every step, so it is in a ref, not in React state.
 * In state, React would re-render every frame, and both React and the draw loop would manage the field.
 *
 * @param canvasRef    Canvas to draw on
 * @param initialField Field at the start. It also sets the grid size
 * @param options      Play state, speed, numbers and display. Each render passes the latest values
 */
export function useFieldScene(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  initialField: Field,
  options: FieldSceneOptions,
): FieldSceneHandle {
  const fieldRef = useRef(initialField);
  // step writes into a second field and the two take turns, so no new arrays are made every step
  const spareRef = useRef(createField(initialField.size));
  const stepsRef = useRef(0);
  const fpsRef = useRef(0);
  // Set when the field changes, so the cubes are written again only then (or when the display changes)
  const dirtyRef = useRef(true);
  const stageRef = useRef<Stage | null>(null);
  // The draw loop is made only once, so it reads the latest props through a ref
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const notify = () =>
    optionsRef.current.onStats({
      steps: stepsRef.current,
      cells: fieldRef.current.v.length,
      fps: fpsRef.current,
    });

  const handleRef = useRef<FieldSceneHandle>({
    step: () => {
      const { speed, params, terms } = optionsRef.current;
      for (let i = 0; i < speed; i++) {
        const next = stepFast(fieldRef.current, params, terms, spareRef.current);
        spareRef.current = fieldRef.current;
        fieldRef.current = next;
      }
      stepsRef.current += speed;
      dirtyRef.current = true;
    },
    load: (field) => {
      fieldRef.current = field;
      spareRef.current = createField(field.size);
      stepsRef.current = 0;
      dirtyRef.current = true;
      notify();
    },
    zoom: (scale) => stageRef.current?.zoom(scale),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const size = fieldRef.current.size;
    const stage = createStage(canvas, size);
    stageRef.current = stage;
    const voxels = createVoxelMesh(size);
    stage.scene.add(voxels.mesh);
    notify();

    const observer = new ResizeObserver(([entry]) =>
      stage.resize(entry.contentRect.width, entry.contentRect.height),
    );
    observer.observe(canvas);

    let frame = 0;
    let last = performance.now();
    let pending = 0;
    let sinceStats = 0;
    let frames = 0;
    let lastDisplay = '';
    const loop = (now: number) => {
      const delta = Math.min((now - last) / 1000, MAX_DELTA);
      last = now;
      const { running, autoRotate, display } = optionsRef.current;

      // Move in fixed frames. Leftover time waits for the next drawn frame
      if (running) {
        pending += delta;
        for (let i = 0; i < MAX_FRAMES_PER_FRAME && pending >= FRAME_SECONDS; i++) {
          pending -= FRAME_SECONDS;
          handleRef.current.step();
        }
        pending = Math.min(pending, FRAME_SECONDS);
      }
      frames++;
      sinceStats += delta;
      if (sinceStats >= STATS_INTERVAL) {
        fpsRef.current = frames / sinceStats;
        frames = 0;
        sinceStats = 0;
        notify();
      }

      // Going through every cell takes time on a big grid, so skip it while nothing has changed
      const displayKey = JSON.stringify(display);
      if (dirtyRef.current || displayKey !== lastDisplay) {
        voxels.update(fieldRef.current, display);
        dirtyRef.current = false;
        lastDisplay = displayKey;
      }
      stage.controls.autoRotate = autoRotate;
      stage.render();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      voxels.dispose();
      stage.dispose();
      stageRef.current = null;
    };
  }, [canvasRef]);

  return handleRef.current;
}
