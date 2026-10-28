import { Color, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';

/** Same color as --color-bg in styles.css */
const BACKGROUND = 0x05070f;
/** Space around the grid (CSS px). More at the top, so the grid doesn't go under the text on the top left */
const MARGIN_X = 16;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 16;

/**
 * Base for drawing: the renderer and the camera together.
 */
export type Stage = {
  scene: Scene;
  /** Call this when the canvas size on screen changes (CSS px) */
  resize: (width: number, height: number) => void;
  render: () => void;
  /**
   * Turns a screen position (px, the top left of the canvas is 0) into a cell.
   * Returns null outside the grid
   */
  toCell: (px: number, py: number) => { x: number; y: number } | null;
  dispose: () => void;
};

/**
 * Makes an orthographic camera that shows the whole grid. 1 cell = 1 world unit.
 * The grid's center is (0, 0) and +y is up, so row 0 of the field is at the bottom.
 *
 * @param canvas Where to draw
 * @param width  Cells across
 * @param height Cells up
 */
export function createStage(canvas: HTMLCanvasElement, width: number, height: number): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  const scene = new Scene();
  scene.background = new Color(BACKGROUND);

  const camera = new OrthographicCamera();
  camera.position.z = 10;

  const resize = (canvasWidth: number, canvasHeight: number) => {
    // The pixel ratio changes with the browser zoom or when the window moves to another monitor, so set it every time
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasWidth, canvasHeight, false);

    // The largest scale (px per cell) that fits the whole grid inside the margins
    const pixelsPerCell = Math.max(
      Math.min(
        (canvasWidth - MARGIN_X * 2) / width,
        (canvasHeight - MARGIN_TOP - MARGIN_BOTTOM) / height,
      ),
      0.01,
    );
    // Center the grid inside the margins. The top margin is bigger, so the grid sits lower and the camera center moves up
    const centerY = (MARGIN_BOTTOM - MARGIN_TOP) / 2 / pixelsPerCell;
    camera.left = -canvasWidth / 2 / pixelsPerCell;
    camera.right = canvasWidth / 2 / pixelsPerCell;
    camera.top = canvasHeight / 2 / pixelsPerCell - centerY;
    camera.bottom = -canvasHeight / 2 / pixelsPerCell - centerY;
    camera.updateProjectionMatrix();
  };

  const toCell = (px: number, py: number) => {
    const rect = canvas.getBoundingClientRect();
    const world = new Vector3((px / rect.width) * 2 - 1, -(py / rect.height) * 2 + 1, 0).unproject(
      camera,
    );
    const x = Math.floor(world.x + width / 2);
    const y = Math.floor(world.y + height / 2);
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return null;
    }
    return { x, y };
  };

  return {
    scene,
    resize,
    render: () => renderer.render(scene, camera),
    toCell,
    dispose: () => renderer.dispose(),
  };
}
