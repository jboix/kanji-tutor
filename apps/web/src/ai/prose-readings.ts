/**
 * Readings written inside AI prose (A8), in any explanation language: furigana-style
 * brackets after a kanji anywhere ("紹介 (しょうかい)", 紹介「しょうかい」), a kana run after
 * ＝, = or a colon, and the phrasings of en ("一生 is いっしょう"), fr (« 紹介 se lit しょうかい »),
 * es ("紹介 se lee しょうかい") and ja (「紹介」は「しょうかい」と読みます, 「紹介」の読み方は…).
 * The model is asked to list every reading in `readings`, but prose can still show one it left
 * out. These are pulled from the text, checked like listed claims and added to `readings`, so a
 * wrong one is marked unverified wherever the UI lists failed claims.
 */
import type { Verifier } from './task-def.ts';
import type { CheckedReading, ReadingClaim } from './types.ts';
import { checkReading, checkReadings } from './verify.ts';

/** A reading found in prose and the surfaces it may belong to; the first one is shown. */
export interface ProseClaim {
  surfaces: string[];
  reading: string;
}

const JA = '[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}ー々〆ヶ]';
const KANJI = '[\\p{Script=Han}々〆ヶ]';
/** Hiragana or katakana, as a reading is written (しょうかい, ショウ). */
const KANA = '[ぁ-ゖァ-ヺー]';
const GAP = '[ \\u3000]?';
const NOT_JA = `(?!${JA})`;
/** Quotes a word or a reading may sit in: "紹介", « 紹介 », 「紹介」. */
const OPEN_Q = '[ \\u3000]*["“«「『]?[ \\u3000]*';
const CLOSE_Q = '[ \\u3000]*["”»」』]?[ \\u3000]*';
/** A word written with kanji in Japanese prose: a kanji block and okurigana (待つ, 紹介). */
const WORD = `${KANJI}+${KANA}{0,4}?`;

/** 紹介(しょうかい), 紹介 （しょうかい）, 生【せい】: furigana-style, any length. */
const PAREN = new RegExp(`(${JA}+)${GAP}[(（【［]${GAP}(${KANA}+)${GAP}[)）】］]`, 'gu');
/** 紹介「しょうかい」: a kana quote right after a kanji. */
const QUOTED = new RegExp(`(${JA}*${KANJI})[「『](${KANA}+)[」』]`, 'gu');
/**
 * A word, then a cue, then a reading of two kana or more: "一生 is いっしょう", "read 一緒 as
 * いっしょ" (en); « 紹介 » se lit « しょかい », "紹介 se prononce しょうかい" (fr); "紹介 se lee
 * しょうかい", "se pronuncia" (es).
 */
const CUE =
  '(?:is read as|is read|reads as|read as|is pronounced|is|as|read|' +
  'se lit comme|se lit|se prononce|se dit|est|' +
  'se lee como|se lee|se pronuncia|se dice|es)';
const LINKED = new RegExp(`(${JA}+)${CLOSE_Q} ${CUE}${OPEN_Q}(${KANA}{2,})${NOT_JA}`, 'giu');
/** "lecture de 紹介 : しょうかい", "la lectura de 紹介 es しょうかい", "the reading of 間 is あいだ". */
const READING_OF = new RegExp(
  `(?:lecture|lectura|reading)\\s+(?:de|del|of)${OPEN_Q}(${JA}+)${CLOSE_Q}` +
    `(?:est|es|is|[:：=＝])?${OPEN_Q}(${KANA}{2,})${NOT_JA}`,
  'giu',
);
/** "紹介 (lecture : しょうかい)", "紹介, lectura しょうかい". */
const READING_AFTER = new RegExp(
  `(${JA}+)${CLOSE_Q}[(（,、]?${GAP}(?:lecture|lectura|reading)${GAP}[:：]?${OPEN_Q}(${KANA}{2,})`,
  'giu',
);
/** "間: あいだ", "間 = あいだ", "紹介＝しょうかい". */
const MARKED = new RegExp(`(${JA}+)${GAP}[:：=＝]${GAP}(${KANA}{2,})${NOT_JA}`, 'gu');
/** 「紹介」は「しょうかい」と読みます, 紹介を しょうかい と読む (ja). */
const TO_YOMU = new RegExp(
  `(${WORD})[」』]?[ \\u3000]*[はを][ \\u3000]*[「『]?(${KANA}+?)[」』]?[ \\u3000]*と読`,
  'gu',
);
/** 「紹介」の読み方は「しょうかい」です, 紹介の読みは しょうかい (ja). */
const YOMIKATA = new RegExp(
  `(${WORD})[」』]?の読み(?:方)?は[ \\u3000]*[「『]?(${KANA}+?)(?:[」』]|です|。|、|\\s|$)`,
  'gu',
);
const PATTERNS = [PAREN, QUOTED, LINKED, READING_OF, READING_AFTER, MARKED, TO_YOMU, YOMIKATA];

const HAN = /[\p{Script=Han}々〆ヶ]/u;
/** One word: optional kana, one kanji block, optional okurigana (お茶, 待つ, 紹介). */
const ONE_WORD = /^[^\p{Script=Han}々〆ヶ]*[\p{Script=Han}々〆ヶ]+[^\p{Script=Han}々〆ヶ]*$/u;
const TRAILING_KANA = /[^\p{Script=Han}々〆ヶ]+$/u;

/** Indices where a kanji block starts after kana: 友達を待っている → 0 (友) and 3 (待). */
function blockStarts(chars: readonly string[]): number[] {
  return chars.flatMap((char, i) => {
    const starts = HAN.test(char) && (i === 0 || !HAN.test(chars[i - 1] ?? ''));
    return starts ? [i] : [];
  });
}

/**
 * The words a reading may be the furigana of, the likeliest first: the whole run when it is one
 * word, else its last word; then every word-start suffix, each also without okurigana.
 */
export function surfacesOf(run: string): string[] {
  const chars = [...run];
  const suffixes = blockStarts(chars).map((start) => chars.slice(start).join(''));
  const shown = ONE_WORD.test(run) ? run : (suffixes.at(-1) ?? run);
  const all = [shown, run, ...suffixes].flatMap((surface) => {
    const stem = surface.replace(TRAILING_KANA, '');
    return stem !== surface && HAN.test(stem) ? [surface, stem] : [surface];
  });
  return [...new Set(all)];
}

/** Every reading claim written in `text`, in order of the patterns. */
export function proseClaims(text: string): ProseClaim[] {
  return PATTERNS.flatMap((pattern) =>
    [...text.matchAll(pattern)].flatMap(([, run = '', reading = '']) =>
      HAN.test(run) ? [{ surfaces: surfacesOf(run), reading }] : [],
    ),
  );
}

const SKIP = new Set(['readings', 'reading']);

/** Every string in a reply except the reading claims themselves. */
export function proseStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(proseStrings);
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, inner]) =>
    SKIP.has(key) ? [] : proseStrings(inner),
  );
}

/** Verified for any surface the reading fits; otherwise unverified, on the likeliest surface. */
async function checkProseClaim(lang: Verifier, claim: ProseClaim): Promise<CheckedReading> {
  const { reading } = claim;
  const checks = await Promise.all(
    claim.surfaces.map((surface) => checkReading(lang, { surface, reading })),
  );
  const fit = checks.find((check) => check.verified);
  return fit ?? { surface: claim.surfaces[0] ?? '', reading, verified: false };
}

function covered(claim: ProseClaim, known: readonly ReadingClaim[]): boolean {
  return known.some((k) => k.reading === claim.reading && claim.surfaces.includes(k.surface));
}

/**
 * The readings `raw`'s prose shows that `known` (the checked listed claims) does not cover, each
 * checked. One entry per surface and reading.
 */
export async function proseReadings(
  lang: Verifier,
  raw: unknown,
  known: readonly CheckedReading[],
): Promise<CheckedReading[]> {
  const claims = proseStrings(raw)
    .flatMap(proseClaims)
    .filter((claim) => !covered(claim, known));
  const checked = await Promise.all(claims.map((claim) => checkProseClaim(lang, claim)));
  const seen = new Set(known.map((k) => `${k.surface}\u0000${k.reading}`));
  return checked.filter((check) => {
    const key = `${check.surface}\u0000${check.reading}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Checks the listed claims, then adds the prose ones they miss (A8). */
export async function checkWithProse(
  lang: Verifier,
  listed: ReadingClaim[],
  raw: unknown,
  also: readonly CheckedReading[] = [],
): Promise<CheckedReading[]> {
  const readings = await checkReadings(lang, listed);
  return [...readings, ...(await proseReadings(lang, raw, [...also, ...readings]))];
}
