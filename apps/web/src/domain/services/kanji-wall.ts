/**
 * The kanji wall: one tile per kanji of a JLPT level, in the level list's order (most frequent
 * first), each with its state, so the learner sees at a glance what they read, what they are
 * learning and what is still ahead. Quiet and factual, like the learned screen it mirrors.
 */
import { hasKanji } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { KnowledgeLevel, LearnerLevel } from '../types.ts';
import { kanjiList, type LearnedState, stateOf } from './learned.ts';
import { learnerLevelOf } from './learner-level.ts';
import { currentUnitView } from './units.ts';

export interface WallTile {
  char: string;
  state: LearnedState;
}

export interface KanjiWall {
  level: LearnerLevel;
  tiles: WallTile[];
  /** Tiles the learner reads. */
  known: number;
  /** The kanji the learner is on: the first not yet read in the current unit's words. */
  current?: string;
}

async function kanjiLevels(repos: Repos): Promise<Map<string, KnowledgeLevel>> {
  const levels = new Map<string, KnowledgeLevel>();
  for (const row of await repos.kanjiReadings.all()) {
    levels.set(row.kanji, Math.max(levels.get(row.kanji) ?? 0, row.level) as KnowledgeLevel);
  }
  return levels;
}

/** The first kanji of the current unit's words that is on the wall and not yet read. */
async function currentKanji(repos: Repos, tiles: readonly WallTile[]) {
  const view = await currentUnitView(repos);
  if (!view) return undefined;
  const open = new Set(tiles.filter((tile) => tile.state !== 'known').map((tile) => tile.char));
  const chars = view.unit.words.flatMap((word) => [...word.written].filter(hasKanji));
  return chars.find((char) => open.has(char));
}

/** The wall of `level`, or of the learner's own level. */
export async function kanjiWall(repos: Repos, level?: LearnerLevel): Promise<KanjiWall> {
  const settings = await repos.settings.get();
  const shown = level ?? learnerLevelOf(settings);
  const [kanji, levels] = await Promise.all([
    kanjiList(repos.dictionary, shown),
    kanjiLevels(repos),
  ]);
  const tiles = kanji.map((k) => ({ char: k.char, state: stateOf(levels.get(k.char)) }));
  const known = tiles.filter((tile) => tile.state === 'known').length;
  const current = await currentKanji(repos, tiles);
  return { level: shown, tiles, known, ...(current ? { current } : {}) };
}

/** Up to `size` tiles around `char`, in wall order, for a glimpse of the wall on a kanji page. */
export function wallAround(tiles: readonly WallTile[], char: string, size: number): WallTile[] {
  const at = tiles.findIndex((tile) => tile.char === char);
  if (at < 0) return [];
  const start = Math.max(0, Math.min(at - Math.floor(size / 2), tiles.length - size));
  return tiles.slice(start, start + size);
}
