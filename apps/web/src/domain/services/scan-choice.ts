/**
 * What the learner keeps of a scanned lesson. Every item and question a scan finds stays listed
 * on the lesson, but only what is kept is practised and counted; the rest is left out
 * (`ScannedLesson.dropped`) and can be added back at any time. Items found only in exercise
 * instructions start left out; everything else starts kept.
 */
import type { HandoutQuestion, ScanItem, ScanItemKind, ScannedLesson } from '../scan-types.ts';
import { questionKey, scanItemKey } from './scans.ts';

/** What a scan makes, as the learner chooses it: the item kinds, and the handout's exercises. */
export type ScanChoiceKind = ScanItemKind | 'questions';

export const SCAN_CHOICE_KINDS: readonly ScanChoiceKind[] = [
  'kanji',
  'word',
  'grammar',
  'questions',
];

type Choice = Pick<ScannedLesson, 'dropped'>;

/** Whether the item or question with this key is practised: true unless it was left out. */
export function isKept(lesson: Choice, key: string): boolean {
  return !(lesson.dropped ?? []).includes(key);
}

/** The lesson's items that are kept. */
export function keptItems(lesson: Pick<ScannedLesson, 'items' | 'dropped'>): ScanItem[] {
  const dropped = new Set(lesson.dropped ?? []);
  return lesson.items.filter((item) => !dropped.has(scanItemKey(item)));
}

/** The lesson's handout questions that are kept. */
export function keptQuestions(
  lesson: Pick<ScannedLesson, 'questions' | 'dropped'>,
): HandoutQuestion[] {
  const dropped = new Set(lesson.dropped ?? []);
  return lesson.questions.filter((question) => !dropped.has(questionKey(question)));
}

/** The lesson with these keys kept, or left out; `dropped` goes when nothing is left out. */
export function withKept<T extends Choice>(lesson: T, keys: readonly string[], kept: boolean): T {
  const changed = new Set(keys);
  const others = (lesson.dropped ?? []).filter((key) => !changed.has(key));
  const dropped = kept ? others : [...others, ...changed];
  const { dropped: _dropped, ...rest } = lesson;
  return (dropped.length > 0 ? { ...rest, dropped } : rest) as T;
}

/** The keys of everything of these kinds in the lesson. */
export function keysOfKinds(
  lesson: Pick<ScannedLesson, 'items' | 'questions'>,
  kinds: readonly ScanChoiceKind[],
): string[] {
  const items = lesson.items.filter((item) => kinds.includes(item.kind)).map(scanItemKey);
  return kinds.includes('questions') ? [...items, ...lesson.questions.map(questionKey)] : items;
}

/**
 * The lesson with what starts left out: of the items it did not have `before`, those found only
 * in exercise instructions. What the learner already chose is never changed.
 */
export function withStartingChoice<T extends Choice & Pick<ScannedLesson, 'items'>>(
  lesson: T,
  before: readonly ScanItem[],
): T {
  const had = new Set(before.map(scanItemKey));
  const fresh = lesson.items.filter((item) => item.instruction && !had.has(scanItemKey(item)));
  return fresh.length > 0 ? withKept(lesson, fresh.map(scanItemKey), false) : lesson;
}
