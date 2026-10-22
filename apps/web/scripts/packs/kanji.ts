/**
 * KANJIDIC2 (English) + KRADFILE → `Kanji`, with visual components and a phonetic heuristic.
 *
 * Components: KRADFILE lists the radicals (elements) of each kanji, not its larger parts, so 待 is
 * 彳 土 寸. We rebuild the larger parts greedily: any Jōyō kanji whose own KRADFILE elements are a
 * strict subset of the remaining elements is taken as a part (largest first), and the elements
 * left over are kept as they are: 待 → 彳 寺, 晴 → 日 青.
 *
 * Phonetic: a component P is the phonetic of K when P is a kanji part of K, K and P share an
 * on'yomi (ignoring voicing: ジ = シ), and at least three kanji (P included) share P and that
 * on'yomi. 青 is the phonetic of 清 晴 精 静; 寺 of 時 持 侍 詩.
 */
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Kanji } from '../../src/domain/types.ts';

interface KdReading {
  type: string;
  value: string;
}

export interface KdCharacter {
  literal: string;
  misc: {
    grade: number | null;
    strokeCounts: number[];
    frequency: number | null;
    jlptLevel: number | null;
  };
  readingMeaning: {
    groups: { readings: KdReading[]; meanings: { lang: string; value: string }[] }[];
  } | null;
}

export interface KanjiDic {
  dictDate: string;
  characters: KdCharacter[];
}

export interface KradFile {
  version: string;
  kanji: Record<string, string[]>;
}

const MAX_MEANINGS = 6;
/** Kanji characters; the iteration mark 々 and 〆 are not kanji of their own. */
const KANJI = /(?![々〆〇])\p{Script=Han}/gu;
const JOYO_GRADES = new Set([1, 2, 3, 4, 5, 6, 8]);

export function isJoyo(char: KdCharacter): boolean {
  return char.misc.grade !== null && JOYO_GRADES.has(char.misc.grade);
}

function readings(char: KdCharacter, type: string): string[] {
  const groups = char.readingMeaning?.groups ?? [];
  const values = groups.flatMap((g) =>
    g.readings.filter((r) => r.type === type).map((r) => r.value),
  );
  return [...new Set(values.map((v) => v.replace(/^-|-$/g, '')))].filter((v) => v.length > 0);
}

function meanings(char: KdCharacter): string[] {
  const groups = char.readingMeaning?.groups ?? [];
  return groups
    .flatMap((g) => g.meanings.filter((m) => m.lang === 'en').map((m) => m.value))
    .slice(0, MAX_MEANINGS);
}

/**
 * Kanji levels from the vocabulary lists: a kanji takes the easiest JLPT level of any
 * listed word usually written with it (悪 is N5 through 悪い, 茶 through お茶). KANJIDIC2's
 * pre-2010 level is only the fallback for kanji in no listed word.
 */
export function vocabularyKanjiLevels(
  words: readonly { form: string | undefined; level: JlptLevel | undefined }[],
): Map<string, JlptLevel> {
  const out = new Map<string, JlptLevel>();
  for (const { form, level } of words) {
    if (!form || !level) continue;
    for (const char of form.match(KANJI) ?? []) {
      if ((out.get(char) ?? 0) < level) out.set(char, level);
    }
  }
  return out;
}

/**
 * KANJIDIC2 still carries the pre-2010 four-level JLPT. Old 4 → N5, 3 → N4, 1 → N1; old 2 covers
 * both N3 and N2, so it becomes N3 when the kanji is written in a word on the N5–N3 vocabulary
 * lists, else N2.
 */
export function kanjiJlpt(oldLevel: number | null, inN3Words: boolean): Kanji['jlpt'] {
  if (oldLevel === 4) return 5;
  if (oldLevel === 3) return 4;
  if (oldLevel === 2) return inN3Words ? 3 : 2;
  if (oldLevel === 1) return 1;
  return undefined;
}

/**
 * The easier of `vocabLevel` (from {@link vocabularyKanjiLevels}) and KANJIDIC2's old level (T8):
 * a classic N5 kanji such as 円 stays N5 when its listed words put it at N3.
 */
export function toKanji(char: KdCharacter, inN3Words: boolean, vocabLevel?: JlptLevel): Kanji {
  const out: Kanji = {
    char: char.literal,
    meanings: meanings(char),
    on: readings(char, 'ja_on'),
    kun: readings(char, 'ja_kun'),
    components: [],
  };
  const strokes = char.misc.strokeCounts[0];
  if (strokes) out.strokes = strokes;
  if (char.misc.grade !== null) out.grade = char.misc.grade;
  const old = kanjiJlpt(char.misc.jlptLevel, inN3Words);
  const jlpt = vocabLevel && old ? (Math.max(vocabLevel, old) as typeof old) : (vocabLevel ?? old);
  if (jlpt) out.jlpt = jlpt;
  if (char.misc.frequency !== null) out.freq = char.misc.frequency;
  return out;
}

interface Part {
  char: string;
  elements: Set<string>;
  strokes: number;
  /** On'yomi with voicing folded, to prefer parts that sound like the kanji. */
  ons: Set<string>;
}

function isSubset(small: Set<string>, big: Set<string>): boolean {
  for (const item of small) if (!big.has(item)) return false;
  return true;
}

/** Candidate parts: Jōyō kanji made of two or more KRADFILE elements, largest first. */
export function partCandidates(
  krad: Record<string, string[]>,
  joyo: Map<string, { strokes: number; on: string[] }>,
): Part[] {
  const parts: Part[] = [];
  for (const [char, { strokes, on }] of joyo) {
    const elements = new Set(krad[char] ?? []);
    if (elements.size >= 2) parts.push({ char, elements, strokes, ons: new Set(on.map(unvoice)) });
  }
  // Among parts with the same elements the simplest wins: 寺 (6 strokes) over 封 (9).
  return parts.sort(
    (a, b) =>
      b.elements.size - a.elements.size || a.strokes - b.strokes || a.char.localeCompare(b.char),
  );
}

export interface ComponentQuery {
  char: string;
  strokes: number;
  on: string[];
}

/**
 * Visual components of a kanji: leftover KRADFILE elements first, then rebuilt kanji parts.
 * Parts that share an on'yomi with the kanji are tried first (詩 → 言 寺, not 土 討).
 */
export function componentsOf(
  kanji: ComponentQuery,
  krad: Record<string, string[]>,
  parts: Part[],
): string[] {
  const elements = krad[kanji.char] ?? [];
  const uncovered = new Set(elements);
  const ons = new Set(kanji.on.map(unvoice));
  const sounds = (part: Part) => [...part.ons].some((on) => ons.has(on));
  const ordered = [...parts.filter(sounds), ...parts.filter((part) => !sounds(part))];
  const picked: string[] = [];
  for (const part of ordered) {
    if (part.char === kanji.char || part.elements.size >= elements.length) continue;
    if (part.strokes >= kanji.strokes || !isSubset(part.elements, uncovered)) continue;
    picked.push(part.char);
    for (const element of part.elements) uncovered.delete(element);
  }
  const leftovers = elements.filter((e) => uncovered.has(e) && e !== kanji.char);
  return [...leftovers, ...picked];
}

/** Folds voiced and half-voiced kana to their plain form: ジ → シ, パ → ハ. */
export function unvoice(kana: string): string {
  return kana
    .normalize('NFD')
    .replace(/[\u3099\u309a]/g, '')
    .normalize('NFC');
}

function onSet(kanji: Kanji): Set<string> {
  return new Set(kanji.on.map(unvoice));
}

/** Sets `phonetic` on every kanji whose kanji part heads a sound family (see file comment). */
export function assignPhonetics(all: Kanji[], minFamily = 3): void {
  const byChar = new Map(all.map((k) => [k.char, k]));
  const family = new Map<string, Kanji[]>();
  for (const kanji of all) {
    const ons = onSet(kanji);
    for (const component of kanji.components) {
      const part = byChar.get(component);
      if (!part) continue;
      for (const on of onSet(part)) {
        if (!ons.has(on)) continue;
        const key = `${component}\t${on}`;
        family.set(key, [...(family.get(key) ?? []), kanji]);
      }
    }
  }
  const best = new Map<string, { part: string; size: number }>();
  for (const [key, members] of [...family].sort(([a], [b]) => a.localeCompare(b))) {
    const part = key.split('\t')[0] as string;
    const size = members.length + 1;
    if (size < minFamily) continue;
    for (const member of members) {
      const current = best.get(member.char);
      if (!current || size > current.size) best.set(member.char, { part, size });
    }
  }
  for (const kanji of all) {
    const choice = best.get(kanji.char);
    if (choice) kanji.phonetic = choice.part;
  }
}
