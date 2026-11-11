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

/** What a line is on its page, when it is not the page's own content. */
export type LineRole = 'instruction';

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
  /**
   * What the line is on its page, when the tutor said: an exercise's instruction
   * (正しいものを選びなさい). Absent for what the page teaches or asks, and for older scans.
   */
  role?: LineRole;
}

/**
 * What a run of a page's lines is, as printed: a title, what an exercise tells the learner to
 * do, an exercise made into questions, an exercise the app has no question type for (it needs a
 * picture, a table, sound, lines to draw), rows of kanji or words, or any other text.
 */
export type BlockKind = 'heading' | 'instruction' | 'exercise' | 'unsupported' | 'text' | 'list';

/** One block of a page, in printed order. */
export interface ScanBlock {
  kind: BlockKind;
  /** Its lines, as indexes into the page's `lines`. */
  lines: number[];
  /** For an exercise: the ids of its questions, in printed order. */
  questions?: string[];
  /** For an exercise that cannot be imported: why, as the tutor put it. */
  reason?: string;
}

export interface ScanPage {
  /** The photo, downscaled; absent for pasted text. */
  photo?: Blob;
  kind: PageKind;
  lines: ScanLine[];
  /**
   * The page from top to bottom, as the tutor read it. Absent for pasted text and for scans
   * made before pages kept their order: those show their lines, then their exercises.
   */
  blocks?: ScanBlock[];
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
  /**
   * Found only in exercise instructions, not in what the pages teach: it starts left out of the
   * lesson (`ScannedLesson.dropped`) until the learner adds it.
   */
  instruction?: true;
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
  /**
   * Keys of the items and questions the learner left out of the lesson: still listed, never
   * practised or counted. Absent when everything is kept, as in every older scan.
   */
  dropped?: string[];
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
