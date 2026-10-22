/**
 * Lookalike kanji pairs to drill (R8, 待/持): the pairs the learner actually swapped in the last
 * two weeks first, most often first, then pairs of known kanji that share parts (KRADFILE, D13).
 */
import type { LookalikePair } from '../drills/index.ts';
import { parseItemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import type { Kanji, Review } from '../types.ts';
import { swappedPair } from './confusables.ts';

/** A pair with the words it was swapped in (to find sentences) and how often. */
export interface PairCandidate extends LookalikePair {
  wordIds: string[];
  times: number;
}

/** Kanji of the session looked at for lookalike shapes, and lookalikes kept per kanji. */
const SHAPE_KANJI = 12;
const SHAPES_PER_KANJI = 2;
/** Lookalikes checked against the learner's readings per kanji, most parts shared first. */
const SHAPE_CANDIDATES = 10;

interface Swap {
  chars: [string, string];
  wordIds: Set<string>;
  times: number;
}

async function swaps(repos: Repos, reviews: readonly Review[]): Promise<Swap[]> {
  const byKey = new Map<string, Swap>();
  for (const review of reviews.filter((r) => r.errorType === 'wrong-kanji')) {
    const chars = await swappedPair(repos, review);
    if (!chars) continue;
    const swap = byKey.get(chars.join('')) ?? { chars, wordIds: new Set(), times: 0 };
    const { kind, ref } = parseItemId(review.itemId);
    if (kind === 'word') swap.wordIds.add(ref);
    swap.times += 1;
    byKey.set(chars.join(''), swap);
  }
  return [...byKey.values()].sort((a, b) => b.times - a.times);
}

async function confused(repos: Repos, reviews: readonly Review[]): Promise<PairCandidate[]> {
  const list = await swaps(repos, reviews);
  const entries = await repos.dictionary.kanjiMany(list.flatMap((s) => s.chars));
  return list.flatMap((swap, i) => {
    const [kanji, lookalike] = [entries[2 * i], entries[2 * i + 1]];
    if (!kanji || !lookalike) return [];
    return [{ kanji, lookalike, confused: true, wordIds: [...swap.wordIds], times: swap.times }];
  });
}

/** Kanji sharing parts with `kanji`, most parts shared first. */
async function sharing(repos: Repos, kanji: Kanji): Promise<Kanji[]> {
  const lists = await Promise.all(
    kanji.components.map((c) => repos.dictionary.kanjiByComponent(c)),
  );
  const shared = new Map<string, { entry: Kanji; count: number }>();
  for (const entry of lists.flat().filter((k) => k.char !== kanji.char)) {
    const seen = shared.get(entry.char);
    shared.set(entry.char, { entry, count: (seen?.count ?? 0) + 1 });
  }
  return [...shared.values()]
    .sort((a, b) => b.count - a.count || (a.entry.char < b.entry.char ? -1 : 1))
    .slice(0, SHAPE_CANDIDATES)
    .map(({ entry }) => entry);
}

function knownKanji(repos: Repos) {
  const cache = new Map<string, Promise<boolean>>();
  return (char: string) => {
    const known =
      cache.get(char) ??
      repos.kanjiReadings.byKanji(char).then((rows) => rows.some((r) => r.level >= 3));
    cache.set(char, known);
    return known;
  };
}

/** Up to {@link SHAPES_PER_KANJI} known kanji sharing parts with a known kanji. */
async function shapesOf(repos: Repos, kanji: Kanji, known: (char: string) => Promise<boolean>) {
  if (!(await known(kanji.char))) return [];
  const alike: Kanji[] = [];
  for (const other of await sharing(repos, kanji)) {
    if (alike.length < SHAPES_PER_KANJI && (await known(other.char))) alike.push(other);
  }
  return alike.map(
    (lookalike): PairCandidate => ({ kanji, lookalike, confused: false, wordIds: [], times: 0 }),
  );
}

async function shapes(repos: Repos, chars: readonly string[]): Promise<PairCandidate[]> {
  const known = knownKanji(repos);
  const entries = await repos.dictionary.kanjiMany(chars.slice(0, SHAPE_KANJI));
  const pairs: PairCandidate[] = [];
  for (const kanji of entries) if (kanji) pairs.push(...(await shapesOf(repos, kanji, known)));
  return pairs;
}

/**
 * Pairs to drill, in order: swaps from `wrong-kanji` reviews (most frequent first), then
 * lookalikes among known kanji (a reading at level 3 or more) for the given kanji. A pair is
 * listed once, in the direction it was first found.
 */
export async function lookalikePairs(
  repos: Repos,
  reviews: readonly Review[],
  chars: readonly string[],
): Promise<PairCandidate[]> {
  const all = [...(await confused(repos, reviews)), ...(await shapes(repos, chars))];
  const seen = new Set<string>();
  return all.filter((pair) => {
    const key = [pair.kanji.char, pair.lookalike.char].sort().join('');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
