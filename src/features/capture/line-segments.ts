/** Splits a captured line into runs for display: unknown words and AI-cited phrases. */
import type { Token } from '../../domain/types.ts';

export interface LineSegment {
  text: string;
  /** Offset in the line, a stable key. */
  start: number;
  /** Part of a word the learner cannot read yet (dotted underline). */
  unknown: boolean;
  /** Part of a phrase the AI explanation is about (vermilion underline). */
  cited: boolean;
}

function unknownMask(text: string, tokens: readonly Token[], unknown: readonly number[]) {
  const mask = new Array<boolean>(text.length).fill(false);
  for (const i of unknown) {
    const token = tokens[i];
    if (token) mask.fill(true, token.start, token.start + token.surface.length);
  }
  return mask;
}

function citedMask(text: string, phrases: readonly string[]) {
  const mask = new Array<boolean>(text.length).fill(false);
  for (const phrase of phrases) {
    const at = text.indexOf(phrase);
    if (at >= 0) mask.fill(true, at, at + phrase.length);
  }
  return mask;
}

/** Runs of characters with the same flags, in order; they join back into `text`. */
export function lineSegments(
  text: string,
  tokens: readonly Token[],
  unknown: readonly number[],
  cited: readonly string[] = [],
): LineSegment[] {
  const u = unknownMask(text, tokens, unknown);
  const c = citedMask(text, cited);
  const segments: LineSegment[] = [];
  for (let i = 0; i < text.length; i++) {
    const flags = { unknown: u[i] ?? false, cited: c[i] ?? false };
    const last = segments.at(-1);
    if (last && last.unknown === flags.unknown && last.cited === flags.cited) last.text += text[i];
    else segments.push({ text: text[i] ?? '', start: i, ...flags });
  }
  return segments;
}

const JAPANESE = /([\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー々〜、。「」]+)/u;

/** English and Japanese runs of an explanation, so Japanese can be set in Klee One (N7). */
export function splitJapanese(text: string): { text: string; ja: boolean; start: number }[] {
  let start = 0;
  return text
    .split(JAPANESE)
    .filter(Boolean)
    .map((part) => {
      const run = { text: part, ja: JAPANESE.test(part), start };
      start += part.length;
      return run;
    });
}
