/** The strokes on the drawing pad, as a pure reducer (I4). Points are canvas CSS pixels. */
import type { Point, Stroke } from './recognizer/geometry.ts';

export interface Ink {
  /** Finished strokes, oldest first. */
  strokes: readonly Stroke[];
  /** The stroke under the finger, while drawing. */
  current?: readonly Point[];
}

export type InkAction =
  | { type: 'down'; point: Point }
  | { type: 'move'; points: readonly Point[] }
  | { type: 'up' }
  | { type: 'cancel' }
  | { type: 'undo' }
  | { type: 'clear' };

export const EMPTY_INK: Ink = { strokes: [] };

function finish(ink: Ink): Ink {
  if (!ink.current) return ink;
  return { strokes: [...ink.strokes, ink.current] };
}

/** Next ink: down starts a stroke, up finishes it, undo drops the last one, clear empties. */
export function inkReducer(ink: Ink, action: InkAction): Ink {
  switch (action.type) {
    case 'down':
      return { strokes: finish(ink).strokes, current: [action.point] };
    case 'move':
      return ink.current ? { ...ink, current: [...ink.current, ...action.points] } : ink;
    case 'up':
      return finish(ink);
    case 'cancel':
      return { strokes: ink.strokes };
    case 'undo':
      return { strokes: ink.current ? ink.strokes : ink.strokes.slice(0, -1) };
    case 'clear':
      return EMPTY_INK;
  }
}

/** Every stroke to paint, including the one being drawn. */
export function paintedStrokes(ink: Ink): readonly Stroke[] {
  return ink.current ? [...ink.strokes, ink.current] : ink.strokes;
}
