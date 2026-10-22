/**
 * Aligns a word's kana reading to the kanji of its written form using KANJIDIC on and kun
 * readings, so each kanji–reading pair can be credited to the words that prove it (K3).
 */
import { hasKanji, shortenVowels, toKanaFold, voicedVariants } from './kana.ts';
import type { Kanji } from './types.ts';

/** One kanji of a word form aligned to the part of the reading it carries. */
export interface ReadingSegment {
  text: string;
  /** Hiragana reading of this segment. */
  reading: string;
  /** For a kanji segment, the dictionary reading it matched ("セイ", "い.きる"), if any. */
  kanjiReading?: string;
  /** For a kanji segment, the kanji whose reading it is (the previous kanji for 々). */
  kanji?: string;
}

/** A kana spelling a kanji can take in a word, and the dictionary reading it comes from. */
interface Candidate {
  kana: string;
  source: string;
}

interface AlignContext {
  chars: readonly string[];
  /** Hiragana spelling of each kana character of the form (ー spelled as its vowel). */
  folded: readonly string[];
  reading: string;
  kanji: ReadonlyMap<string, Kanji>;
}

const GEMINATING = /[つちくき]$/u;

/** Spellings of one kun reading: the stem, then the stem with part of its okurigana (受け). */
function kunSpellings(kun: string): Candidate[] {
  const [stem = '', okurigana = ''] = kun.replaceAll('-', '').split('.');
  const spellings: Candidate[] = [];
  for (let n = 0; n <= okurigana.length; n++) {
    spellings.push({ kana: toKanaFold(stem + okurigana.slice(0, n)), source: kun });
  }
  return spellings.filter((c) => c.kana !== '');
}

/** Dictionary spellings of a kanji, longest first. */
function baseCandidates(entry: Kanji): Candidate[] {
  const on = entry.on.map((source) => ({ kana: toKanaFold(source), source }));
  const kun = entry.kun.flatMap(kunSpellings);
  return [...on, ...kun].sort((a, b) => b.kana.length - a.kana.length);
}

/** Sound changes inside a word: rendaku (ひと → びと), っ (がく → がっ), short vowels. */
function soundChanges(candidate: Candidate, inside: boolean): Candidate[] {
  const { kana, source } = candidate;
  const changed = inside ? voicedVariants(kana) : [];
  if (GEMINATING.test(kana)) changed.push(`${kana.slice(0, -1)}っ`);
  const short = shortenVowels(kana);
  if (short !== kana) changed.push(short);
  return changed.map((variant) => ({ kana: variant, source }));
}

/** Every spelling to try for the kanji at a position: dictionary forms first, then changes. */
function candidatesFor(entry: Kanji | undefined, inside: boolean): Candidate[] {
  if (!entry) return [];
  const base = baseCandidates(entry);
  return [...base, ...base.flatMap((c) => soundChanges(c, inside))];
}

function alignFrom(ctx: AlignContext, i: number, j: number): ReadingSegment[] | undefined {
  const char = ctx.chars[i];
  if (char === undefined) return j === ctx.reading.length ? [] : undefined;
  return hasKanji(char) ? alignKanji(ctx, i, j, char) : alignKana(ctx, i, j, char);
}

function alignKana(
  ctx: AlignContext,
  i: number,
  j: number,
  char: string,
): ReadingSegment[] | undefined {
  const kana = ctx.folded[i] ?? '';
  if (kana === '' || !ctx.reading.startsWith(kana, j)) return undefined;
  const rest = alignFrom(ctx, i + 1, j + kana.length);
  return rest && [{ text: char, reading: kana }, ...rest];
}

function alignKanji(
  ctx: AlignContext,
  i: number,
  j: number,
  char: string,
): ReadingSegment[] | undefined {
  const kanji = char === '々' ? (ctx.chars[i - 1] ?? char) : char;
  for (const { kana, source } of candidatesFor(ctx.kanji.get(kanji), i > 0)) {
    if (!ctx.reading.startsWith(kana, j)) continue;
    const rest = alignFrom(ctx, i + 1, j + kana.length);
    if (rest) return [{ text: char, reading: kana, kanjiReading: source, kanji }, ...rest];
  }
  return undefined;
}

/** Joins neighbouring kana segments: [き, る] → [きる]. */
function mergeKana(segments: readonly ReadingSegment[]): ReadingSegment[] {
  const merged: ReadingSegment[] = [];
  for (const segment of segments) {
    const last = merged.at(-1);
    if (last && !last.kanji && !segment.kanji) {
      merged[merged.length - 1] = {
        text: last.text + segment.text,
        reading: last.reading + segment.reading,
      };
    } else merged.push(segment);
  }
  return merged;
}

function contextOf(form: string, reading: string, kanji: ReadonlyMap<string, Kanji>) {
  const chars = [...form];
  const folded = chars.map((c, i) => toKanaFold((chars[i - 1] ?? '') + c).slice(-1));
  return { chars, folded, reading: toKanaFold(reading), kanji };
}

/**
 * Aligns a word's kana reading to its written form, e.g. 学生/がくせい →
 * [学:がく(ガク), 生:せい(セイ)], handling okurigana (生きる → 生:い + きる), rendaku
 * (人々/ひとびと), っ (学校/がっこう → 学:がっ), and shortened long vowels. When no
 * combination of dictionary readings fits (今日/きょう), returns one unaligned segment.
 */
export function alignReading(
  form: string,
  reading: string,
  kanji: ReadonlyMap<string, Kanji>,
): ReadingSegment[] {
  const ctx = contextOf(form, reading, kanji);
  const aligned = alignFrom(ctx, 0, 0);
  return aligned ? mergeKana(aligned) : [{ text: form, reading: ctx.reading }];
}

/** Part of a written form with the furigana over it; kana parts have none. */
export interface RubyPart {
  text: string;
  /** Hiragana over this part: one kanji, or the kanji of a word that does not align. */
  reading?: string;
}

/**
 * The first kanji takes whatever the rest leaves, when every other kanji aligns with a
 * dictionary reading: 日本人/にほんじん → 日:に (no KANJIDIC reading is に), 一人/ひとり → 一:ひと.
 * The shortest reading that works is taken first.
 */
function alignAfterFirst(ctx: AlignContext): ReadingSegment[] | undefined {
  const [first, ...rest] = ctx.chars;
  if (first === undefined || !hasKanji(first) || !rest.some(hasKanji)) return undefined;
  for (let j = 1; j < ctx.reading.length; j++) {
    const tail = alignFrom(ctx, 1, j);
    if (tail) return [{ text: first, reading: ctx.reading.slice(0, j), kanji: first }, ...tail];
  }
  return undefined;
}

function sharedEnds(chars: readonly string[], folded: readonly string[], reading: string) {
  let pre = 0;
  while (pre < chars.length && !hasKanji(chars[pre] ?? '') && reading[pre] === folded[pre]) pre++;
  let post = 0;
  const fits = (n: number) => reading[reading.length - 1 - n] === folded[chars.length - 1 - n];
  while (post < chars.length - pre && !hasKanji(chars[chars.length - 1 - post] ?? '') && fits(post))
    post++;
  return { pre, post };
}

/** The whole word under one reading, kana it shares with the reading at either end left out. */
function wholeWord(ctx: AlignContext): RubyPart[] {
  const { chars, folded, reading } = ctx;
  const { pre, post } = sharedEnds(chars, folded, reading);
  const parts: RubyPart[] = [
    { text: chars.slice(0, pre).join('') },
    {
      text: chars.slice(pre, chars.length - post).join(''),
      reading: reading.slice(pre, reading.length - post),
    },
    { text: chars.slice(chars.length - post).join('') },
  ];
  return parts.filter((part) => part.text !== '');
}

/**
 * Furigana for a word heading (R11): one reading over each kanji where the reading aligns with
 * KANJIDIC (学生 → 学 がく, 生 せい; 待って → 待 ま + って), else one reading over the word's
 * kanji (大人 おとな). A form without kanji has no furigana.
 */
export function rubyParts(
  form: string,
  reading: string,
  kanji: ReadonlyMap<string, Kanji>,
): RubyPart[] {
  if (!hasKanji(form) || reading === '') return [{ text: form }];
  const ctx = contextOf(form, reading, kanji);
  const aligned = alignFrom(ctx, 0, 0) ?? alignAfterFirst(ctx);
  if (!aligned) return wholeWord(ctx);
  return mergeKana(aligned).map((s) =>
    hasKanji(s.text) ? { text: s.text, reading: s.reading } : { text: s.text },
  );
}
