/**
 * Splits the learner's sentence into the pieces the red pen draws (A6): plain text, insertions,
 * replacements, deletions and style notes. Marks the sentence can't hold are dropped.
 */
import type { CorrectionMark } from '../../ai/index.ts';

export type Segment =
  | { kind: 'plain'; text: string; start: number }
  /** A caret with `insert` above it. */
  | { kind: 'insert'; text: ''; insert: string; start: number; mark: number }
  /** Original `text` struck through with `insert` above it. */
  | { kind: 'replace'; text: string; insert: string; start: number; mark: number }
  /** Original `text` struck through. */
  | { kind: 'delete'; text: string; start: number; mark: number }
  /** Original `text` with a wavy underline: correct, but there is a better way. */
  | { kind: 'style'; text: string; start: number; mark: number };

export interface MarkedSentence {
  segments: Segment[];
  /** The marks that were drawn, in sentence order; `Segment.mark` indexes this list. */
  marks: CorrectionMark[];
}

/** True when `at` splits a surrogate pair (a character outside the BMP). */
function splitsPair(text: string, at: number): boolean {
  const code = text.charCodeAt(at);
  return at > 0 && at < text.length && code >= 0xdc00 && code <= 0xdfff;
}

function inRange(text: string, mark: CorrectionMark): boolean {
  const { start, end } = mark;
  if (!Number.isInteger(start) || !Number.isInteger(end)) return false;
  if (start < 0 || end > text.length || start > end) return false;
  return !splitsPair(text, start) && !splitsPair(text, end);
}

/** Inserts are empty ranges with text; replacements and deletions cover text. */
function wellFormed(mark: CorrectionMark): boolean {
  if (mark.kind === 'insert') return mark.start === mark.end && mark.text !== '';
  if (mark.kind === 'replace') return mark.start < mark.end && mark.text !== '';
  return mark.start < mark.end;
}

/** Sentence order; an insert comes before a range that starts at the same offset. */
function byPosition(a: CorrectionMark, b: CorrectionMark): number {
  return a.start - b.start || a.end - b.end;
}

/** Valid marks in order, dropping any that overlap one already kept (or share its caret). */
export function drawableMarks(text: string, marks: readonly CorrectionMark[]): CorrectionMark[] {
  const kept: CorrectionMark[] = [];
  let end = 0;
  let caret = -1;
  for (const mark of marks.filter((m) => inRange(text, m) && wellFormed(m)).sort(byPosition)) {
    const isInsert = mark.kind === 'insert';
    if (mark.start < end || (isInsert && mark.start === caret)) continue;
    kept.push(mark);
    end = mark.end;
    if (isInsert) caret = mark.start;
  }
  return kept;
}

function segmentFor(text: string, mark: CorrectionMark, index: number): Segment {
  const { start } = mark;
  const original = text.slice(start, mark.end);
  if (mark.kind === 'insert')
    return { kind: 'insert', text: '', insert: mark.text, start, mark: index };
  if (mark.severity === 'style') return { kind: 'style', text: original, start, mark: index };
  if (mark.kind === 'delete') return { kind: 'delete', text: original, start, mark: index };
  return { kind: 'replace', text: original, insert: mark.text, start, mark: index };
}

/**
 * The sentence as plain and marked segments, from the marks' UTF-16 offsets. Style marks that
 * cover text draw as a wavy underline (compose.html); error replacements and deletions strike
 * the original. Out-of-range, malformed, overlapping and surrogate-splitting marks are dropped.
 */
export function markSegments(text: string, marks: readonly CorrectionMark[]): MarkedSentence {
  const kept = drawableMarks(text, marks);
  const segments: Segment[] = [];
  let cursor = 0;
  kept.forEach((mark, index) => {
    if (mark.start > cursor) {
      segments.push({ kind: 'plain', text: text.slice(cursor, mark.start), start: cursor });
    }
    segments.push(segmentFor(text, mark, index));
    cursor = mark.end;
  });
  if (cursor < text.length)
    segments.push({ kind: 'plain', text: text.slice(cursor), start: cursor });
  return { segments, marks: kept };
}
