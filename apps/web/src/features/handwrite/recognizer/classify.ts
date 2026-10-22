/**
 * Two-pass classification, ported from KanjiCanvas (MIT, Dominik Klein,
 * https://github.com/asdfjkl/kanjicanvas; see LICENSE-kanjicanvas.txt): a cheap end-point pass
 * over every reference pattern with a similar stroke count, then a whole-stroke pass over the
 * best hundred.
 */
import {
  endPointDistance,
  initialDistance,
  type Metric,
  ordered,
  wholeWholeDistance,
} from './distance.ts';
import type { Pattern, Stroke } from './geometry.ts';
import { completeMap, getMap } from './stroke-map.ts';

export interface Reference {
  char: string;
  strokes: Pattern;
}

export interface Scored {
  ref: Reference;
  /** Lower is closer. */
  score: number;
}

const COARSE_KEEP = 100;

/** Drawn strokes may be up to two fewer or one more than the reference has. */
function similarCount(drawn: number, ref: number): boolean {
  return drawn < ref + 2 && drawn > ref - 3;
}

interface Run {
  strokes: Stroke;
  partner: Stroke | undefined;
  joinedCount: number;
}

/** Consecutive longer-pattern strokes mapped to the same partner, joined. */
function runs(a: Pattern, b: Pattern, map: readonly number[]): Run[] {
  const { long, short } = ordered<Stroke>(a, b);
  const out: Run[] = [];
  let start = 0;
  while (start < long.length) {
    let stop = start + 1;
    while (stop < map.length && map[stop] === map[start]) stop++;
    const partner = short[map[start] as number];
    out.push({ strokes: long.slice(start, stop).flat(), partner, joinedCount: stop - start });
    start = stop;
  }
  return out;
}

function mappedDistance(a: Pattern, b: Pattern, metric: Metric, map: readonly number[]): number {
  return runs(a, b, map).reduce((sum, run) => sum + metric(run.partner, run.strokes), 0);
}

/** Whole-stroke distance, weighting joined strokes by how much longer the join is. */
function weightedDistance(a: Pattern, b: Pattern, map: readonly number[]): number {
  return runs(a, b, map).reduce((sum, run) => {
    const d = wholeWholeDistance(run.partner, run.strokes);
    if (run.joinedCount === 1) return sum + d;
    const lengths = [run.partner?.length ?? 0, run.strokes.length].sort((x, y) => x - y);
    const [mm = 0, nn = 0] = lengths;
    return sum + (mm === 0 ? d : d * (nn / mm));
  }, 0);
}

function coarseScore(ref: Reference, input: Pattern): number {
  const map = getMap(ref.strokes, input, endPointDistance);
  completeMap(ref.strokes, input, endPointDistance, map);
  return mappedDistance(ref.strokes, input, endPointDistance, map);
}

function fineScore(ref: Reference, input: Pattern): number {
  const map = getMap(ref.strokes, input, initialDistance);
  completeMap(ref.strokes, input, wholeWholeDistance, map);
  return weightedDistance(ref.strokes, input, map) / Math.min(input.length, ref.strokes.length);
}

const byScore = (x: Scored, y: Scored) => x.score - y.score;

/** References ranked against a normalised, resampled input; best first. */
export function classify(input: Pattern, refs: readonly Reference[], limit: number): Scored[] {
  if (input.length === 0) return [];
  const coarse = refs
    .filter((ref) => similarCount(input.length, ref.strokes.length))
    .map((ref) => ({ ref, score: coarseScore(ref, input) }))
    .sort(byScore)
    .slice(0, COARSE_KEEP);
  return coarse
    .map(({ ref }) => ({ ref, score: fineScore(ref, input) }))
    .sort(byScore)
    .slice(0, limit);
}
