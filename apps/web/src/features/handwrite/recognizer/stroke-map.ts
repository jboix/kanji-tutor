/**
 * Stroke correspondence between a drawing and a reference pattern, whatever the stroke order or
 * count. Ported from KanjiCanvas (MIT, Dominik Klein, https://github.com/asdfjkl/kanjicanvas; see
 * LICENSE-kanjicanvas.txt), after Okumura et al.'s M-N stroke matching.
 *
 * A map has one entry per stroke of the pattern with more strokes: the index of the stroke it
 * matches in the other pattern, or −1 while unassigned.
 */
import { type Metric, ordered } from './distance.ts';
import type { Pattern, Stroke } from './geometry.ts';

const UNASSIGNED = -1;
const ROUNDS = 3;

function closestFree(long: Pattern, target: Stroke | undefined, map: number[], metric: Metric) {
  let best = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  long.forEach((stroke, j) => {
    if (map[j] !== UNASSIGNED) return;
    const d = metric(stroke, target);
    if (d < bestDist) [best, bestDist] = [j, d];
  });
  return best;
}

/** Greedy start: each shorter-pattern stroke takes its closest free longer-pattern stroke. */
function initStrokeMap(long: Pattern, short: Pattern, metric: Metric): number[] {
  const map = long.map(() => UNASSIGNED);
  short.forEach((stroke, i) => {
    const best = closestFree(long, stroke, map, metric);
    if (best >= 0) map[best] = i;
  });
  return map;
}

interface Pair {
  long: Pattern;
  short: Pattern;
  metric: Metric;
  map: number[];
}

/** Tries swapping (or moving) stroke i's partner with stroke j's; returns the new d(i). */
function improve({ long, short, metric, map }: Pair, i: number, j: number, dii: number): number {
  const mi = map[i] as number;
  const mj = map[j] as number;
  const dij = metric(long[j], short[mi]);
  if (mj === UNASSIGNED) {
    if (dij >= dii) return dii;
    map[j] = mi;
    map[i] = UNASSIGNED;
    return dij;
  }
  const djj = metric(long[j], short[mj]);
  const dji = metric(long[i], short[mj]);
  if (dji + dij >= dii + djj) return dii;
  map[j] = mi;
  map[i] = mj;
  // KanjiCanvas keeps dij here (not dji); kept as is so rankings match the original.
  return dij;
}

function improveStroke(pair: Pair, i: number): void {
  if (pair.map[i] === UNASSIGNED) return;
  let dii = pair.metric(pair.long[i], pair.short[pair.map[i] as number]);
  for (let j = 0; j < pair.map.length && pair.map[i] !== UNASSIGNED; j++) {
    dii = improve(pair, i, j, dii);
  }
}

/** Best one-to-one stroke map by greedy start and a few rounds of pairwise swaps. */
export function getMap(a: Pattern, b: Pattern, metric: Metric): number[] {
  const { long, short } = ordered<Stroke>(a, b);
  const pair: Pair = { long, short, metric, map: initStrokeMap(long, short, metric) };
  for (let round = 0; round < ROUNDS; round++) {
    for (let i = 0; i < pair.map.length; i++) improveStroke(pair, i);
  }
  return pair.map;
}

function fillEnds(map: number[]): void {
  const firstSet = map.findIndex((v) => v !== UNASSIGNED);
  const lastSet = map.findLastIndex((v) => v !== UNASSIGNED);
  if (firstSet < 0) return;
  map.fill(map[firstSet] as number, 0, firstSet);
  map.fill(map[lastSet] as number, lastSet + 1);
}

function joined(strokes: Pattern, from: number, to: number): Stroke {
  return strokes.slice(from, to + 1).flat();
}

/** Splits the gap between assigned strokes `start` and `stop` where the joins match best. */
function splitGap(long: Pattern, short: Pattern, metric: Metric, map: number[], start: number) {
  let stop = start + 1;
  while (stop < map.length && map[stop] === UNASSIGNED) stop++;
  const left = short[map[start] as number];
  const right = short[map[stop] as number];
  let div = start;
  let best = Number.POSITIVE_INFINITY;
  for (let j = start; j < stop; j++) {
    const d = metric(joined(long, start, j), left) + metric(joined(long, j + 1, stop), right);
    if (d < best) [div, best] = [j, d];
  }
  map.fill(map[start] as number, start, div + 1);
  map.fill(map[stop] as number, div + 1, stop);
}

/** Turns a one-to-one map into an M-N map: unassigned strokes join a neighbour's partner. */
export function completeMap(a: Pattern, b: Pattern, metric: Metric, map: number[]): number[] {
  if (!map.includes(UNASSIGNED)) return map;
  const { long, short } = ordered<Stroke>(a, b);
  fillEnds(map);
  for (let i = 0; i + 1 < map.length; i++) {
    if (map[i + 1] === UNASSIGNED) splitGap(long, short, metric, map, i);
  }
  return map;
}
