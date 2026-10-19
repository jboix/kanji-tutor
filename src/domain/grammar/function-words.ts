/** Particles and function words (G5): their entries and what explains a tapped token. */

import type { Token } from '../types.ts';
import { GRAMMAR_CATALOGUE } from './catalogue.ts';
import { detectEntry } from './detect.ts';
import { CASE_PARTICLES } from './particles-a.ts';
import { OTHER_PARTICLES } from './particles-b.ts';
import type { FunctionWord, GrammarEntry } from './types.ts';

/** Every particle and function word entry, case particles first. */
export const FUNCTION_WORDS: readonly FunctionWord[] = [...CASE_PARTICLES, ...OTHER_PARTICLES];

/** True when `word`'s rule matches the token at `index` itself. */
export function matchesAt(word: FunctionWord, tokens: readonly Token[], index: number): boolean {
  return word.rule(tokens, index).some((end) => end > index);
}

/** The static notes for a tapped particle or function word. */
export interface FunctionWordNotes {
  /** Entries for the token itself (が subject, or が but, by what comes before). */
  words: FunctionWord[];
  /** Catalogue points whose span holds the token, minus those the words already cover. */
  grammar: GrammarEntry[];
}

/** What the app can say about token `index` without AI (G5): particle entries and catalogue points. */
export function functionWordNotes(tokens: readonly Token[], index: number): FunctionWordNotes {
  const words = FUNCTION_WORDS.filter((word) => matchesAt(word, tokens, index));
  const covered = new Set(words.flatMap((word) => word.grammarId ?? []));
  const grammar = GRAMMAR_CATALOGUE.filter((entry) => {
    if (covered.has(entry.id)) return false;
    const match = detectEntry(entry, tokens);
    return match !== undefined && match.start <= index && index < match.end;
  });
  return { words, grammar };
}
