/**
 * Small kana helpers the domain needs for grading and alignment. Pure functions over hiragana;
 * romaji and katakana are folded with WanaKana first.
 */
import { toHiragana } from 'wanakana';

const VOWEL_ROWS: Record<string, string> = {
  a: 'あかがさざただなはばぱまやらわぁゃゎ',
  i: 'いきぎしじちぢにひびぴみりぃ',
  u: 'うくぐすずつづぬふぶぷむゆるぅゅゔ',
  e: 'えけげせぜてでねへべぺめれぇ',
  o: 'おこごそぞとどのほぼぽもよろをぉょ',
};

const VOWEL_OF = new Map<string, string>(
  Object.entries(VOWEL_ROWS).flatMap(([vowel, row]) => [...row].map((c) => [c, vowel])),
);

const VOWEL_KANA: Record<string, string> = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' };

/** Kana that lengthen a mora ending in the given vowel (おう, えい, ああ…), plus ー. */
const LENGTHENERS: Record<string, string> = {
  a: 'あー',
  i: 'いー',
  u: 'うー',
  e: 'いえー',
  o: 'うおー',
};

const KANJI = /[㐀-䶿一-鿿豈-﫿々〆]/u;

/** Vowel ('a'…'o') of a hiragana character, if it has one. */
export function vowelOf(char: string): string | undefined {
  return VOWEL_OF.get(char);
}

/** True when the text contains at least one kanji (or 々). */
export function hasKanji(text: string): boolean {
  return KANJI.test(text);
}

/** Replaces each ー with the vowel kana of the mora before it: かーど → かあど. */
function expandLongMarks(text: string): string {
  let out = '';
  for (const char of text) {
    const vowel = char === 'ー' ? vowelOf(out.at(-1) ?? '') : undefined;
    out += vowel ? (VOWEL_KANA[vowel] ?? char) : char;
  }
  return out;
}

/**
 * Folds romaji, katakana and hiragana to plain hiragana: trims, drops inner spaces, converts
 * with WanaKana and spells out ー as a vowel. `gakkou`, `ガッコウ`, `がっこう` → `がっこう`.
 */
export function toKanaFold(text: string): string {
  return expandLongMarks(toHiragana(text.trim().replace(/\s+/gu, '')));
}

/**
 * Drops every kana that only lengthens the mora before it: しょうかい → しょかい,
 * おばあさん → おばさん, せんせい → せんせ. Used to compare readings modulo long vowels.
 */
export function shortenVowels(kana: string): string {
  let out = '';
  let vowel: string | undefined;
  for (const char of kana) {
    if (vowel && LENGTHENERS[vowel]?.includes(char)) continue;
    out += char;
    vowel = vowelOf(char);
  }
  return out;
}

/** Removes voicing marks: が → か, ぱ → は, びと → ひと. */
export function devoice(kana: string): string {
  return kana.normalize('NFD').replace(/[゙゚]/gu, '').normalize('NFC');
}

const VOICED: Record<string, string> = Object.fromEntries(
  [...'かきくけこさしすせそたちつてとはひふへほ'].map((c) => [
    c,
    String.fromCharCode(c.charCodeAt(0) + 1),
  ]),
);

const SEMI_VOICED: Record<string, string> = Object.fromEntries(
  [...'はひふへほ'].map((c) => [c, String.fromCharCode(c.charCodeAt(0) + 2)]),
);

/** Voiced (rendaku) and semi-voiced variants of a reading's first mora: ひと → [びと]. */
export function voicedVariants(kana: string): string[] {
  const first = kana.charAt(0);
  const rest = kana.slice(1);
  return [VOICED[first], SEMI_VOICED[first]].filter((c) => c !== undefined).map((c) => c + rest);
}
