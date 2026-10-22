/**
 * Places the tutor's red-pen marks on the learner's sentence by the text they quote (A6). Models
 * count UTF-16 offsets badly (one off is common), so a mark carries the text it covers and a few
 * characters before it, and its offsets only choose between occurrences of that text.
 */
import type { CorrectionMark } from './task-types.ts';

/** A mark as the model sends it: the quoted text with the offsets it counted. */
export interface QuotedMark extends CorrectionMark {
  /** The learner's text the mark covers; empty for an insertion. */
  original: string;
  /** Up to three characters just before the mark; empty at the start of the sentence. */
  before: string;
}

/** Where each occurrence of `needle` starts in `text` (overlapping ones too). */
function occurrences(text: string, needle: string): number[] {
  const starts: number[] = [];
  for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + 1)) {
    starts.push(at);
  }
  return starts;
}

/** The start closest to the offset the model counted; the earlier one on a tie. */
function nearest(starts: readonly number[], to: number): number | undefined {
  let best: number | undefined;
  for (const start of starts) {
    if (best === undefined || Math.abs(start - to) < Math.abs(best - to)) best = start;
  }
  return best;
}

const fits = (sentence: string, mark: CorrectionMark) =>
  mark.start <= mark.end && mark.end <= sentence.length;

/** Starts of the quoted span: with its context first, else the covered text alone. */
function quotedStarts(sentence: string, { kind, original, before }: QuotedMark): number[] {
  const withContext = occurrences(sentence, before + original).map((at) => at + before.length);
  if (withContext.length > 0 || kind === 'insert' || before === '') return withContext;
  return occurrences(sentence, original);
}

/**
 * The mark at the place its quote shows in the sentence, nearest the offsets the model counted;
 * undefined when the quote is not in the sentence. A mark that quotes nothing keeps its offsets.
 */
export function anchorMark(sentence: string, mark: QuotedMark): CorrectionMark | undefined {
  const { original, before, ...placed } = mark;
  const quotesNothing = before + original === '' || (mark.kind !== 'insert' && original === '');
  if (quotesNothing) return fits(sentence, placed) ? placed : undefined;
  const start = nearest(quotedStarts(sentence, mark), mark.start);
  if (start === undefined) return undefined;
  return { ...placed, start, end: start + (mark.kind === 'insert' ? 0 : original.length) };
}

/** Every mark anchored by its quote; marks whose quote is not in the sentence are dropped. */
export function anchorMarks(sentence: string, marks: readonly QuotedMark[]): CorrectionMark[] {
  return marks.flatMap((mark) => anchorMark(sentence, mark) ?? []);
}
