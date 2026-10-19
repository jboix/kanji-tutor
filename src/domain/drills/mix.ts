/**
 * How drills mix into a session (BUILD-PLAN Wave 4): how many, where, and which kinds first,
 * steered by the learner's recent mistakes and the accepted plan.
 */
import type { ErrorType } from '../types.ts';
import type { ReadingDrillKind } from './types.ts';

/** Share of a session's cards that are drills when no accepted plan sets one. */
export const DEFAULT_DRILL_SHARE = 0.1;
/** Most drills a session can hold: one after every sentence. */
export const MAX_DRILL_SHARE = 0.5;

/**
 * Drills to add to `readingCards` sentences so they make up `share` of the session, rounded
 * down: 20 sentences at 0.1 get 2 drills, fewer than 9 get none. Never more than the sentences.
 */
export function drillCount(readingCards: number, share: number): number {
  const s = Math.min(Math.max(share, 0), MAX_DRILL_SHARE);
  if (s === 0 || readingCards === 0) return 0;
  return Math.min(readingCards, Math.floor((readingCards * s) / (1 - s) + 1e-9));
}

/**
 * Places drills between sentences: one after every N sentences, N = sentences ÷ (drills + 1)
 * and at least 1. A session never starts with a drill and never has two in a row.
 */
export function interleave<T>(reading: readonly T[], drills: readonly T[]): T[] {
  const count = Math.min(drills.length, reading.length);
  const gap = Math.max(1, Math.floor(reading.length / (count + 1)));
  const out: T[] = [];
  reading.forEach((card, i) => {
    out.push(card);
    const slot = (i + 1) / gap;
    const drill = Number.isInteger(slot) && slot <= count ? drills[slot - 1] : undefined;
    if (drill !== undefined) out.push(drill);
  });
  return out;
}

/** What the learner got wrong recently, and what the accepted plan asks to work on. */
export interface MistakeSignals {
  /** Misses per error type in the last two weeks (reading answers and drills). */
  errors: Partial<Record<ErrorType, number>>;
  /** Cloze drills missed in the last two weeks. */
  clozeMisses: number;
  /** The plan's `focusErrorTypes` (0–1 shares). */
  focus: Partial<Record<ErrorType, number>>;
  /** The plan names grammar points to work on. */
  grammarFocus: boolean;
}

const READING_SLIPS: readonly ErrorType[] = ['long-vowel', 'sokuon', 'rendaku', 'other'];

const sum = (record: Partial<Record<ErrorType, number>>, types: readonly ErrorType[]) =>
  types.reduce((total, type) => total + (record[type] ?? 0), 0);

/** Higher first; base scores keep variety when there are no mistakes yet. */
function scores(signals: MistakeSignals): [ReadingDrillKind, number][] {
  const { errors, focus } = signals;
  return [
    ['lookalike', 1 + 3 * (errors['wrong-kanji'] ?? 0) + 10 * (focus['wrong-kanji'] ?? 0)],
    ['readings', 1 + sum(errors, READING_SLIPS) + 10 * sum(focus, READING_SLIPS)],
    ['cloze', 0.9 + 3 * signals.clozeMisses + (signals.grammarFocus ? 5 : 0)],
    ['family', 0.8 + 0.5 * (errors.other ?? 0)],
  ];
}

/**
 * Drill kinds in the order to try them: the kind matching the learner's most frequent recent
 * mistake first (swapped lookalikes → lookalike drills; misread readings → many readings; missed
 * or planned grammar → cloze), then the others. Ties keep lookalike, readings, cloze, family.
 */
export function drillKinds(signals: MistakeSignals): ReadingDrillKind[] {
  return scores(signals)
    .sort((a, b) => b[1] - a[1])
    .map(([kind]) => kind);
}
