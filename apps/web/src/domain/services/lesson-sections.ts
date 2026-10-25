/**
 * A unit lesson in textbook sections (S3), pure: 言葉 (new words, then quick checks), 文法 (each
 * point explained, then its drills), 練習 (mixed practice), 読み物 (the passage and its
 * questions) and まとめ (a mixed review). What each card exercises, so every new item can be
 * made to come back three times in different exercise types; a section's parts of about five
 * minutes (L6); and the section a unit is on.
 */
import type { SessionCard } from '../session-types.ts';
import type { LessonSection, SectionProgress, UnitProgress } from '../types.ts';
import { sessionSeconds } from './session-outline.ts';

export type { LessonSection, SectionProgress } from '../types.ts';

/** The sections in textbook order. */
export const LESSON_SECTIONS: readonly LessonSection[] = [
  'words',
  'grammar',
  'practice',
  'reading',
  'review',
];

/** Each section's Japanese heading, as a textbook writes it. */
export const SECTION_TITLES: Readonly<Record<LessonSection, string>> = {
  words: '言葉',
  grammar: '文法',
  practice: '練習',
  reading: '読み物',
  review: 'まとめ',
};

/** Times each item of the lesson comes back, at least, each time in another type (S3). */
export const COMES_BACK = 3;

/** The types an exercise card counts as, for the "three different types" rule. */
export type ExerciseType =
  | 'reading'
  | 'meaning'
  | 'word-choice'
  | 'particle'
  | 'pattern'
  | 'conjugation'
  | 'build'
  | 'listening'
  | 'sentence-meaning'
  | 'cloze'
  | 'write';

/** Item key → the exercise types that brought it back. */
export type Coverage = Map<string, Set<ExerciseType>>;

/** The items a sentence exercise uses: the lesson's words and grammar points in its sentence. */
function sentenceItems(card: SessionCard): string[] {
  const words = card.sentence.wordIds.map((id) => `word:${id}`);
  const grammar = (card.sentence.grammarIds ?? []).map((id) => `grammar:${id}`);
  return [...words, ...grammar];
}

type Counted = { type: ExerciseType; items: string[] };
type DrillOf<K> = Extract<NonNullable<SessionCard['drill']>, { kind: K }>;

/** Per drill kind: the type it counts as and the items it brings back. */
const DRILL_ITEMS: {
  [K in NonNullable<SessionCard['drill']>['kind']]: (
    drill: DrillOf<K>,
    card: SessionCard,
  ) => Counted[];
} = {
  meaning: (d) => [{ type: d.reverse ? 'word-choice' : 'meaning', items: [d.itemId] }],
  pattern: (d) => [
    { type: 'pattern', items: [d.itemId, ...(d.cue.wordId ? [`word:${d.cue.wordId}`] : [])] },
  ],
  conjugation: (d) => [{ type: 'conjugation', items: [d.itemId] }],
  cloze: (d) => [{ type: 'cloze', items: [d.itemId] }],
  particle: (_, card) => [{ type: 'particle', items: sentenceItems(card) }],
  build: (_, card) => [{ type: 'build', items: sentenceItems(card) }],
  listening: (d, card) => [
    { type: d.read ? 'sentence-meaning' : 'listening', items: sentenceItems(card) },
  ],
  write: (d) => [{ type: 'write', items: [d.itemId] }],
  'kanji-card': () => [],
  lookalike: () => [],
  readings: () => [],
  family: () => [],
};

/** The items a card exercises and the type it counts as; none for intros and passages. */
export function cardItems(card: SessionCard): Counted[] {
  const drill = card.drill;
  if (drill) {
    const counted = DRILL_ITEMS[drill.kind] as (d: typeof drill, c: SessionCard) => Counted[];
    return counted(drill, card);
  }
  const items = card.targets.map((t) => `word:${t.wordId}`);
  return items.length > 0 ? [{ type: 'reading', items }] : [];
}

/** Counts a card's types into the coverage of the items it holds. */
export function countCard(coverage: Coverage, card: SessionCard): void {
  for (const { type, items } of cardItems(card)) {
    for (const key of items) coverage.get(key)?.add(type);
  }
}

/** What the cards cover, counted for the given items only. */
export function coverageOf(cards: readonly SessionCard[], items: readonly string[]): Coverage {
  const coverage: Coverage = new Map(items.map((key) => [key, new Set<ExerciseType>()]));
  for (const card of cards) countCard(coverage, card);
  return coverage;
}

/** About five minutes a part (L6). */
export const PART_SECONDS = 300;

/**
 * A section's cards cut into parts of about {@link PART_SECONDS}, as even as they can be (no
 * part of two cards at the end), never between a grammar introduction and the drills after it.
 * A short section is one part.
 */
export function sectionParts(
  cards: readonly SessionCard[],
  seconds = PART_SECONDS,
): SessionCard[][] {
  const count = Math.max(1, Math.ceil(sessionSeconds(cards) / seconds));
  const each = sessionSeconds(cards) / count;
  const parts: SessionCard[][] = [];
  let part: SessionCard[] = [];
  for (const card of cards) {
    const full = part.length > 0 && sessionSeconds([...part, card]) > each * 1.1;
    const keep = part.at(-1)?.grammarIntro !== undefined;
    if (full && !keep && parts.length < count - 1) {
      parts.push(part);
      part = [];
    }
    part.push(card);
  }
  if (part.length > 0) parts.push(part);
  return parts;
}

/** A section is done once all its parts are. */
export function sectionDone(progress: SectionProgress | undefined): boolean {
  return progress !== undefined && progress.done >= progress.parts;
}

/** The part to do next in a section: the first not done, or the first again once all are. */
export function nextPart(progress: SectionProgress | undefined): number {
  if (!progress || sectionDone(progress)) return 1;
  return progress.done + 1;
}

/**
 * The section a unit is on: the first not done. The Read step of the earlier path counts as
 * 読み物 done. Undefined once all are done.
 */
export function currentSection(progress: UnitProgress): LessonSection | undefined {
  const sections = progress.sections ?? {};
  return LESSON_SECTIONS.find((section) => {
    if (section === 'reading' && progress.readAt !== undefined) return false;
    return !sectionDone(sections[section]);
  });
}

/** The progress after part `part` of `parts` is finished. Parts done out of order count once. */
export function finishPart(
  progress: SectionProgress | undefined,
  part: number,
  parts: number,
  now: number,
): SectionProgress {
  const done = Math.min(parts, Math.max(progress?.done ?? 0, part));
  return { parts, done, at: now };
}
