/**
 * Write the kanji: a word of a sentence the learner just read, blanked, to draw from its reading
 * (or, typed, to read from its meaning). Only short words of plain kanji: 々 and 〆 cannot be
 * drawn on their own, and three kanji are already a long exercise. Pure.
 */
import { itemId } from '../ids.ts';
import { hasKanji } from '../kana.ts';
import type { Sentence, Word } from '../types.ts';
import type { WriteDrill } from './types.ts';

export interface WriteInput {
  sentence: Sentence;
  /** The word to write: a target of the card that read the sentence. */
  target: { tokenIndex: number; wordId: string; surface: string; readings: readonly string[] };
  word: Word;
}

/** Kanji drawn in one exercise, at most. */
export const WRITE_MAX_KANJI = 3;

const UNDRAWABLE = /[々〆]/u;

/** The kanji of a written word, in order, or none when it has one that cannot be drawn. */
export function kanjiToDraw(written: string): string[] {
  if (UNDRAWABLE.test(written)) return [];
  return [...written].filter(hasKanji);
}

/** The exercise on the target, or undefined when it has no kanji to draw or too many. */
export function writeDrill({ sentence, target, word }: WriteInput): WriteDrill | undefined {
  const token = sentence.tokens[target.tokenIndex];
  const reading = target.readings[0];
  if (!token || token.surface !== target.surface || !reading) return undefined;
  const kanji = kanjiToDraw(token.surface);
  if (kanji.length === 0 || kanji.length > WRITE_MAX_KANJI) return undefined;
  const meaning = word.glossesByLang
    ? { glosses: word.glosses, glossesByLang: word.glossesByLang }
    : { glosses: word.glosses };
  return {
    kind: 'write',
    sentence,
    tokenIndex: target.tokenIndex,
    at: token.start,
    wordId: target.wordId,
    itemId: itemId('word', target.wordId),
    word: { written: token.surface, reading },
    kanji,
    readings: [...target.readings],
    meaning,
  };
}

/** The word with its kanji blanked, its kana kept (食べ → 〇べ), as the blank shows it. */
export function blankedWord(written: string, blank: string): string {
  return [...written].map((char) => (hasKanji(char) ? blank : char)).join('');
}
