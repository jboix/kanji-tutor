/**
 * "I can't draw now" on a writing exercise: for a while, writing exercises ask for the word's
 * reading typed instead of its kanji drawn, as they always do when Settings says Type. Kept in
 * memory, so a reload draws again.
 */
import type { Drill } from '../../domain/drills/index.ts';
import { kanjiTyped } from '../../ui/kanji-drawing.ts';

/** How long writing stays typed after "I can't draw now". */
export const DRAW_LATER_MS = 15 * 60_000;

let typedUntil = 0;

/** Writing exercises are typed from now until `DRAW_LATER_MS` later. */
export function drawLater(now = Date.now()): void {
  typedUntil = now + DRAW_LATER_MS;
}

/** True while writing exercises are typed instead of drawn: for a while, or by the settings. */
export function drawingQuiet(now = Date.now()): boolean {
  return kanjiTyped() || now < typedUntil;
}

/** The drill as shown: a writing exercise turns into its typed twin while quiet. */
export function asTyped(drill: Drill, quiet: boolean): Drill {
  if (!quiet || drill.kind !== 'write' || drill.typed) return drill;
  return { ...drill, typed: true };
}
