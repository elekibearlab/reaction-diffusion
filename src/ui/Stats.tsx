import { t } from '@/shared/i18n';
import styles from './styles.module.css';

type Props = {
  /** Steps moved since the start */
  steps: number;
  /** Number of cells in the grid */
  cells: number;
  /** Frames drawn per second. Shows how heavy the work is */
  fps: number;
};

/**
 * Shows how far the pattern has moved, how big the grid is, and how smoothly it runs.
 *
 * @param props.steps Steps moved
 * @param props.cells Number of cells
 * @param props.fps   Frames drawn per second
 */
export function Stats({ steps, cells, fps }: Props) {
  return (
    <dl className={styles.stats}>
      <dt>{t({ ja: 'ステップ', en: 'Steps' })}</dt>
      <dd>{steps.toLocaleString()}</dd>
      <dt>{t({ ja: 'マス', en: 'Cells' })}</dt>
      <dd>{cells.toLocaleString()}</dd>
      <dt>FPS</dt>
      <dd>{Math.round(fps)}</dd>
    </dl>
  );
}
