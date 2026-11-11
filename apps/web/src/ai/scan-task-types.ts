/** Input and output of `analysePage`, the scanned lessons' page reading, re-exported by `types.ts`. */

import type { BlockKind, PageKind, QuestionType } from '../domain/scan-types.ts';
import type { CheckedReading, Media } from './task-shared-types.ts';

/** One photographed page of a scan: page `page` of `pages` (1-based), read on its own. */
export interface AnalysePageInput {
  image: Media;
  page: number;
  pages: number;
}

/** A handout question with the tutor's answer, its readings checked (A8). */
export interface AnalysedQuestion {
  number?: string;
  type: QuestionType;
  instruction?: string;
  /** As printed, each blank written ＿＿. */
  stem: string;
  target?: string;
  choices: string[];
  answer: string;
  /** False when the answer is a reading `verifyReading` did not confirm. */
  answerVerified: boolean;
  explanation: string;
  /** The readings its explanation mentions, checked. */
  readings: CheckedReading[];
  /** Index in `PageAnalysis.blocks` of the exercise it belongs to. */
  block: number;
}

/** One block of a page, in printed order; its lines and questions point to it. */
export interface PageBlock {
  kind: BlockKind;
  /** For an exercise that cannot be imported: why, in the explanation language. */
  reason?: string;
}

/** What a page is about and what it teaches (the scanned lessons). */
export interface PageAnalysis {
  kind: PageKind;
  /** A short title in the explanation language. */
  title: string;
  /** The page from top to bottom: what each run of lines is. */
  blocks: PageBlock[];
  /**
   * The lines in reading order, each with its block (Japanese lines, and every line of an
   * exercise that cannot be imported); `unsure` when part of it was hard to make out; an
   * `instruction` only tells the learner what to do in an exercise.
   */
  lines: { text: string; unsure: boolean; role: 'instruction' | 'content'; block: number }[];
  kanji: { char: string; meaning: string }[];
  words: { written: string; reading: CheckedReading; meaning: string }[];
  grammar: { pattern: string; meaning: string }[];
  questions: AnalysedQuestion[];
  readings: CheckedReading[];
}
