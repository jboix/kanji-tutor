import type { Drill } from './drills/types.ts';
import type { ComprehensionSet, Question } from './questions/types.ts';
import type { HandoutQuestion } from './scan-types.ts';
import type { ItemId, KnowledgeLevel, Sentence } from './types.ts';

/** One underlined target inside a session sentence. */
export interface Target {
  /** Index into `sentence.tokens`. */
  tokenIndex: number;
  itemId: ItemId;
  wordId: string;
  surface: string;
  /**
   * Accepted readings in hiragana: the preferred reading first (the one shown as furigana), with
   * its endings, then the other valid variants of the written form.
   */
  readings: string[];
  /** The readings in `readings` that are valid but not preferred (日本人 にっぽんじん), if any. */
  variants?: string[];
}

/** A sentence chosen for the session with its 1–2 targets (R2). */
export interface SessionCard {
  sentence: Sentence;
  targets: Target[];
  /** Why it was picked: due review, new item, drill, or plan focus. */
  reason: 'due' | 'new' | 'drill' | 'focus';
  /**
   * Set on drill cards only (reason 'drill', R8): the exercise to show. Drill cards have no
   * reading targets; `sentence` is the drill's sentence, or for word-only drills (many readings,
   * phonetic family) a word list built in memory with an id starting `drill:`, never stored.
   */
  drill?: Drill;
  /** Set on question cards only (reason 'drill', J1–J5): the JLPT-shaped question to show. */
  question?: Question;
  /** Set on reading-comprehension cards only (reason 'drill', T6): a passage and its questions. */
  passage?: ComprehensionSet;
  /**
   * Set on grammar introduction cards only (reason 'drill', G4): the catalogue grammar id to
   * introduce before its first exercise. No targets, nothing to answer.
   */
  grammarIntro?: string;
  /**
   * With explanations skipped (L7): the new grammar points this card exercises first. The card
   * shows a "New grammar" chip for each, opening its intro in a sheet.
   */
  newGrammar?: string[];
  /**
   * Set on the cards of a scanned lesson's practice: the lesson, and the key of its progress the
   * card counts for (`scanItemKey`, `questionKey`).
   */
  scan?: { lessonId: string; key: string };
  /** Set on a handout question card of a scanned lesson (reason 'drill', with `scan`). */
  handout?: HandoutQuestion;
}

/** Knowledge levels the selector reads, keyed by JMdict word id. */
export type WordLevels = ReadonlyMap<string, KnowledgeLevel>;
