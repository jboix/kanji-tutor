/**
 * Moving up a level (P4): the app suggests the next JLPT level once 80% of the current
 * level's words and kanji are known, and never moves up by itself. "Not now" hides the
 * suggestion for a week.
 */
import type { DictionaryRepo, Repos } from '../repos.ts';
import type { LearnerLevel } from '../types.ts';
import { DAY_MS } from './items.ts';
import { kanjiList, wordList } from './learned.ts';
import { learnerLevelOf } from './learner-level.ts';

/** Share of the level's words and kanji known before moving up is suggested. */
export const MOVE_UP_SHARE = 0.8;
/** How long "Not now" hides the suggestion. */
export const LEVEL_UP_SNOOZE_MS = 7 * DAY_MS;

export interface LevelUp {
  level: LearnerLevel;
  next: LearnerLevel;
  /** Whole percent of the level's words known, e.g. 82. */
  percent: number;
}

type ListKind = 'words' | 'kanji';

/**
 * The ids of a level's list (the learned screen's words with kanji, or its kanji), read once per
 * dictionary, pack version and level, then kept (N10): the lists only change with a pack.
 */
const lists = new WeakMap<DictionaryRepo, Map<string, Promise<ReadonlySet<string>>>>();

async function readList(dictionary: DictionaryRepo, kind: ListKind, level: LearnerLevel) {
  if (kind === 'kanji') return new Set((await kanjiList(dictionary, level)).map((k) => k.char));
  return new Set((await wordList(dictionary, level)).map((w) => w.id));
}

/** A level's list as a set of ids, memoised per dictionary and pack version (N10). */
export function levelList(
  dictionary: DictionaryRepo,
  kind: ListKind,
  level: LearnerLevel,
  version = '',
): Promise<ReadonlySet<string>> {
  const cache = lists.get(dictionary) ?? new Map<string, Promise<ReadonlySet<string>>>();
  lists.set(dictionary, cache);
  const key = `${version}:${kind}:${level}`;
  const list = cache.get(key) ?? readList(dictionary, kind, level);
  cache.set(key, list);
  return list;
}

/** Known share of a list (level 3 or more), or undefined for an empty list. */
function shareOf(list: ReadonlySet<string>, levels: ReadonlyMap<string, number>) {
  if (list.size === 0) return undefined;
  let known = 0;
  for (const [key, level] of levels) if (level >= 3 && list.has(key)) known++;
  return known / list.size;
}

async function wordLevels(repos: Repos): Promise<Map<string, number>> {
  return new Map((await repos.items.byKind('word')).map((item) => [item.ref, item.level]));
}

/** A kanji's level: the best level among its readings (K3). */
async function kanjiLevels(repos: Repos): Promise<Map<string, number>> {
  const levels = new Map<string, number>();
  for (const row of await repos.kanjiReadings.all()) {
    levels.set(row.kanji, Math.max(levels.get(row.kanji) ?? 0, row.level));
  }
  return levels;
}

/**
 * The suggestion to show on Today, or undefined (N3 reached, snoozed, or not 80% yet). It counts
 * the learner's known items against the level's memoised lists (N10): the same lists and states
 * as the learned screen, without building every level's entries.
 */
export async function levelUpSuggestion(repos: Repos, now: number): Promise<LevelUp | undefined> {
  const settings = await repos.settings.get();
  const level = learnerLevelOf(settings);
  if (level === 3 || (settings.levelUpSnoozedUntil ?? 0) > now) return undefined;
  const list = (kind: ListKind) => levelList(repos.dictionary, kind, level, settings.packVersion);
  const [words, levels] = await Promise.all([list('words'), wordLevels(repos)]);
  const share = shareOf(words, levels);
  if (share === undefined || share < MOVE_UP_SHARE) return undefined;
  const [kanji, known] = await Promise.all([list('kanji'), kanjiLevels(repos)]);
  if ((shareOf(kanji, known) ?? 1) < MOVE_UP_SHARE) return undefined;
  return { level, next: (level - 1) as LearnerLevel, percent: Math.floor(share * 100) };
}

/** Moves the learner to the next level, only when they choose to. */
export async function moveUpLevel(repos: Repos, next: LearnerLevel): Promise<void> {
  await repos.settings.patch({ learnerLevel: next });
}

/** "Not now": hides the suggestion for a week. */
export async function snoozeLevelUp(repos: Repos, now: number): Promise<void> {
  await repos.settings.patch({ levelUpSnoozedUntil: now + LEVEL_UP_SNOOZE_MS });
}

/** Known out of all, e.g. 37 of 80 kanji. */
export interface KnownCount {
  known: number;
  total: number;
}

/** Where the learner is at their level (IA2): kanji, words and grammar known of the level's. */
export interface LevelProgress {
  level: LearnerLevel;
  kanji: KnownCount;
  words: KnownCount;
  grammar: KnownCount;
}

function knownOf(list: ReadonlySet<string>, levels: ReadonlyMap<string, number>): KnownCount {
  let known = 0;
  for (const [key, level] of levels) if (level >= 3 && list.has(key)) known++;
  return { known, total: list.size };
}

async function grammarProgress(repos: Repos, level: LearnerLevel): Promise<KnownCount> {
  const [points, items] = await Promise.all([repos.grammar.all(), repos.items.byKind('grammar')]);
  const levels = new Map(items.map((item) => [item.ref, item.level]));
  const ids = new Set(points.filter((p) => p.level === level).map((p) => p.id));
  return knownOf(ids, levels);
}

/**
 * Today's level bars (IA2): the learner's level's kanji, words and grammar points, and how many
 * of each are known (level 3 or more). The lists are the learned screen's, memoised (N10).
 */
export async function levelProgress(repos: Repos): Promise<LevelProgress> {
  const settings = await repos.settings.get();
  const level = learnerLevelOf(settings);
  const list = (kind: ListKind) => levelList(repos.dictionary, kind, level, settings.packVersion);
  const [words, kanji, wordLevel, kanjiLevel, grammar] = await Promise.all([
    list('words'),
    list('kanji'),
    wordLevels(repos),
    kanjiLevels(repos),
    grammarProgress(repos, level),
  ]);
  return { level, kanji: knownOf(kanji, kanjiLevel), words: knownOf(words, wordLevel), grammar };
}
