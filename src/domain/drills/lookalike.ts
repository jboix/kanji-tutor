import { itemId } from '../ids.ts';
import { unknownTokens } from '../selector.ts';
import type { WordLevels } from '../session-types.ts';
import type { Kanji, Sentence } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { KanjiChoice, LookalikeDrill } from './types.ts';

/** Two kanji that look alike (share a part), the first being the one written in the sentence. */
export interface LookalikePair {
  kanji: Kanji;
  lookalike: Kanji;
  /** The learner swapped them recently; such pairs are drilled first. */
  confused: boolean;
}

export interface LookalikeInput {
  /** In priority order: confused pairs first, then lookalike shapes among known kanji. */
  pairs: readonly LookalikePair[];
  /** Verified sentences whose readings JMdict confirms (the session's reading checks). */
  sentences: readonly Sentence[];
  levels: WordLevels;
  seed: string;
}

const choiceOf = (kanji: Kanji): KanjiChoice => ({
  char: kanji.char,
  readings: [...kanji.on, ...kanji.kun],
});

/**
 * Token of the sentence written with the kanji that may be blanked: a dictionary word, and the
 * only content token the learner may not know yet (i+1). The lookalike must not appear at all.
 */
function blankable(sentence: Sentence, pair: LookalikePair, levels: WordLevels): number {
  if (sentence.text.includes(pair.lookalike.char)) return -1;
  const unknown = unknownTokens(sentence, levels);
  const index = sentence.tokens.findIndex(
    (t) => t.wordId !== undefined && t.pos !== 'symbol' && t.surface.includes(pair.kanji.char),
  );
  return index >= 0 && unknown.every((i) => i === index) ? index : -1;
}

function drillFor(pair: LookalikePair, sentence: Sentence, index: number, seed: string) {
  const token = sentence.tokens[index];
  if (token?.wordId === undefined) return undefined;
  const choices = seededOrder([pair.kanji, pair.lookalike], (k) => k.char, seed).map(choiceOf);
  const drill: LookalikeDrill = {
    kind: 'lookalike',
    sentence,
    tokenIndex: index,
    at: token.start + token.surface.indexOf(pair.kanji.char),
    wordId: token.wordId,
    itemId: itemId('word', token.wordId),
    answer: pair.kanji.char,
    choices,
    confused: pair.confused,
  };
  return drill;
}

/**
 * "Which kanji fits?" (R8, 待/持): the first pair, in the given order, that some sentence can
 * carry, with the kanji blanked and both choices in a seeded order. Undefined when no sentence
 * carries any pair i+1-safely.
 */
export function lookalikeDrill(input: LookalikeInput): LookalikeDrill | undefined {
  const sentences = seededOrder(input.sentences, (s) => s.id, input.seed);
  for (const pair of input.pairs) {
    if (pair.kanji.char === pair.lookalike.char) continue;
    for (const sentence of sentences) {
      const index = blankable(sentence, pair, input.levels);
      if (index >= 0) return drillFor(pair, sentence, index, input.seed);
    }
  }
  return undefined;
}
