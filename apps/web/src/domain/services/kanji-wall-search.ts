/**
 * Finding kanji on the wall: by a reading typed in kana (or romaji folded to kana), on'yomi and
 * kun'yomi alike, or by the kanji themselves, across the N5–N3 lists; and the wall's tiles kept
 * to one state (read, learning, not yet). Quiet, like the wall: no counts to beat.
 */
import { hasKanji, toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { Kanji } from '../types.ts';
import type { WallTile } from './kanji-wall.ts';
import { kanjiLevels, kanjiList, type LearnedState, LIST_LEVELS, stateOf } from './learned.ts';

/** What the wall shows: every tile, or those in one state. */
export type WallFilter = LearnedState | 'all';

/** The tiles in `filter`'s state. */
export function filterTiles(tiles: readonly WallTile[], filter: WallFilter): WallTile[] {
  return filter === 'all' ? [...tiles] : tiles.filter((tile) => tile.state === filter);
}

/** A kanji's readings as plain hiragana: セイ → せい, い.きる → いきる, and its stem いき. */
function readingsOf(kanji: Kanji): { whole: string[]; stems: string[] } {
  const kun = kanji.kun.map((r) => r.replace(/-/gu, ''));
  const whole = [...kanji.on, ...kun].map((r) => toKanaFold(r.replace('.', '')));
  const stems = kun.map((r) => toKanaFold(r.split('.')[0] ?? ''));
  return { whole, stems };
}

/** Stems this short would match far too much of a longer query (ち in ちかく). */
const MIN_STEM = 2;

/**
 * How well `kanji` answers a kana query: 0 for a reading equal to it, 1 for one that starts
 * with it, 2 for a word the query spells with the kanji's stem (ちかく for 近, ちか.い);
 * undefined when it does not.
 */
export function readingMatch(kanji: Kanji, query: string): number | undefined {
  const { whole, stems } = readingsOf(kanji);
  if (whole.includes(query)) return 0;
  if (whole.some((r) => r.startsWith(query))) return 1;
  const stem = stems.some((s) => s.length >= MIN_STEM && query.startsWith(s));
  return stem ? 2 : undefined;
}

/** The N5–N3 kanji, easiest list first, each list most frequent first. */
async function listed(repos: Repos): Promise<Kanji[]> {
  const lists = await Promise.all(LIST_LEVELS.map((level) => kanjiList(repos.dictionary, level)));
  return lists.flat();
}

function matching(kanji: readonly Kanji[], query: string): Kanji[] {
  if (hasKanji(query)) {
    const typed = new Set([...query]);
    return kanji.filter((k) => typed.has(k.char));
  }
  const fold = toKanaFold(query);
  const ranked = kanji.flatMap((k) => {
    const rank = readingMatch(k, fold);
    return rank === undefined ? [] : [{ k, rank }];
  });
  return ranked.sort((a, b) => a.rank - b.rank).map(({ k }) => k);
}

/** The wall's kanji that a query names or reads as, best matches first; none for no query. */
export async function searchWall(repos: Repos, query: string): Promise<WallTile[]> {
  if (query.trim() === '') return [];
  const [kanji, levels] = await Promise.all([listed(repos), kanjiLevels(repos)]);
  return matching(kanji, query.trim()).map((k) => ({
    char: k.char,
    state: stateOf(levels.get(k.char)),
  }));
}
