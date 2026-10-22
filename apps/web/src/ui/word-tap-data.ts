/**
 * Pure helpers behind tap-a-word (U5): which tokens open the word sheet, a sentence with
 * the answer masked out for sheets opened before answering, and sentences for text without one.
 */
import { blankText } from '../domain/drills/index.ts';
import type { SessionCard, Target } from '../domain/session-types.ts';
import type { Sentence, SentenceSource, Token } from '../domain/types.ts';

/**
 * Every token but punctuation and blanks opens a sheet: the word sheet (saying so when the word
 * is not in the dictionary), or a particle's static note (G5).
 */
export const opensSheet = (token: Token) => token.pos !== 'symbol';

/** A sentence with a span masked out, and the token indices that must stay shut. */
export interface MaskedSentence {
  sentence: Sentence;
  /** The fill token and any token the span cut into (〇っ of 待っ with 待 masked). */
  locked: number[];
  /** Index of the fill token. */
  blank: number;
}

const overlaps = (token: Token, from: number, to: number) =>
  token.start < to && token.start + token.surface.length > from;

/**
 * The sentence as an unanswered exercise shows it: the text in [from, to) replaced by `fill`
 * (the blank, or the kana a 表記 question underlines). It drops the translation, the grammar
 * ids and the level, and takes its own id, so a sheet opened on it cannot show the answer.
 */
export function maskSentence(
  sentence: Sentence,
  from: number,
  to: number,
  fill: string,
): MaskedSentence {
  const blanked = blankText(sentence, from, to, fill);
  const cutBefore = sentence.tokens.some((t) => t.start < from && overlaps(t, from, to));
  const cutAfter = sentence.tokens.some(
    (t) => t.start + t.surface.length > to && overlaps(t, from, to),
  );
  const locked = [blanked.blank];
  if (cutBefore) locked.push(blanked.blank - 1);
  if (cutAfter) locked.push(blanked.blank + 1);
  const masked: Sentence = {
    id: `${sentence.id}#unanswered`,
    text: blanked.text,
    source: sentence.source,
    tokens: blanked.tokens,
    wordIds: [],
    verified: sentence.verified,
  };
  return { sentence: masked, locked, blank: blanked.blank };
}

/** The tokens wholly inside [from, to), offset to the range, with their indices in the sentence. */
export function sliceTokens(
  sentence: { text: string; tokens: readonly Token[] },
  from: number,
  to: number,
) {
  const picked = sentence.tokens.flatMap((token, index) =>
    token.start >= from && token.start + token.surface.length <= to ? [{ token, index }] : [],
  );
  return {
    run: {
      text: sentence.text.slice(from, to),
      tokens: picked.map(({ token }) => ({ ...token, start: token.start - from })),
    },
    origin: picked.map(({ index }) => index),
  };
}

/** A sentence for Japanese shown without one (a word, an option, an authored example). */
export function looseSentence(
  id: string,
  text: string,
  tokens: readonly Token[],
  source: SentenceSource = 'unit',
): Sentence {
  const wordIds = [...new Set(tokens.flatMap((t) => (t.wordId ? [t.wordId] : [])))];
  return { id, text, source, tokens: [...tokens], wordIds, verified: true };
}

/** One dictionary word as a one-token sentence. */
export function wordSentence(form: string, wordId: string, reading = ''): Sentence {
  const token: Token = { surface: form, reading, base: form, pos: 'noun', wordId, start: 0 };
  return looseSentence(`word:${wordId}`, form, [token]);
}

/**
 * The card "Explain this sentence" gets for an exercise (U6): the sentence as shown, masked
 * before the answer, with the readings still to come as hidden targets (L3).
 */
export function helpCard(sentence: Sentence, hidden: readonly Target[] = []): SessionCard {
  return { sentence, targets: [...hidden], reason: 'drill' };
}

/** A target whose reading the tutor must not give: the token shown at `tokenIndex`. */
export function hiddenTarget(
  sentence: Sentence,
  tokenIndex: number,
  readings: string[],
  wordId = sentence.tokens[tokenIndex]?.wordId ?? '',
): Target {
  const token = sentence.tokens[tokenIndex];
  return {
    tokenIndex,
    itemId: `word:${wordId}`,
    wordId,
    surface: token?.surface ?? '',
    readings,
  };
}
