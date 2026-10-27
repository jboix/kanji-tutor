/**
 * The last screen that showed the bottom bar, by its place in the history: pages opened from it
 * one after another (a kanji, then another, then a grammar point) can close back to it in one
 * step instead of one back per page.
 */
import { useLayoutEffect } from 'react';

let rootIdx: number | undefined;

/** The current entry's index, which the browser router keeps in `history.state.idx`. */
export function historyIdx(): number | undefined {
  const state: unknown = window.history.state;
  if (typeof state !== 'object' || state === null || !('idx' in state)) return undefined;
  return typeof state.idx === 'number' ? state.idx : undefined;
}

/**
 * Marks the current screen as the one to close back to: the bottom bar calls it, and renders on
 * every move, so the mark follows it.
 */
export function useNavRoot(): void {
  useLayoutEffect(() => {
    rootIdx = historyIdx();
  });
}

/** How many entries back the root is, or undefined when it is unknown or not behind. */
export function stepsToRoot(): number | undefined {
  const idx = historyIdx();
  if (rootIdx === undefined || idx === undefined || idx <= rootIdx) return undefined;
  return idx - rootIdx;
}
