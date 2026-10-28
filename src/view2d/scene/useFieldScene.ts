import { useEffect, useRef, type RefObject } from 'react';
import { addSeed, createField, type Field, stepFast } from '@/core/grayScott2d';
import { createFieldImage } from './fieldImage';
import { createStage } from './createStage';
import { attachPointerPaint } from './pointerPaint';
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
/** Half of the side of the square that one drag paints (cells) */
const PAINT_RADIUS = 2;

/**
 * Makes a Three.js scene on the canvas and grows the pattern.
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
  const spareRef = useRef(createField(initialField.width, initialField.height));
  const stepsRef = useRef(0);
  const fpsRef = useRef(0);
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
    },
    load: (field) => {
      fieldRef.current = field;
      spareRef.current = createField(field.width, field.height);
      stepsRef.current = 0;
      notify();
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const { width, height } = fieldRef.current;
    const stage = createStage(canvas, width, height);
    const image = createFieldImage(width, height);
    stage.scene.add(image.mesh);
    notify();

    const observer = new ResizeObserver(([entry]) =>
      stage.resize(entry.contentRect.width, entry.contentRect.height),
    );
    observer.observe(canvas);
    const pointer = attachPointerPaint(canvas);

    let frame = 0;
    let last = performance.now();
    let pending = 0;
    let sinceStats = 0;
    let frames = 0;
    const loop = (now: number) => {
      const delta = Math.min((now - last) / 1000, MAX_DELTA);
      last = now;
      const { running, display } = optionsRef.current;

      // Painting works while stopped too, so you can draw first and then press play
      const at = pointer.current();
      const cell = at ? stage.toCell(at.px, at.py) : null;
      if (cell) {
        addSeed(fieldRef.current, cell.x, cell.y, PAINT_RADIUS);
      }

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

      image.update(fieldRef.current, display.palette);
      stage.render();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      pointer.detach();
      image.dispose();
      stage.dispose();
    };
  }, [canvasRef]);

  return handleRef.current;
}
