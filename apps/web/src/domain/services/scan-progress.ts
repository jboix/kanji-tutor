/**
 * A scanned lesson's own progress, as plain counts: its items and handout questions practised
 * (answered right at least once in its practice) out of those the learner keeps, per kind, the
 * handouts' questions as one part. Items not in our lists cannot be practised, so they do not
 * count; neither does what the learner left out, which `left` counts apart.
 */
import type { ScannedLesson } from '../scan-types.ts';
import { isKept } from './scan-choice.ts';
import { SCAN_PRACTICE_CARDS } from './scan-practice.ts';
import { questionKey, scanItemKey } from './scans.ts';

export interface ScanPart {
  kind: 'kanji' | 'word' | 'grammar' | 'questions';
  done: number;
  total: number;
  /** Left out by the learner: listed in the part, not practised. */
  left: number;
}

export interface ScanProgress {
  done: number;
  total: number;
  /** Kanji, words, grammar, then the handouts' questions; parts with nothing kept are not here. */
  parts: ScanPart[];
  /** Epoch ms of the last right answer in this lesson's practice. */
  lastPractisedAt?: number;
}

function part(kind: ScanPart['kind'], keys: readonly string[], lesson: ScannedLesson): ScanPart {
  const kept = keys.filter((key) => isKept(lesson, key));
  const done = kept.filter((key) => lesson.practised[key] !== undefined).length;
  return { kind, done, total: kept.length, left: keys.length - kept.length };
}

function itemParts(lesson: ScannedLesson): ScanPart[] {
  const ours = lesson.items.filter((item) => item.ref !== undefined);
  return (['kanji', 'word', 'grammar'] as const).map((kind) =>
    part(kind, ours.filter((item) => item.kind === kind).map(scanItemKey), lesson),
  );
}

function questionPart(lesson: ScannedLesson): ScanPart {
  return part('questions', lesson.questions.map(questionKey), lesson);
}

/**
 * Every part of the lesson, those the learner left out whole included (`total` 0), so that
 * they can be added back.
 */
export function scanParts(lesson: ScannedLesson): ScanPart[] {
  return [...itemParts(lesson), questionPart(lesson)].filter((p) => p.total + p.left > 0);
}

/** The lesson's progress (see the module comment). */
export function scanProgress(lesson: ScannedLesson): ScanProgress {
  const parts = scanParts(lesson).filter((p) => p.total > 0);
  const progress: ScanProgress = {
    done: parts.reduce((sum, p) => sum + p.done, 0),
    total: parts.reduce((sum, p) => sum + p.total, 0),
    parts,
  };
  const times = Object.values(lesson.practised);
  if (times.length > 0) progress.lastPractisedAt = Math.max(...times);
  return progress;
}

/** The lesson with these keys practised now. */
export function withPractised(
  lesson: ScannedLesson,
  keys: readonly string[],
  now: number,
): ScannedLesson {
  const practised = { ...lesson.practised };
  for (const key of keys) practised[key] = now;
  return { ...lesson, practised, updatedAt: now };
}

/** About how long a card of a scanned lesson's practice takes, in seconds. */
const CARD_SECONDS = 30;

/** About how many minutes one practice of the lesson takes: its cards, at most 12. */
export function scanPracticeMinutes(lesson: ScannedLesson, cards = SCAN_PRACTICE_CARDS): number {
  const total = scanProgress(lesson).total;
  return Math.max(1, Math.round((Math.min(cards, total) * CARD_SECONDS) / 60));
}
