/**
 * Preferred readings (D56): kuromoji/IPADIC often reads a word in a valid but less usual way
 * (日本人 as にっぽんじん). For each token resolved to a JMdict entry and written as the entry
 * writes it, the reading becomes the entry's preferred one for that writing, and the other
 * usual readings of that writing are kept as `variants`, which grading accepts. A reading with a
 * sense of its own keeps it: 今日 こんにち also means "these days" and 明日 あす "the near future"
 * (JMdict `appliesToKana`), and readings of other entries (一日 ついたち) are never touched. A
 * lone kanji (何 なに or なん) is left alone: its reading depends on what follows. Pure.
 */
import { toHiragana } from 'wanakana';
import type { Token } from '../../src/domain/types.ts';
import { HIDDEN_TAGS, type JmWord } from './jmdict.ts';

const HAN = /\p{Script=Han}/u;

type Kana = JmWord['kana'][number];

const applies = (kana: Kana, written: string) =>
  !kana.appliesToKanji ||
  kana.appliesToKanji.includes('*') ||
  kana.appliesToKanji.includes(written);
const hidden = (kana: Kana) => kana.tags.some((tag) => HIDDEN_TAGS.has(tag));

/**
 * The readings of `word` written `written`, in hiragana, preferred first: common ones first,
 * then in JMdict order; search-only, rare, irregular and outdated readings never count. Empty
 * when the entry has no such kanji writing.
 */
export function readingsFor(word: JmWord, written: string): string[] {
  if (!word.kanji.some((k) => k.text === written)) return [];
  const usable = word.kana.filter((k) => applies(k, written) && !hidden(k));
  const ordered = [...usable].sort((a, b) => Number(b.common) - Number(a.common));
  return [...new Set(ordered.map((k) => toHiragana(k.text)))];
}

/** Every reading of `word`, hidden ones included, in hiragana. */
function allReadings(word: JmWord): Set<string> {
  return new Set(word.kana.map((k) => toHiragana(k.text)));
}

/** Indices of the senses that apply to `reading` (hiragana). */
function sensesOf(word: JmWord, reading: string): Set<number> {
  const out = new Set<number>();
  word.sense.forEach((sense, i) => {
    const kana = sense.appliesToKana ?? ['*'];
    if (kana.includes('*') || kana.some((k) => toHiragana(k) === reading)) out.add(i);
  });
  return out;
}

/** True when `reading` means nothing `preferred` does not: a mere variant of it. */
function sameMeaning(word: JmWord, reading: string, preferred: string): boolean {
  const theirs = sensesOf(word, preferred);
  return [...sensesOf(word, reading)].every((i) => theirs.has(i));
}

/** The other readings of the writing that mean the same: the ones a learner may know and type. */
function variantsOf(word: JmWord, written: string, preferred: string): string[] {
  return readingsFor(word, written).filter(
    (r) => r !== preferred && sameMeaning(word, r, preferred),
  );
}

/**
 * The variants of a pack word (`Word.variants`): the other readings of its usual writing that
 * mean the same as its first reading, when that first reading is the preferred one.
 */
export function wordVariants(word: JmWord, form: string | undefined, first: string | undefined) {
  if (!form || !first || [...form].length < 2) return undefined;
  const preferred = readingsFor(word, form)[0];
  if (preferred !== toHiragana(first)) return undefined;
  const variants = variantsOf(word, form, preferred);
  return variants.length > 0 ? variants : undefined;
}

/** One token with its preferred reading, or the token itself when it already has it. */
export function preferToken(token: Token, words: ReadonlyMap<string, JmWord>): Token {
  const word = token.wordId === undefined ? undefined : words.get(token.wordId);
  if (!word || token.surface !== token.base || !HAN.test(token.surface)) return token;
  if ([...token.surface].length < 2) return token;
  const preferred = readingsFor(word, token.surface)[0];
  const current = toHiragana(token.reading);
  if (preferred === undefined || !allReadings(word).has(current)) return token;
  if (!sameMeaning(word, current, preferred)) return token;
  const variants = variantsOf(word, token.surface, preferred);
  if (current === preferred && variants.length === 0) return token;
  return {
    ...token,
    reading: preferred,
    ...(variants.length > 0 ? { variants } : {}),
  };
}

/** `tokens` with preferred readings, and how many readings changed. */
export function preferReadings(
  tokens: readonly Token[],
  words: ReadonlyMap<string, JmWord>,
): { tokens: Token[]; changed: number } {
  let changed = 0;
  const out = tokens.map((token) => {
    const next = preferToken(token, words);
    if (next.reading !== token.reading) changed += 1;
    return next;
  });
  return { tokens: out, changed };
}
