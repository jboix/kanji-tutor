/** Grammar points of a sentence from the catalogue (G1), for L3, L5 and the word sheet. */

import type { Sentence } from '../types.ts';
import { GRAMMAR_CATALOGUE } from './catalogue.ts';
import { detectEntries } from './detect.ts';
import type { GrammarEntry } from './types.ts';

const BY_ID = new Map(GRAMMAR_CATALOGUE.map((entry) => [entry.id, entry]));

/**
 * The catalogue points in the sentence: those tagged at pack time (`grammarIds`), plus those
 * the detectors find in its tokens, in sentence order, each once.
 */
export function sentenceGrammar(sentence: Pick<Sentence, 'tokens' | 'grammarIds'>): GrammarEntry[] {
  const tagged = (sentence.grammarIds ?? []).flatMap((id) => BY_ID.get(id) ?? []);
  const found = detectEntries(GRAMMAR_CATALOGUE, sentence.tokens)
    .sort((a, b) => a.start - b.start)
    .flatMap((match) => BY_ID.get(match.id) ?? []);
  return [...new Map([...found, ...tagged].map((entry) => [entry.id, entry])).values()];
}
