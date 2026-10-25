/**
 * A scanned lesson's own progress, as plain counts: its items and handout questions practised
 * (answered right at least once in its practice) out of all of them, per kind, and per handout
 * page for the questions. Items not in our lists cannot be practised, so they do not count.
 */
import type { ScannedLesson } from '../scan-types.ts';
import { questionKey, scanItemKey } from './scans.ts';

export interface ScanPart {
  kind: 'kanji' | 'word' | 'grammar' | 'questions';
  /** For the questions: the handout page they are printed on. */
  page?: number;
  done: number;
  total: number;
}

export interface ScanProgress {
  done: number;
  total: number;
  /** Kanji, words, grammar, then the questions of each handout page; empty parts left out. */
  parts: ScanPart[];
  /** Epoch ms of the last right answer in this lesson's practice. */
  lastPractisedAt?: number;
}

function part(kind: ScanPart['kind'], keys: readonly string[], lesson: ScannedLesson): ScanPart {
  const done = keys.filter((key) => lesson.practised[key] !== undefined).length;
  return { kind, done, total: keys.length };
}

function itemParts(lesson: ScannedLesson): ScanPart[] {
  const ours = lesson.items.filter((item) => item.ref !== undefined);
  return (['kanji', 'word', 'grammar'] as const).map((kind) =>
    part(kind, ours.filter((item) => item.kind === kind).map(scanItemKey), lesson),
  );
}

function questionParts(lesson: ScannedLesson): ScanPart[] {
  const pages = [...new Set(lesson.questions.map((q) => q.page))].sort((a, b) => a - b);
  return pages.map((page) => ({
    ...part('questions', lesson.questions.filter((q) => q.page === page).map(questionKey), lesson),
    page,
  }));
}

/** The lesson's progress (see the module comment). */
export function scanProgress(lesson: ScannedLesson): ScanProgress {
  const parts = [...itemParts(lesson), ...questionParts(lesson)].filter((p) => p.total > 0);
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
