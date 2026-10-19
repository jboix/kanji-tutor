/** jmdict-simplified (English) → `Word`, plus the lookup index used to resolve tokens. */
import { toHiragana } from 'wanakana';
import type { Word } from '../../src/domain/types.ts';

interface JmText {
  common: boolean;
  text: string;
  tags: string[];
  /** Kana only: the kanji writings it applies to; "*" (or absent) means all. */
  appliesToKanji?: string[];
}

interface JmSense {
  partOfSpeech: string[];
  /** Readings the sense applies to; "*" (or absent) means all. */
  appliesToKana?: string[];
  misc: string[];
  gloss: { lang: string; text: string }[];
}

export interface JmWord {
  id: string;
  kanji: JmText[];
  kana: JmText[];
  sense: JmSense[];
}

export interface JmDict {
  version: string;
  dictDate: string;
  words: JmWord[];
}

/** Search-only and rare/irregular forms are never shown. */
export const HIDDEN_TAGS = new Set(['sK', 'sk', 'rK', 'rk', 'iK', 'ik', 'io', 'oK', 'ok']);
const MAX_SENSES = 3;

function visible(texts: JmText[]): string[] {
  const shown = texts.filter((t) => !t.tags.some((tag) => HIDDEN_TAGS.has(tag)));
  const list = shown.length > 0 ? shown : texts.filter((t) => !t.tags.includes('sK'));
  // Stable sort: common writings first, JMdict order otherwise.
  return [...list].sort((a, b) => Number(b.common) - Number(a.common)).map((t) => t.text);
}

/** The writing a word is usually shown in: its first visible kanji form, unless it is a kana word. */
export function usualKanjiForm(word: JmWord): string | undefined {
  if (word.sense[0]?.misc.includes('uk')) return undefined;
  const shown = word.kanji.filter((t) => !t.tags.some((tag) => HIDDEN_TAGS.has(tag)));
  return visible(shown)[0];
}

export function isCommon(word: JmWord): boolean {
  return word.kanji.some((k) => k.common) || word.kana.some((k) => k.common);
}

/**
 * One gloss line per sense (glosses of a sense joined with "; "), first senses only, in one
 * JMdict language ("eng", "fre", "spa").
 */
export function senseGlosses(word: JmWord, lang = 'eng'): string[] {
  return word.sense
    .slice(0, MAX_SENSES)
    .map((sense) =>
      sense.gloss
        .filter((g) => g.lang === lang)
        .map((g) => g.text)
        .join('; '),
    )
    .filter((line) => line.length > 0);
}

export function toWord(word: JmWord, jlpt: ReadonlyMap<string, Word['jlpt']>): Word {
  const out: Word = {
    id: word.id,
    forms: visible(word.kanji),
    readings: visible(word.kana),
    glosses: senseGlosses(word),
    common: isCommon(word),
  };
  const level = jlpt.get(word.id);
  if (level) out.jlpt = level;
  const pos = word.sense[0]?.partOfSpeech;
  if (pos && pos.length > 0) out.pos = pos;
  return out;
}

/** An entry as seen by the token matcher. */
export interface LookupEntry {
  id: string;
  /** All writings (kanji and kana), including hidden ones, as kuromoji may produce them. */
  texts: Set<string>;
  /** Readings folded to hiragana. */
  kana: Set<string>;
  /** Index of the text in its list (0 = primary form). */
  rank: Map<string, number>;
  common: boolean;
  /** Has no common kanji writing, or its first sense is "usually written using kana alone". */
  kanaWord: boolean;
  pos: string[];
}

export type Lookup = Map<string, LookupEntry[]>;

function lookupEntry(word: JmWord): LookupEntry {
  const rank = new Map<string, number>();
  for (const [i, k] of word.kanji.entries()) rank.set(k.text, i);
  for (const [i, k] of word.kana.entries()) if (!rank.has(k.text)) rank.set(k.text, i);
  return {
    id: word.id,
    texts: new Set([...word.kanji, ...word.kana].map((t) => t.text)),
    kana: new Set(word.kana.map((k) => toHiragana(k.text))),
    rank,
    common: isCommon(word),
    kanaWord:
      word.kanji.every((k) => k.tags.some((tag) => HIDDEN_TAGS.has(tag))) ||
      (word.sense[0]?.misc.includes('uk') ?? false),
    pos: word.sense.flatMap((s) => s.partOfSpeech),
  };
}

/** Index from every writing (and hiragana-folded reading) to the entries that have it. */
export function buildLookup(words: JmWord[]): Lookup {
  const lookup: Lookup = new Map();
  for (const word of words) {
    const entry = lookupEntry(word);
    const keys = new Set([...entry.texts, ...entry.kana]);
    for (const key of keys) {
      const list = lookup.get(key);
      if (list) list.push(entry);
      else lookup.set(key, [entry]);
    }
  }
  return lookup;
}
