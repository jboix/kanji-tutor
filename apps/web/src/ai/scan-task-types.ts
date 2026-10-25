/** Input and output of `analysePage`, the scanned lessons' page reading, re-exported by `types.ts`. */

import type { PageKind, QuestionType } from '../domain/scan-types.ts';
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
}

/** What a page is about and what it teaches (the scanned lessons). */
export interface PageAnalysis {
  kind: PageKind;
  /** A short title in the explanation language. */
  title: string;
  /** Japanese lines only, in reading order; `unsure` when part of it was hard to make out. */
  lines: { text: string; unsure: boolean }[];
  kanji: { char: string; meaning: string }[];
  words: { written: string; reading: CheckedReading; meaning: string }[];
  grammar: { pattern: string; meaning: string }[];
  questions: AnalysedQuestion[];
  readings: CheckedReading[];
}
