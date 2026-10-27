/**
 * Corpus matching for scanned pages: each kanji, word and grammar point a page teaches is matched
 * to KANJIDIC, JMdict and the grammar catalogue. The tutor's lists are matched as printed;
 * grammar is also found by the catalogue detectors over every line (but for the plain endings
 * of every sentence), and the new words of the lines of a page the tutor did not read (pasted
 * text, older captures). A page the tutor listed no kanji for (an exercise handout, a reading)
 * offers the kanji in its lines the learner cannot read yet, up to a level above theirs. What
 * our data does not know is kept, marked by a missing
 * `ref`, with the tutor's gloss and its reading as checked.
 */

import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { detectEntries } from '../grammar/detect.ts';
import { FUNCTION_WORDS } from '../grammar/function-words.ts';
import type { GrammarEntry, GrammarFamily } from '../grammar/types.ts';
import { hasKanji, toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { ScanItem, ScanReading } from '../scan-types.ts';
import { FUNCTION_POS, KNOWN_LEVEL } from '../selector.ts';
import type { LearnerLevel, Token, Word } from '../types.ts';
import { scanItemKey } from './scans.ts';

/** A kanji, word or grammar point as the tutor listed it from a page. */
export interface ListedItem {
  text: string;
  meaning?: string | undefined;
  /** A word's reading, after `verifyReading`. */
  reading?: ScanReading | undefined;
}

export interface ListedItems {
  kanji: ListedItem[];
  words: ListedItem[];
  grammar: ListedItem[];
}

export const NOTHING_LISTED: ListedItems = { kanji: [], words: [], grammar: [] };

const listedOf = (page: MatchPage) => page.listed ?? NOTHING_LISTED;

/** One page as matching reads it: its lines' tokens and the tutor's lists. */
export interface MatchPage {
  /** Index of the page in its lesson. */
  page: number;
  lines: readonly { tokens: readonly Token[] }[];
  /** What the tutor listed from the page; absent when the tutor did not read it. */
  listed?: ListedItems | undefined;
}

export interface MatchOptions {
  /** The learner's level: grammar the detectors find below it is left out (it counts as known). */
  level: LearnerLevel;
  /** JMdict ids of words added from the page before (older captures), kept as items. */
  wordIds?: readonly string[];
}

/** A pattern as compared: no 〜, no sense note such as (様子), no spaces. */
export function patternKey(pattern: string): string {
  return pattern
    .replace(/[〜~～]/gu, '')
    .replace(/[(（][^)）]*[)）]/gu, '')
    .replace(/\s/gu, '');
}

/** The pattern without its closing copula: そうだ and そうです both compare as そう. */
export const plainKey = (pattern: string) => patternKey(pattern).replace(/(だ|です)$/u, '');

interface GrammarRef {
  id: string;
  pattern: string;
}

const POINTS: readonly GrammarRef[] = [...GRAMMAR_CATALOGUE, ...FUNCTION_WORDS];

/**
 * The catalogue point (or particle) a printed pattern names: the same pattern first, then the
 * same pattern without its copula; among several, one the page's lines use.
 */
export function matchPattern(printed: string, used: ReadonlySet<string> = new Set()) {
  const exact = POINTS.filter((p) => patternKey(p.pattern) === patternKey(printed));
  const loose = POINTS.filter((p) => plainKey(p.pattern) === plainKey(printed));
  const found = exact.length > 0 ? exact : loose;
  return found.find((p) => used.has(p.id)) ?? found[0];
}

/** Catalogue points the detectors find in the pages, with the first page each is on. */
function detected(pages: readonly MatchPage[]): Map<string, number> {
  const found = new Map<string, number>();
  const matches = pages.flatMap((page) =>
    page.lines.flatMap((line) =>
      detectEntries(GRAMMAR_CATALOGUE, line.tokens).map((m) => [m.id, page.page] as const),
    ),
  );
  for (const [id, page] of matches) if (!found.has(id)) found.set(id, page);
  return found;
}

/** Endings nearly every sentence has (です, ます, plain forms, ね, か): never items on their own. */
const EVERYWHERE: ReadonlySet<GrammarFamily> = new Set([
  'copula',
  'politeness',
  'plain-form',
  'sentence-ending',
]);

/** A point the detectors found that is worth listing: at the learner's level, not everywhere. */
function worthListing(entry: GrammarEntry, level: LearnerLevel): boolean {
  return entry.level <= level && !EVERYWHERE.has(entry.family);
}

function tutorGrammar(page: MatchPage, used: ReadonlySet<string>): ScanItem[] {
  return listedOf(page).grammar.map((listed) => {
    const point = matchPattern(listed.text, used);
    const item: ScanItem = { kind: 'grammar', text: listed.text, page: page.page, from: 'tutor' };
    if (point) item.ref = point.id;
    else if (listed.meaning) item.meaning = listed.meaning;
    return item;
  });
}

/** Grammar: the tutor's patterns, then the points the detectors find at the learner's level. */
function grammarItems(pages: readonly MatchPage[], level: LearnerLevel): ScanItem[] {
  const found = detected(pages);
  const used = new Set(found.keys());
  const listed = pages.flatMap((page) => tutorGrammar(page, used));
  const text = [...found].flatMap(([id, page]): ScanItem[] => {
    const entry = GRAMMAR_CATALOGUE.find((e) => e.id === id);
    if (!(entry && worthListing(entry, level))) return [];
    return [{ kind: 'grammar', text: entry.pattern, ref: id, page, from: 'text' }];
  });
  return [...listed, ...text];
}

/** Kanji offered from one page's lines, at most. */
const TEXT_KANJI = 8;

/** The kanji in a page's lines the learner cannot read yet, within reach of their level. */
async function textKanji(repos: Repos, page: MatchPage, reach: Reach): Promise<ScanItem[]> {
  const surfaces = page.lines.flatMap((line) => line.tokens.map((t) => t.surface));
  const chars = [...new Set([...surfaces.join('')].filter(hasKanji))];
  const found = await repos.dictionary.kanjiMany(chars.filter((c) => !reach.known.has(c)));
  return found
    .flatMap((k) => (k && (k.jlpt ?? 0) >= reach.lowest ? [k.char] : []))
    .slice(0, TEXT_KANJI)
    .map((char) => ({ kind: 'kanji', text: char, ref: char, page: page.page, from: 'text' }));
}

interface Reach {
  /** Kanji the learner reads (a reading at level 3 or more). */
  known: ReadonlySet<string>;
  /** The hardest JLPT level offered: one above the learner's. */
  lowest: number;
}

async function reachOf(repos: Repos, level: LearnerLevel): Promise<Reach> {
  const readings = await repos.kanjiReadings.all();
  const known = new Set(readings.filter((r) => r.level >= KNOWN_LEVEL).map((r) => r.kanji));
  return { known, lowest: level - 1 };
}

async function kanjiItems(repos: Repos, page: MatchPage, reach: Reach): Promise<ScanItem[]> {
  if (listedOf(page).kanji.length === 0) return textKanji(repos, page, reach);
  const listed = listedOf(page).kanji.filter((k) => [...k.text.trim()].length === 1);
  const found = await repos.dictionary.kanjiMany(listed.map((k) => k.text.trim()));
  return listed.map((k, i) => {
    const item: ScanItem = { kind: 'kanji', text: k.text.trim(), page: page.page, from: 'tutor' };
    if (found[i]) item.ref = found[i].char;
    else if (k.meaning) item.meaning = k.meaning;
    return item;
  });
}

/** The entry written as printed, with the printed reading when one is given; common first. */
async function matchWord(repos: Repos, listed: ListedItem): Promise<Word | undefined> {
  const text = listed.text.trim();
  const words = await repos.dictionary.wordsByText(text);
  const written = words.filter((w) => w.forms.includes(text) || w.readings.includes(text));
  const reading = listed.reading && toKanaFold(listed.reading.reading);
  const read = written.find((w) => w.readings.some((r) => toKanaFold(r) === reading));
  return read ?? written[0];
}

function unmatchedWord(listed: ListedItem, page: number): ScanItem {
  const item: ScanItem = { kind: 'word', text: listed.text.trim(), page, from: 'tutor' };
  if (listed.meaning) item.meaning = listed.meaning;
  if (listed.reading) item.reading = listed.reading;
  return item;
}

async function tutorWords(repos: Repos, page: MatchPage): Promise<ScanItem[]> {
  const words = await Promise.all(listedOf(page).words.map((listed) => matchWord(repos, listed)));
  return listedOf(page).words.map((listed, i) => {
    const word = words[i];
    if (!word) return unmatchedWord(listed, page.page);
    const text = listed.text.trim();
    return { kind: 'word', text, ref: word.id, page: page.page, from: 'tutor' };
  });
}

/** Content words written with kanji the learner cannot read yet, in text order. */
function newTokens(page: MatchPage, levels: ReadonlyMap<string, number>): Token[] {
  const tokens = page.lines.flatMap((line) => line.tokens);
  return tokens.filter(
    (t) =>
      t.wordId !== undefined &&
      !FUNCTION_POS.has(t.pos) &&
      hasKanji(t.surface) &&
      (levels.get(t.wordId) ?? 0) < KNOWN_LEVEL,
  );
}

/** Words of a page the tutor did not read (pasted text): the new words in its lines. */
function textWords(page: MatchPage, levels: ReadonlyMap<string, number>): ScanItem[] {
  if (page.listed) return [];
  return newTokens(page, levels).map((token) => ({
    kind: 'word',
    text: token.base,
    ref: token.wordId ?? '',
    page: page.page,
    from: 'text',
  }));
}

async function addedWords(repos: Repos, ids: readonly string[], page: number) {
  const words = await repos.dictionary.words(ids);
  return words.flatMap((w): ScanItem[] =>
    w
      ? [{ kind: 'word', text: w.forms[0] ?? w.readings[0] ?? w.id, ref: w.id, page, from: 'text' }]
      : [],
  );
}

/** Each item once, by kind and ref (or text), kept where it was first found. */
function unique(items: readonly ScanItem[]): ScanItem[] {
  const seen = new Map<string, ScanItem>();
  for (const item of items) if (!seen.has(scanItemKey(item))) seen.set(scanItemKey(item), item);
  return [...seen.values()];
}

async function wordItems(repos: Repos, pages: readonly MatchPage[], options: MatchOptions) {
  const items = await repos.items.byKind('word');
  const levels = new Map(items.map((item) => [item.ref, item.level]));
  const listed = (await Promise.all(pages.map((page) => tutorWords(repos, page)))).flat();
  const text = pages.flatMap((page) => textWords(page, levels));
  const added = await addedWords(repos, options.wordIds ?? [], pages[0]?.page ?? 0);
  return [...listed, ...added, ...text];
}

/**
 * The items of the pages (see the module comment): kanji, then words, then grammar, each once,
 * in page order.
 */
export async function matchScanItems(
  repos: Repos,
  pages: readonly MatchPage[],
  options: MatchOptions,
): Promise<ScanItem[]> {
  const reach = await reachOf(repos, options.level);
  const kanji = (await Promise.all(pages.map((page) => kanjiItems(repos, page, reach)))).flat();
  const words = await wordItems(repos, pages, options);
  return unique([...kanji, ...words, ...grammarItems(pages, options.level)]);
}
