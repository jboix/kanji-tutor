import {
  isKana as wkIsKana,
  toHiragana as wkToHiragana,
  toKana as wkToKana,
  toKatakana as wkToKatakana,
} from 'wanakana';

const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;
const KATA_TO_HIRA = 0x60;

/**
 * Converts romaji typed so far to kana, live (R3, I1). A trailing lone "n" stays as "n" so the
 * learner can still type "na"; `final` converts it to ん.
 */
export function toKana(input: string, final = false): string {
  return wkToKana(input, { IMEMode: !final });
}

/** The kana a romaji field types: hiragana (capitals still give katakana) or katakana. */
export type KanaScript = 'hiragana' | 'katakana';

/**
 * Romaji typed so far as kana in `script` (C6). Capitals give katakana either way, WanaKana's
 * convention (KOOHII → コオヒイ); in katakana every romaji letter does. Kana and kanji already
 * in the text are kept as they are.
 */
export function toKanaIn(input: string, script: KanaScript, final = false): string {
  const romaji =
    script === 'katakana' ? input.replace(/[a-z]+/g, (run) => run.toUpperCase()) : input;
  return toKana(romaji, final);
}

/** Katakana → hiragana; romaji and other characters pass through. ー becomes a vowel (こうひい). */
export function toHiragana(input: string): string {
  return wkToHiragana(input, { passRomaji: true });
}

/** Hiragana → katakana; romaji and other characters pass through. */
export function toKatakana(input: string): string {
  return wkToKatakana(input, { passRomaji: true });
}

/** True when `input` is non-empty and only hiragana, katakana or ー. */
export function isKana(input: string): boolean {
  return wkIsKana(input);
}

/** True when `input` contains Latin letters, i.e. is (partly) romaji still to convert. */
export function hasRomaji(input: string): boolean {
  return /[a-z]/i.test(input);
}

/**
 * Folds kana for comparison: katakana ァ–ヶ become their hiragana by code point, everything else
 * (including ー, kanji, punctuation) is kept, and surrounding whitespace is dropped. Simple on
 * purpose, so コーヒー and こーひー compare equal but こうひい does not.
 */
export function foldKana(input: string): string {
  let out = '';
  for (const char of input.trim()) {
    const code = char.codePointAt(0) ?? 0;
    const isKatakana = code >= KATAKANA_START && code <= KATAKANA_END;
    out += isKatakana ? String.fromCodePoint(code - KATA_TO_HIRA) : char;
  }
  return out;
}

/**
 * Normalises a reading claim to folded hiragana: romaji is converted (final mode), katakana is
 * folded. Returns the input folded as-is when it is already kana.
 */
export function normaliseReading(input: string): string {
  const trimmed = input.trim();
  return foldKana(hasRomaji(trimmed) ? toKana(trimmed.toLowerCase(), true) : trimmed);
}

/** The leading kana of `input` (romaji converted in IME mode), e.g. "tabem" → "たべ". */
export function kanaPrefix(input: string): string {
  const kana = toKana(input.trim().toLowerCase());
  let end = 0;
  for (const char of kana) {
    if (!wkIsKana(char)) break;
    end += char.length;
  }
  return kana.slice(0, end);
}
