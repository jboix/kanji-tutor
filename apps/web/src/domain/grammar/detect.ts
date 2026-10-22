/** Running grammar detectors over a sentence's tokens (G1). */
import type { GrammarPoint, Token } from '../types.ts';
import type { Matcher } from './dsl.ts';
import type { GrammarEntry, GrammarMatch } from './types.ts';

/** First token span the matcher covers (leftmost start, longest match); undefined when none. */
export function findSpan(
  rule: Matcher,
  tokens: readonly Token[],
): { start: number; end: number } | undefined {
  for (let start = 0; start < tokens.length; start++) {
    const end = Math.max(start, ...rule(tokens, start));
    if (end > start) return { start, end };
  }
  return undefined;
}

/** Where the sentence uses the entry's grammar point, or undefined. */
export function detectEntry(
  entry: GrammarEntry,
  tokens: readonly Token[],
): GrammarMatch | undefined {
  const span = findSpan(entry.rule, tokens);
  const first = span && tokens[span.start];
  const last = span && tokens[span.end - 1];
  if (!(span && first && last)) return undefined;
  const to = last.start + last.surface.length;
  return { id: entry.id, start: span.start, end: span.end, from: first.start, to };
}

/** Every entry the sentence uses, in catalogue order. */
export function detectEntries(
  entries: readonly GrammarEntry[],
  tokens: readonly Token[],
): GrammarMatch[] {
  return entries.flatMap((entry) => detectEntry(entry, tokens) ?? []);
}

/** The entry as a `GrammarPoint`, the shape the grammar store and drills use. */
export function toGrammarPoint(entry: GrammarEntry): GrammarPoint {
  return {
    id: entry.id,
    pattern: entry.pattern,
    meaning: entry.meaning,
    level: entry.level,
    exampleSentenceIds: [],
  };
}
