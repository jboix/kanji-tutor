/**
 * No-spoil post-filter (L3): an explanation shown before the learner answers must not give away
 * the reading of any target still to be answered. Whatever the prompt says, every reply passes
 * through `redactReadings`, which blanks the readings in every form a model was seen to use.
 *
 * Rules, in order:
 * 1. Furigana-style brackets after a hidden word or one of its kanji, holding only kana:
 *    待って（まって）, 待(ま)って, 待って【まって】. The bracket goes; nothing replaces it.
 * 2. A reading given with a cue after a hidden word or its kanji: "待って is read as もって",
 *    "待って: まって", "待 = ま". The reading is blanked, even when it is a wrong one.
 * 3b. Part of a hidden reading given after one of its kanji, split per kanji or into pieces:
 *    "紹 is しょう and 介 is かい", "待 ま + つ", "待 (ma)" (D57).
 * 4. Any hiragana or katakana form of a hidden reading, anywhere: まって, マッテ, and long-vowel
 *    katakana such as ショーカイ. Not inside a longer kana word the sentence shows (まつ in
 *    まつり, D89).
 * 5. Romaji forms of a hidden reading as whole words, in Hepburn, macron and long-vowel
 *    spellings, also split by hyphens or spaces: matte, ma-tte, ma tte, shoukai, shōkai,
 *    shookai, shokai, sho-kai. Common English words are left alone.
 */
import { toHiragana, toKatakana, toRomaji } from 'wanakana';

/** A target not answered yet: its surface and every reading that must stay hidden. */
export interface HiddenReading {
  surface: string;
  readings: readonly string[];
}

export interface Redaction {
  text: string;
  /** True when anything was removed. */
  leaked: boolean;
}

/** What replaces a blanked reading. */
export const HIDDEN_MARK = '[…]';

const KANA = '\\p{Script=Hiragana}\\p{Script=Katakana}ー・';
const OPEN = '(（[［【〔「『';
const CLOSE = ')）]］】〕」』';
const HAN = /\p{Script=Han}/u;
/** One romaji word, or several split by hyphens or spaces: ma, ma-tte, sho kai. */
const LATIN = "[A-Za-zāīūēō']+(?:[-‐ ][A-Za-zāīūēō']+)*";
/** Romaji that are also everyday English words: blanked only by rules 1 and 2. */
const ENGLISH = new Set(
  'man men son sun ten ban can kin tan hen ton bun gun nun pun sake same tame mine ate hate kite mare are ore one bin pin den fun gin sin nan kara'.split(
    ' ',
  ),
);

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The hidden words and their kanji, as regex alternatives, longest first. */
function anchors(hidden: readonly HiddenReading[]): string {
  const words = hidden.map((h) => h.surface.trim()).filter(Boolean);
  const kanji = words.flatMap((word) => [...word].filter((c) => HAN.test(c)));
  const all = [...new Set([...words, ...kanji])].sort((a, b) => b.length - a.length);
  return all.map(escapeRe).join('|');
}

/** A vowel kana that only lengthens the one before it: ou, uu, ei, ii, aa, ee, oo. */
const LENGTHENS: Readonly<Record<string, string>> = {
  ウ: 'ou',
  イ: 'ei',
  ア: 'a',
  エ: 'e',
  オ: 'o',
};

/** Katakana with each lengthening vowel written ー: ショウカイ → ショーカイ. */
export function longVowelForm(katakana: string): string {
  const chars = [...katakana];
  return chars
    .map((char, i) => {
      const last = toRomaji(chars[i - 1] ?? '').slice(-1);
      return last !== '' && LENGTHENS[char]?.includes(last) ? 'ー' : char;
    })
    .join('');
}

/** Hiragana and katakana forms of one reading, with ー long-vowel spellings. */
function formsOf(reading: string): string[] {
  const kana = reading.trim().replaceAll('.', '');
  const hira = toHiragana(kana, { passRomaji: true });
  const kata = toKatakana(hira, { passRomaji: true });
  return [kana, hira, kata, longVowelForm(kata)];
}

/** Hiragana and katakana forms of every hidden reading. */
function kanaForms(hidden: readonly HiddenReading[]): string[] {
  const forms = hidden.flatMap((h) => h.readings.flatMap(formsOf));
  return [...new Set(forms.filter((form) => form !== ''))].sort((a, b) => b.length - a.length);
}

/** Long-vowel spellings of one Hepburn romaji: ō and oo for ou and oo, ū and uu, and so on. */
function romajiSpellings(romaji: string): string[] {
  const macron = romaji
    .replace(/ou|oo/g, 'ō')
    .replace(/uu/g, 'ū')
    .replace(/aa/g, 'ā')
    .replace(/ii/g, 'ī')
    .replace(/ee/g, 'ē');
  const short = macron.replace(/ō/g, 'o').replace(/ū/g, 'u').replace(/ā/g, 'a');
  return [romaji, macron, romaji.replace(/ou/g, 'oo'), short.length >= 4 ? short : romaji];
}

/** Romaji forms of every hidden reading, in lower case. */
export function romajiForms(hidden: readonly HiddenReading[]): string[] {
  const forms = kanaForms(hidden).flatMap((kana) => {
    const romaji = toRomaji(kana).toLowerCase();
    return /^[a-z']+$/.test(romaji) ? romajiSpellings(romaji) : [];
  });
  return [...new Set(forms)].sort((a, b) => b.length - a.length);
}

interface Pass {
  text: string;
  leaked: boolean;
}

function apply(
  pass: Pass,
  pattern: RegExp,
  replace: (match: string, ...groups: string[]) => string,
) {
  const text = pass.text.replace(pattern, replace);
  return { text, leaked: pass.leaked || text !== pass.text };
}

/** Rule 1: kana-only brackets right after a hidden word or kanji, or romaji of a hidden reading. */
function dropFurigana(pass: Pass, anchor: string, hidden: Hidden): Pass {
  const bracket = `\\s*[${escapeRe(OPEN)}]\\s*([${KANA}\\s]+|${LATIN})\\s*[${escapeRe(CLOSE)}]`;
  const drop = (match: string, word = '', inside = '') =>
    isKanaText(inside) || hidesPart(inside, hidden) ? word : match;
  return apply(pass, new RegExp(`(${anchor})${bracket}`, 'gu'), drop);
}

const SPOKEN_CUE =
  '(\\s*,?\\s+(?:is\\s+|are\\s+)?(?:read|pronounced|reads|spelled|sounds)(?:\\s+(?:as|like))?\\s*[:：]?\\s*)';
const MARK_CUE = '(\\s*[:：=＝→]\\s*)';
const QUOTE_OPEN = `["“'「]?`;
const QUOTE_CLOSE = `["”'」]?`;

/**
 * Rule 2: "X is read as Y" (kana or romaji) and "X: Y", "X = Y" (kana only, since "待って:
 * waiting" is a gloss) after a hidden word or kanji.
 */
function blankCued(pass: Pass, anchor: string): Pass {
  const spoken = `(${anchor})${SPOKEN_CUE}${QUOTE_OPEN}(?:[${KANA}]+|[A-Za-zāīūēō']+)${QUOTE_CLOSE}`;
  const marked = `(${anchor})${MARK_CUE}${QUOTE_OPEN}[${KANA}]+${QUOTE_CLOSE}`;
  const blank = (_match: string, word = '', cue = '') => `${word}${cue}${HIDDEN_MARK}`;
  const once = apply(pass, new RegExp(spoken, 'gu'), blank);
  return apply(once, new RegExp(marked, 'gu'), blank);
}

const PIECES = `[${KANA}]+(?:\\s*[+＋/]\\s*[${KANA}]+)*|${LATIN}`;
const PART_CUE =
  '(\\s*[:：=＝→]\\s*|\\s*,?\\s+(?:(?:is|are|est|es|se lit|se lee|se prononce|se pronuncia|reads?)\\s+)?)';

/** Pieces of a reading, joined: "ま + つ" → まつ, "ma-tte" → matte. */
function joined(text: string): string {
  return text.replace(/[\s+＋/'‐-]/g, '').toLowerCase();
}

/** Macron romaji spelled out, for the kana check: shō → shou. */
const unMacron = (text: string) =>
  text.replace(/ō/g, 'ou').replace(/ū/g, 'uu').replace(/ā/g, 'aa').replace(/ī/g, 'ii');

function isKanaText(text: string): boolean {
  return new RegExp(`^[${KANA}\\s+＋/]+$`, 'u').test(text);
}

/**
 * True when `text` (kana pieces, or romaji of whole morae) is part of a hidden reading: しょう of
 * しょうかい, "ma" of matte. Romaji needs two letters or more, so "a" or "to" in prose stays.
 */
function hidesPart(text: string, hidden: Hidden): boolean {
  const part = joined(text);
  if (part === '') return false;
  if (isKanaText(text)) return hidden.hira.some((form) => form.includes(toHiragana(part)));
  const kana = toHiragana(unMacron(part));
  const moraic = part.length >= 2 && /^[\p{Script=Hiragana}ー]+$/u.test(kana);
  return moraic && hidden.romaji.some((form) => form.includes(part));
}

/** Rule 3b: part of a hidden reading right after a hidden kanji ("紹 is しょう", "待 ま + つ"). */
function blankParts(pass: Pass, anchor: string, hidden: Hidden): Pass {
  const pattern = new RegExp(`(${anchor})${PART_CUE}${QUOTE_OPEN}(${PIECES})${QUOTE_CLOSE}`, 'gu');
  const blank = (match: string, word = '', cue = '', part = '') =>
    hidesPart(part, hidden) ? `${word}${cue}${HIDDEN_MARK}` : match;
  return apply(pass, pattern, blank);
}

const KANA_CHAR = new RegExp(`[${KANA}]`, 'u');
const isKana = (char: string | undefined) => char !== undefined && KANA_CHAR.test(char);

/** How many kana before `at` in `a` and before `from` in `b` agree, walking back. */
function sameBefore(a: string, at: number, b: string, from: number): number {
  let n = 0;
  while (isKana(a[at - 1 - n]) && a[at - 1 - n] === b[from - 1 - n]) n++;
  return n;
}

/** How many kana from `at` in `a` and from `from` in `b` agree, walking on. */
function sameAfter(a: string, at: number, b: string, from: number): number {
  let n = 0;
  while (isKana(a[at + n]) && a[at + n] === b[from + n]) n++;
  return n;
}

/**
 * True when the form at `at` in `text` is part of a longer kana word the learner already sees
 * (D89): まつ inside まつり, when the sentence shows まつり. It gives nothing away.
 */
function inVisibleWord(text: string, at: number, form: string, visible: string): boolean {
  for (let from = visible.indexOf(form); from >= 0; from = visible.indexOf(form, from + 1)) {
    const end = from + form.length;
    const longer =
      sameBefore(text, at, visible, from) + sameAfter(text, at + form.length, visible, end);
    if (longer > 0) return true;
  }
  return false;
}

/**
 * Rule 4: the kana forms, anywhere, except inside a longer kana word that `visible` shows. A
 * one-kana reading only when it stands alone.
 */
function blankKana(pass: Pass, forms: readonly string[], visible: string): Pass {
  return forms.reduce((current, form) => {
    const alone =
      form.length === 1 ? `(?<![${KANA}])${escapeRe(form)}(?![${KANA}])` : escapeRe(form);
    // No groups in the pattern, so the callback gets the match, its offset and the text.
    const text = current.text.replace(
      new RegExp(alone, 'gu'),
      (match, at: number, whole: string) =>
        inVisibleWord(whole, at, match, visible) ? match : HIDDEN_MARK,
    );
    return { text, leaked: current.leaked || text !== current.text };
  }, pass);
}

/** A romaji form, letters optionally split by a hyphen or a space from five letters up. */
function romajiPattern(form: string): string {
  const letters = [...form].map(escapeRe);
  return form.length >= 5 ? letters.join('[-‐ ]?') : letters.join('');
}

/** Rule 5: romaji forms as whole words, three letters or more, not common English words. */
function blankRomaji(pass: Pass, forms: readonly string[]): Pass {
  const word = (form: string) =>
    new RegExp(`(?<![\\p{L}-])${romajiPattern(form)}(?![\\p{L}-])`, 'giu');
  return forms
    .filter((form) => form.length >= 3 && !ENGLISH.has(form))
    .reduce((current, form) => apply(current, word(form), () => HIDDEN_MARK), pass);
}

/** Spaces left doubled or before punctuation by a removed bracket. */
function tidy(text: string): string {
  return text.replace(/ {2,}/g, ' ').replace(/ ([,.;:!?])/g, '$1');
}

/** The hidden readings' forms every rule matches against. */
interface Hidden {
  kana: string[];
  hira: string[];
  romaji: string[];
}

/**
 * Removes every hidden reading from `text` (rules in the module comment). `visible` is what the
 * learner already sees (the sentence, or a blank's masked sentence): a kana word copied from it
 * stays whole.
 */
export function redactReadings(
  text: string,
  hidden: readonly HiddenReading[],
  visible = '',
): Redaction {
  const anchor = anchors(hidden);
  if (anchor === '') return { text, leaked: false };
  const kana = kanaForms(hidden);
  const forms: Hidden = { kana, hira: kana.map((k) => toHiragana(k)), romaji: romajiForms(hidden) };
  let pass: Pass = { text, leaked: false };
  pass = dropFurigana(pass, anchor, forms);
  pass = blankCued(pass, anchor);
  pass = blankParts(pass, anchor, forms);
  pass = blankKana(pass, kana, visible);
  pass = blankRomaji(pass, forms.romaji);
  return { text: pass.leaked ? tidy(pass.text) : text, leaked: pass.leaked };
}

/**
 * The written forms of a blank's hidden answer that a reply may not hold (A19): the answer, and
 * for one with kanji its part up to the last kanji (寝る → 寝, 食べた → 食). A one-kana answer
 * (に) is left to the readings, since it is in nearly every sentence.
 */
function answerForms(answer: string): string[] {
  const text = answer.trim();
  const last = [...text].findLastIndex((c) => HAN.test(c));
  const stem = last >= 0 ? [...text].slice(0, last + 1).join('') : '';
  return [text, stem].filter((form) => form.length >= (HAN.test(form) ? 1 : 2));
}

/** Blanks every written form of a blank's hidden answer in `text` (A19, with D57's filter). */
export function redactAnswer(text: string, answer: string | undefined): Redaction {
  const forms = answer ? answerForms(answer) : [];
  if (forms.length === 0) return { text, leaked: false };
  const pattern = new RegExp(
    forms
      .sort((a, b) => b.length - a.length)
      .map(escapeRe)
      .join('|'),
    'gu',
  );
  const out = text.replace(pattern, HIDDEN_MARK);
  return { text: out, leaked: out !== text };
}

/**
 * True when a reading claim would give a hidden reading away: it is one of the hidden readings,
 * or its word shares a kanji with a hidden word (L2: no example words with the same kanji).
 */
export function spoilsReading(
  claim: { surface: string; reading: string },
  hidden: readonly HiddenReading[],
): boolean {
  const forms = new Set(kanaForms(hidden).map((form) => toHiragana(form)));
  if (forms.has(toHiragana(claim.reading.trim()))) return true;
  const kanji = new Set(hidden.flatMap((h) => [...h.surface].filter((c) => HAN.test(c))));
  return [...claim.surface].some((c) => kanji.has(c));
}
