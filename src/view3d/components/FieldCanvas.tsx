import { useImperativeHandle, useRef, type Ref } from 'react';
import type { Field } from '@/core/grayScott3d';
import { useFieldScene } from '../scene/useFieldScene';
import type { FieldSceneHandle, FieldSceneOptions } from '../types';
import styles from './styles.module.css';

type Props = FieldSceneOptions & {
  ref: Ref<FieldSceneHandle>;
  initialField: Field;
};

/**
 * Canvas for the 3D field. It fills its parent. Dragging turns the camera.
 *
 * @param props.ref          Gets commands: replace the field, move one frame, zoom
 * @param props.initialField Field at the start
 * @param props.running      Whether the pattern moves on its own
 * @param props.speed        Steps per frame
 * @param props.params       Diffusion rates, feed and kill
 * @param props.terms        Which terms are on
 * @param props.autoRotate   Whether the camera turns by itself
 * @param props.display      How the field looks
 * @param props.onStats      Gets the step count and frame rate
 */
export function FieldCanvas({ ref, initialField, ...options }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handle = useFieldScene(canvasRef, initialField, options);
  useImperativeHandle(ref, () => handle, [handle]);
  return <canvas ref={canvasRef} className={styles.canvas} />;
}
