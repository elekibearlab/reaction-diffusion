/**
 * Follows the cursor (or a finger) while it is pressed on the canvas, so you can paint v by dragging.
 * It only keeps the last position; the scene reads it each frame.
 *
 * @param canvas Canvas that gets pointer input
 * @returns The current position (px, the top left of the canvas is 0) or null when not pressed,
 *          and a function that removes the events
 */
export function attachPointerPaint(canvas: HTMLCanvasElement): {
  current: () => { px: number; py: number } | null;
  detach: () => void;
} {
  let position: { px: number; py: number } | null = null;

  const down = (event: PointerEvent) => {
    // Keep getting moves while the button is held, even if the cursor leaves the canvas
    canvas.setPointerCapture(event.pointerId);
    position = { px: event.offsetX, py: event.offsetY };
  };
  const move = (event: PointerEvent) => {
    if (position) {
      position = { px: event.offsetX, py: event.offsetY };
    }
  };
  const up = () => {
    position = null;
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  return {
    current: () => position,
    detach: () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    },
  };
}
