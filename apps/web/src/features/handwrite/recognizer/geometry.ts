/**
 * Moment normalisation and feature extraction, ported from KanjiCanvas (MIT, Dominik Klein,
 * https://github.com/asdfjkl/kanjicanvas; see LICENSE-kanjicanvas.txt).
 */

export type Point = readonly [x: number, y: number];
export type Stroke = readonly Point[];
export type Pattern = readonly Stroke[];

const SIZE = 256;
/** Distance between extracted points, in the 256-unit box (KanjiCanvas uses 20). */
const INTERVAL = 20;

function points(pattern: Pattern): Point[] {
  return pattern.flat();
}

function bounds(all: readonly Point[]) {
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

/** Aspect-ratio-adaptive normalisation: sqrt(sin(π/2 · short/long)). */
function aran(width: number, height: number): number {
  const ratio = height > width ? width / height : height / width;
  return Math.sqrt(Math.sin((Math.PI / 2) * (Number.isFinite(ratio) ? ratio : 0)));
}

function spread(values: readonly number[], centre: number): number {
  return values.reduce((sum, v) => sum + (v - centre) ** 2, 0);
}

function boxSize(all: readonly Point[]) {
  const { width, height } = bounds(all);
  const r2 = aran(width, height);
  return height > width ? { w: r2 * SIZE, h: SIZE } : { w: SIZE, h: r2 * SIZE };
}

/** Centres the pattern on its centre of mass and scales it by its second moments. */
export function momentNormalize(pattern: Pattern): Pattern {
  const all = points(pattern);
  const { w, h } = boxSize(all);
  const n = all.length;
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const xc = xs.reduce((a, b) => a + b, 0) / n;
  const yc = ys.reduce((a, b) => a + b, 0) / n;
  const alpha = w / (4 * Math.sqrt(spread(xs, xc) / n)) || 0;
  const beta = h / (4 * Math.sqrt(spread(ys, yc) / n)) || 0;
  // KanjiCanvas centres on w/2 then shifts by (SIZE - w)/2, which is SIZE/2 on both axes.
  const c = SIZE / 2;
  return pattern.map((stroke) =>
    stroke.map(([x, y]): Point => [alpha * (x - xc) + c, beta * (y - yc) + c]),
  );
}

function euclid(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Points at regular intervals along one stroke, always keeping its start (and end if far). */
function extractStroke(stroke: Stroke): Point[] {
  const first = stroke[0];
  const last = stroke.at(-1);
  if (!first || !last) return [];
  const kept: Point[] = [first];
  let dist = 0;
  for (let j = 1; j < stroke.length; j++) {
    const prev = stroke[j - 1] as Point;
    const here = stroke[j] as Point;
    dist += euclid(prev, here);
    if (dist >= INTERVAL && j > 1) {
      dist -= INTERVAL;
      kept.push(here);
    }
  }
  if (kept.length === 1 || dist > 0.75 * INTERVAL) kept.push(last);
  return kept;
}

/** Resamples every stroke of a normalised pattern. */
export function extractFeatures(pattern: Pattern): Pattern {
  return pattern.map(extractStroke);
}
