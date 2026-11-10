import type { Stroke } from './recognizer/geometry.ts';

/**
 * Where a word's drawing stands: each kanji's strokes and how they were read ('' while not
 * drawn), and the kanji open on the pad. Strokes are kept so any kanji can be opened again and
 * corrected, not only the last one.
 */
export interface KanjiSteps {
  at: number;
  strokes: readonly (readonly Stroke[])[];
  read: readonly string[];
}

export function startSteps(count: number): KanjiSteps {
  return {
    at: 0,
    strokes: Array.from({ length: count }, () => []),
    read: Array.from({ length: count }, () => ''),
  };
}

/** Leaves the open kanji with the strokes on the pad, and how they read ('' when none). */
export function leaveOpen(steps: KanjiSteps, strokes: readonly Stroke[], read: string): KanjiSteps {
  return {
    ...steps,
    strokes: steps.strokes.with(steps.at, strokes),
    read: steps.read.with(steps.at, strokes.length > 0 ? read : ''),
  };
}

/** The next kanji still to draw, looking after the open one first; undefined when all are drawn. */
export function nextToDraw(steps: KanjiSteps): number | undefined {
  const blank = (i: number) => steps.read[i] === '';
  const order = steps.read.map((_, i) => (steps.at + 1 + i) % steps.read.length);
  return order.find((i) => i !== steps.at && blank(i));
}

/** Whether the open kanji is the only one left to draw, so leaving it checks the answer. */
export function isLastToDraw(steps: KanjiSteps): boolean {
  return steps.read.every((read, i) => i === steps.at || read !== '');
}
