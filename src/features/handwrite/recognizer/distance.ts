/**
 * Stroke distances, ported from KanjiCanvas (MIT, Dominik Klein,
 * https://github.com/asdfjkl/kanjicanvas; see LICENSE-kanjicanvas.txt).
 */
import type { Point, Stroke } from './geometry.ts';

/** Compares two strokes (or two point lists); lower is closer. */
export type Metric = (a: Stroke | undefined, b: Stroke | undefined) => number;

/** The longer of two lists first, then the shorter; ties keep the order given. */
export function ordered<T>(a: readonly T[] | undefined, b: readonly T[] | undefined) {
  const first = a ?? [];
  const second = b ?? [];
  return second.length > first.length
    ? { long: second, short: first }
    : { long: first, short: second };
}

function manhattan(a: Point, b: Point): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

/** Distance between the start points plus distance between the end points. */
export const endPointDistance: Metric = (a, b) => {
  const aFirst = a?.[0];
  const bFirst = b?.[0];
  const aLast = a?.at(-1);
  const bLast = b?.at(-1);
  if (!aFirst || !bFirst || !aLast || !bLast) return 0;
  return manhattan(aFirst, bFirst) + manhattan(aLast, bLast);
};

/** Point-by-point distance over the shorter stroke, scaled up by the length ratio. */
export const initialDistance: Metric = (a, b) => {
  const one = a ?? [];
  const two = b ?? [];
  const min = Math.min(one.length, two.length);
  const max = Math.max(one.length, two.length);
  if (min === 0) return 0;
  let dist = 0;
  for (let i = 0; i < min; i++) dist += manhattan(one[i] as Point, two[i] as Point);
  return dist * (max / min);
};

/** Mean distance with the longer stroke sampled evenly against the shorter one. */
export const wholeWholeDistance: Metric = (a, b) => {
  const { long, short } = ordered(a, b);
  const m = short.length;
  if (m === 0) return 0;
  const step = Math.floor(long.length / m);
  let dist = 0;
  for (let i = 0; i < m; i++) dist += manhattan(long[step * i] as Point, short[i] as Point);
  return Math.floor(dist / m);
};
