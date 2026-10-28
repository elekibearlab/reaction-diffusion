import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Same color as --color-bg in styles.css */
const BACKGROUND = 0x05070f;
/** Camera distance from the center, as a multiple of the grid's side */
const CAMERA_DISTANCE = 2.4;

/**
 * Base for drawing: the renderer, camera, lights and the grid's frame together.
 */
export type Stage = {
  scene: Scene;
  controls: OrbitControls;
  /** Call this when the canvas size on screen changes */
  resize: (width: number, height: number) => void;
  render: () => void;
  /** Moves the camera closer (scale < 1) or farther away (scale > 1). For the + / − buttons, because phones have no mouse wheel */
  zoom: (scale: number) => void;
  dispose: () => void;
};

/**
 * Makes a camera that looks down at the cube at an angle, plus lights and the cube's edges.
 * The cube's center is at (0, 0, 0), so OrbitControls can simply turn around that point.
 *
 * @param canvas Where to draw
 * @param size   Cells on each side of the grid (1 cell = 1 world unit)
 */
export function createStage(canvas: HTMLCanvasElement, size: number): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true });

  const scene = new Scene();
  scene.background = new Color(BACKGROUND);

  const camera = new PerspectiveCamera(40, 1, 0.1, size * 10);
  camera.position.set(1.4, 1, 1.6).setLength(size * CAMERA_DISTANCE);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.autoRotateSpeed = 0.8;

  // Ambient light for everything, plus two directional lights from different sides,
  // so the faces of the cubes have different brightness and the shape reads
  scene.add(new AmbientLight(0xffffff, 0.6));
  const key = new DirectionalLight(0xffffff, 1.8);
  key.position.set(1, 2, 1.5);
  scene.add(key);
  const rim = new DirectionalLight(0x6a7dff, 1.2);
  rim.position.set(-1.5, -0.5, -1);
  scene.add(rim);

  // Grid edges. It is a torus, so the pattern that goes past a face comes back on the other side
  const frame = new LineSegments(
    new EdgesGeometry(new BoxGeometry(size, size, size)),
    new LineBasicMaterial({ color: 0x3a4a7a }),
  );
  scene.add(frame);

  return {
    scene,
    controls,
    resize: (width, height) => {
      // The pixel ratio changes with the browser zoom or when the window moves to another monitor, so set it every time
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render: () => {
      controls.update();
      renderer.render(scene, camera);
    },
    zoom: (scale) => {
      // Same as the mouse wheel: keep the direction to the point the camera turns around, and change only the distance
      camera.position.sub(controls.target).multiplyScalar(scale).add(controls.target);
    },
    dispose: () => {
      controls.dispose();
      frame.geometry.dispose();
      frame.material.dispose();
      renderer.dispose();
    },
  };
}
