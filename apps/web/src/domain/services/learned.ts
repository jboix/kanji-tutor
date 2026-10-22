/**
 * What the learner has learned (P3): kanji, words and grammar grouped by JLPT level (N5, N4,
 * N3, other), each with its state and the level's coverage. Lists come from the dictionary's
 * JLPT indexes, so 3,000 kanji and 23,000 words are never all loaded.
 */
import { hasKanji } from '../kana.ts';
import type { DictionaryRepo, Repos } from '../repos.ts';
import type { GrammarPoint, Kanji, KnowledgeLevel, Word } from '../types.ts';
import { wordsOnList } from './import-known.ts';
import { kanjiOf } from './kanji-readings.ts';

/** Not started (level 0 or untracked), learning (1–2) or known (3–4). */
export type LearnedState = 'not-started' | 'learning' | 'known';
export type LearnedLevel = 5 | 4 | 3 | 'other';
export type LearnedKind = 'kanji' | 'words' | 'grammar';

export interface LearnedEntry {
  /** Kanji char, word id or grammar id. */
  key: string;
  /** The kanji, the word's first written form, or the grammar pattern. */
  text: string;
  reading?: string;
  meaning?: string;
  state: LearnedState;
}

export interface LearnedGroup {
  level: LearnedLevel;
  /** Entries in the group: the whole JLPT list, or the tracked ones for "other". */
  total: number;
  known: number;
  learning: number;
  /** Learning first, then known, then not started. */
  entries: LearnedEntry[];
}

const LIST_LEVELS = [5, 4, 3] as const;
export type ListLevel = (typeof LIST_LEVELS)[number];

/** The state shown for a knowledge level; undefined (untracked) is not started. */
export function stateOf(level: KnowledgeLevel | undefined): LearnedState {
  if (level === undefined || level === 0) return 'not-started';
  return level >= 3 ? 'known' : 'learning';
}

const RANK: Record<LearnedState, number> = { learning: 0, known: 1, 'not-started': 2 };

function group(level: LearnedLevel, entries: LearnedEntry[]): LearnedGroup {
  const count = (state: LearnedState) => entries.filter((e) => e.state === state).length;
  const sorted = entries
    .map((entry, order) => ({ entry, order }))
    .sort((a, b) => RANK[a.entry.state] - RANK[b.entry.state] || a.order - b.order)
    .map(({ entry }) => entry);
  return {
    level,
    total: entries.length,
    known: count('known'),
    learning: count('learning'),
    entries: sorted,
  };
}

function wordEntry(word: Word, level: KnowledgeLevel | undefined): LearnedEntry {
  const entry: LearnedEntry = { key: word.id, text: word.forms[0] ?? '', state: stateOf(level) };
  if (word.readings[0]) entry.reading = word.readings[0];
  if (word.glosses[0]) entry.meaning = word.glosses[0];
  return entry;
}

const commonFirst = (a: Word, b: Word) => Number(b.common) - Number(a.common);

export async function wordList(dictionary: DictionaryRepo, level: ListLevel): Promise<Word[]> {
  const words = await wordsOnList(dictionary, level);
  return words.filter((word) => word.forms.some(hasKanji)).sort(commonFirst);
}

/** Words with kanji on the N5, N4 and N3 lists, then other tracked words (P3). */
export async function learnedWords(repos: Repos): Promise<LearnedGroup[]> {
  const items = await repos.items.byKind('word');
  const levels = new Map(items.map((item) => [item.ref, item.level]));
  const listed = new Set<string>();
  const groups: LearnedGroup[] = [];
  for (const level of LIST_LEVELS) {
    const words = await wordList(repos.dictionary, level);
    for (const word of words) listed.add(word.id);
    groups.push(
      group(
        level,
        words.map((word) => wordEntry(word, levels.get(word.id))),
      ),
    );
  }
  const others = items.filter((item) => !listed.has(item.ref));
  const words = await repos.dictionary.words(others.map((item) => item.ref));
  const entries = words.flatMap((word) => (word ? [wordEntry(word, levels.get(word.id))] : []));
  return [...groups, group('other', entries)];
}

/** A kanji's level: the best level among its readings (K3). */
async function kanjiLevels(repos: Repos): Promise<Map<string, KnowledgeLevel>> {
  const levels = new Map<string, KnowledgeLevel>();
  for (const row of await repos.kanjiReadings.all()) {
    levels.set(row.kanji, Math.max(levels.get(row.kanji) ?? 0, row.level) as KnowledgeLevel);
  }
  return levels;
}

/** Without a kanji JLPT index: the kanji of that level's words that carry the level. */
async function kanjiFromWords(dictionary: DictionaryRepo, level: ListLevel): Promise<Kanji[]> {
  const chars = [...new Set((await wordList(dictionary, level)).flatMap(kanjiOf))];
  const kanji = await dictionary.kanjiMany(chars);
  return kanji.flatMap((entry) => (entry?.jlpt === level ? [entry] : []));
}

export async function kanjiList(dictionary: DictionaryRepo, level: ListLevel): Promise<Kanji[]> {
  const kanji = dictionary.kanjiByJlpt
    ? await dictionary.kanjiByJlpt(level)
    : await kanjiFromWords(dictionary, level);
  return [...kanji].sort((a, b) => (a.freq ?? 9999) - (b.freq ?? 9999));
}

function kanjiEntry(kanji: Kanji, level: KnowledgeLevel | undefined): LearnedEntry {
  const entry: LearnedEntry = { key: kanji.char, text: kanji.char, state: stateOf(level) };
  if (kanji.meanings[0]) entry.meaning = kanji.meanings.slice(0, 2).join(', ');
  return entry;
}

/** Kanji of the N5, N4 and N3 lists, then other kanji with a known or learning reading (P3). */
export async function learnedKanji(repos: Repos): Promise<LearnedGroup[]> {
  const levels = await kanjiLevels(repos);
  const listed = new Set<string>();
  const groups: LearnedGroup[] = [];
  for (const level of LIST_LEVELS) {
    const kanji = await kanjiList(repos.dictionary, level);
    for (const entry of kanji) listed.add(entry.char);
    groups.push(
      group(
        level,
        kanji.map((entry) => kanjiEntry(entry, levels.get(entry.char))),
      ),
    );
  }
  const others = [...levels.keys()].filter((char) => !listed.has(char));
  const kanji = await repos.dictionary.kanjiMany(others);
  const entries = kanji.flatMap((k) => (k ? [kanjiEntry(k, levels.get(k.char))] : []));
  return [...groups, group('other', entries)];
}

function grammarEntry(point: GrammarPoint, level: KnowledgeLevel | undefined): LearnedEntry {
  return { key: point.id, text: point.pattern, meaning: point.meaning, state: stateOf(level) };
}

/** Grammar points in the repo by their level; points without one are "other" (P3). */
export async function learnedGrammar(repos: Repos): Promise<LearnedGroup[]> {
  const items = await repos.items.byKind('grammar');
  const levels = new Map(items.map((item) => [item.ref, item.level]));
  const points = await repos.grammar.all();
  return ([...LIST_LEVELS, 'other'] as const).map((level) =>
    group(
      level,
      points
        .filter((point) => (point.level ?? 'other') === level)
        .map((point) => grammarEntry(point, levels.get(point.id))),
    ),
  );
}

/** The groups of one kind (P3). */
export function learnedGroups(repos: Repos, kind: LearnedKind): Promise<LearnedGroup[]> {
  if (kind === 'kanji') return learnedKanji(repos);
  return kind === 'words' ? learnedWords(repos) : learnedGrammar(repos);
}
