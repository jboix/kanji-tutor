/** Grammar detection for the pack pipeline (G1, G2): which catalogue points a sentence uses. */

import { GRAMMAR_CATALOGUE } from '../../../src/domain/grammar/catalogue.ts';
import { detectEntries } from '../../../src/domain/grammar/detect.ts';
import type { GrammarEntry, GrammarMatch } from '../../../src/domain/grammar/types.ts';
import type { Token } from '../../../src/domain/types.ts';

/** Every catalogue point the tokens use, with its token span and text offsets. */
export function detectGrammar(
  tokens: readonly Token[],
  catalogue: readonly GrammarEntry[] = GRAMMAR_CATALOGUE,
): GrammarMatch[] {
  return detectEntries(catalogue, tokens);
}

/** The distinct grammar ids a sentence uses, for `Sentence.grammarIds`. */
export function grammarIdsOf(
  tokens: readonly Token[],
  catalogue: readonly GrammarEntry[] = GRAMMAR_CATALOGUE,
): string[] {
  return [...new Set(detectGrammar(tokens, catalogue).map((match) => match.id))];
}
