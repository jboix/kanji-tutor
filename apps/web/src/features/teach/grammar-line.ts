/** Grammar points of a sentence from the catalogue (G1), for L3 and L5. No AI. */
import type { GrammarEntry } from '../../domain/grammar/index.ts';

export { sentenceGrammar } from '../../domain/grammar/index.ts';

/** The hardest point (N3 before N4 before N5), the first in the sentence on a tie (L5). */
export function hardestGrammar(entries: readonly GrammarEntry[]): GrammarEntry | undefined {
  return entries.reduce<GrammarEntry | undefined>(
    (best, entry) => (!best || entry.level < best.level ? entry : best),
    undefined,
  );
}
