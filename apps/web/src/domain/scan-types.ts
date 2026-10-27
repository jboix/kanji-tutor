/**
 * Scanned lessons: handout pages photographed (or pasted) together, read by the tutor, matched
 * against the dictionary and the grammar catalogue, and practised on their own, apart from the
 * daily sessions. Field names are stable: they are persisted in IndexedDB and in backups.
 */
import type { ItemId } from './types.ts';

/** What a page is about, as the tutor first reads it; the learner can change it. */
export type PageKind = 'kanji-list' | 'word-list' | 'grammar' | 'reading' | 'handout' | 'mixed';

export const PAGE_KINDS: readonly PageKind[] = [
  'kanji-list',
  'word-list',
  'grammar',
  'reading',
  'handout',
  'mixed',
];

/** One printed Japanese line of a page, in reading order. */
export interface ScanLine {
  text: string;
  /**
   * False while the tutor was unsure of its reading of the line and the learner has not checked
   * it: such a line "may be misread". Typed or pasted text, and checked lines, are verified.
   */
  verified: boolean;
  /** The line as a stored sentence (source `capture`), with its tokens. */
  sentenceId: string;
}

export interface ScanPage {
  /** The photo, downscaled; absent for pasted text. */
  photo?: Blob;
  kind: PageKind;
  lines: ScanLine[];
  /** The tutor read the page and listed what it teaches; absent for pasted text. */
  read?: true;
}

export type ScanItemKind = 'kanji' | 'word' | 'grammar';

/** A reading the tutor gave, after `verifyReading`; unverified ones are shown as such. */
export interface ScanReading {
  surface: string;
  reading: string;
  verified: boolean;
}

/** Something a page teaches: a kanji, a word or a grammar point. */
export interface ScanItem {
  kind: ScanItemKind;
  /** As printed or found, e.g. 晴, 天気予報, 〜そうだ. */
  text: string;
  /**
   * What it is in our data: the kanji, the JMdict id, or the catalogue (or particle) grammar
   * id. Absent when it is not in our lists.
   */
  ref?: string;
  /** Index of the first page it was found on. */
  page: number;
  /** Listed by the tutor from the page, or found in the page's lines by our own detectors. */
  from: 'tutor' | 'text';
  /** The tutor's gloss, kept for an item not in our lists. */
  meaning?: string;
  /** The tutor's reading of a word not in our lists, after `verifyReading`. */
  reading?: ScanReading;
}

/** The kinds of handout question the tutor tells apart. */
export type QuestionType =
  | 'choose-form'
  | 'particle'
  | 'reading'
  | 'write-kanji'
  | 'reorder'
  | 'free';

export const QUESTION_TYPES: readonly QuestionType[] = [
  'choose-form',
  'particle',
  'reading',
  'write-kanji',
  'reorder',
  'free',
];

/**
 * A question printed on an exercise handout. Handouts print no answers, so the tutor works
 * them out: the answer and explanation are the tutor's, stored on import and never shown before
 * the learner answers.
 */
export interface HandoutQuestion {
  /** Unique within the lesson, e.g. "2-4" (page index, question). */
  id: string;
  page: number;
  /** The number as printed, e.g. "4" or "(3)". */
  number?: string;
  type: QuestionType;
  /** The instruction as printed, e.g. 正しいものを選びなさい. */
  instruction?: string;
  /** The question itself, a blank written ＿＿, e.g. 雨が降り＿＿です。 */
  stem: string;
  /** For reading and write-the-kanji questions: the word asked about, as printed. */
  target?: string;
  /** Printed choices, in order; empty when there are none. */
  choices: string[];
  /** The tutor's answer. Hidden until the learner answers. */
  answer: string;
  /** False when the answer is a reading that `verifyReading` did not confirm. */
  answerVerified: boolean;
  /** The tutor's one-sentence explanation. Hidden until the learner answers. */
  explanation: string;
  /** Readings the explanation mentions, checked. */
  readings: ScanReading[];
  /** Keys of the lesson's items the question practises (see `scanItemKey`). */
  practises: string[];
}

/** A scanned lesson: one or more pages saved together, with their own progress. */
export interface ScannedLesson {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** The learner's title; it starts as the tutor's suggestion. */
  title: string;
  /** The title the tutor suggested; empty when there was none (pasted text, older captures). */
  suggestedTitle: string;
  /** ISO week of the scan, e.g. "2026-W43". */
  week: string;
  /** Class lesson tag, e.g. "Tobira 第4課". */
  lesson?: string;
  pages: ScanPage[];
  items: ScanItem[];
  questions: HandoutQuestion[];
  /** Practised keys (items and questions, see `scanItemKey`) → epoch ms of the last right answer. */
  practised: Record<string, number>;
  /** Items added to the week's lesson from a capture made before scanned lessons. */
  addedItemIds?: ItemId[];
  /**
   * Set on a capture converted into a scanned lesson: its items are found from its lines the
   * first time it opens.
   */
  unmatched?: true;
  /** How its items were matched (`SCAN_MATCH_VERSION`); absent means the first way. */
  matchVersion?: number;
}

/** A capture as stored before scanned lessons: converted on upgrade and on backup import. */
export interface LegacyCapture {
  id: string;
  createdAt: number;
  photo?: Blob;
  lines: string[];
  lesson?: string;
  week: string;
  addedItemIds: ItemId[];
  sentenceIds: string[];
}
