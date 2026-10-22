/**
 * Unit words written in kana (T8). A unit writes a word whose kanji are above its level in kana,
 * as graded readers do (じゅく for 塾). Kuromoji splits hiragana nouns it does not know
 * (じゅくに → じ ゅくに), so a unit's texts are tokenized around those words: each one becomes
 * a single noun token, and kuromoji parses the rest of the sentence as before. Pure.
 */
import { toKatakana } from 'wanakana';
import type { Unit } from '../../src/domain/themes/types.ts';
import type { Tokenize } from './tokenizer.ts';
import type { RawToken } from './tokens.ts';

/** Shorter kana words match inside other words too often (しか in しかし). */
const MIN_LENGTH = 3;
const KANA = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u;

const INFLECTING = new Set(['動詞', '形容詞']);

/** A kana verb or adjective in its dictionary form, which kuromoji already reads as one word. */
function inflects(written: string, tokenize: Tokenize): boolean {
  const raws = tokenize(written);
  const only = raws.length === 1 ? raws[0] : undefined;
  return only !== undefined && INFLECTING.has(only.pos) && only.basic_form === written;
}

/**
 * The unit's nouns written in kana, of at least `MIN_LENGTH` characters, longest first. Kana verbs
 * and adjectives (もえる, かつぐ) stay with kuromoji, which conjugates them.
 */
export function kanaWordsOf(unit: Pick<Unit, 'words'>, tokenize: Tokenize): string[] {
  return unit.words
    .map((w) => w.written)
    .filter((written) => KANA.test(written) && written.length >= MIN_LENGTH)
    .filter((written) => !inflects(written, tokenize))
    .sort((a, b) => b.length - a.length);
}

function nounToken(surface: string): RawToken {
  return {
    surface_form: surface,
    pos: '名詞',
    pos_detail_1: '一般',
    basic_form: surface,
    conjugated_type: '*',
    reading: toKatakana(surface),
  };
}

/** Each place in `text` where one of `words` starts, longest word first, without overlaps. */
function places(text: string, words: readonly string[]): { start: number; word: string }[] {
  const out: { start: number; word: string }[] = [];
  for (let i = 0; i < text.length; ) {
    const word = words.find((w) => text.startsWith(w, i));
    if (word) out.push({ start: i, word });
    i += word ? word.length : 1;
  }
  return out;
}

/**
 * A noun kuromoji keeps as one token and rarely joins to its neighbours. Each kana word is
 * swapped for it before tokenizing, so the particles around it parse as in the whole sentence.
 */
const STAND_IN = '机';

/** `tokenize`, with every writing of `words` in a text kept as one noun token. */
export function tokenizeAround(tokenize: Tokenize, words: readonly string[]): Tokenize {
  if (words.length === 0) return tokenize;
  return (text) => {
    const found = places(text, words);
    if (found.length === 0) return tokenize(text);
    let swapped = '';
    let cursor = 0;
    for (const { start, word } of found) {
      swapped += text.slice(cursor, start) + STAND_IN;
      cursor = start + word.length;
    }
    const queue = found.map((f) => f.word);
    return tokenize(swapped + text.slice(cursor)).map((raw) => {
      const word = raw.surface_form === STAND_IN ? queue.shift() : undefined;
      return word ? nounToken(word) : raw;
    });
  };
}
