/**
 * Reads one glyph outline from a WOFF 1.0 TrueType font and returns it as an SVG path, so the app
 * icon's SVG renders without the font (B3). Handles simple glyphs only, which is all 漢 needs.
 */
import { inflateSync } from 'node:zlib';

type Tables = Map<string, DataView>;

interface Glyph {
  /** SVG path data in font units, y pointing down, baseline at 0. */
  d: string;
  unitsPerEm: number;
  /** Bounding box in the same coordinates as `d`. */
  box: { x: number; y: number; width: number; height: number };
}

function tables(woff: Uint8Array): Tables {
  const view = new DataView(woff.buffer, woff.byteOffset, woff.byteLength);
  const out: Tables = new Map();
  for (let i = 0; i < view.getUint16(12); i++) {
    const at = 44 + i * 20;
    const tag = String.fromCharCode(...woff.subarray(at, at + 4));
    const [offset = 0, size = 0, original = 0] = [4, 8, 12].map((delta) =>
      view.getUint32(at + delta),
    );
    const raw = woff.subarray(offset, offset + size);
    const data = size === original ? raw : new Uint8Array(inflateSync(raw));
    out.set(tag, new DataView(data.buffer, data.byteOffset, data.byteLength));
  }
  return out;
}

function table(all: Tables, tag: string): DataView {
  const found = all.get(tag);
  if (!found) throw new Error(`font has no ${tag} table`);
  return found;
}

/** The format 4 subtable of the Windows Unicode BMP cmap. */
function cmapFormat4(cmap: DataView): number {
  for (let i = 0; i < cmap.getUint16(2); i++) {
    const at = 4 + i * 8;
    const offset = cmap.getUint32(at + 4);
    const windowsBmp = cmap.getUint16(at) === 3 && cmap.getUint16(at + 2) === 1;
    if (windowsBmp && cmap.getUint16(offset) === 4) return offset;
  }
  throw new Error('font has no format 4 cmap');
}

function glyphIndex(cmap: DataView, char: string): number {
  const code = char.codePointAt(0) ?? 0;
  const base = cmapFormat4(cmap);
  const segments = cmap.getUint16(base + 6) / 2;
  const ends = base + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const ranges = deltas + segments * 2;
  for (let s = 0; s < segments; s++) {
    if (cmap.getUint16(ends + s * 2) < code) continue;
    const start = cmap.getUint16(starts + s * 2);
    if (start > code) break;
    const range = cmap.getUint16(ranges + s * 2);
    const delta = cmap.getUint16(deltas + s * 2);
    if (range === 0) return (code + delta) & 0xffff;
    const glyph = cmap.getUint16(ranges + s * 2 + range + (code - start) * 2);
    return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
  }
  throw new Error(`font has no glyph for ${char}`);
}

function glyphOffset(all: Tables, index: number): number {
  const long = table(all, 'head').getInt16(50) === 1;
  const loca = table(all, 'loca');
  return long ? loca.getUint32(index * 4) : loca.getUint16(index * 2) * 2;
}

interface Point {
  x: number;
  y: number;
  on: boolean;
}

function readFlags(glyf: DataView, at: number, count: number): { flags: number[]; next: number } {
  const flags: number[] = [];
  let cursor = at;
  while (flags.length < count) {
    const flag = glyf.getUint8(cursor++);
    flags.push(flag);
    if (flag & 8) {
      const repeat = glyf.getUint8(cursor++);
      for (let r = 0; r < repeat; r++) flags.push(flag);
    }
  }
  return { flags, next: cursor };
}

/** Reads the x (short bit 2, same bit 16) or y (short bit 4, same bit 32) coordinates. */
function readCoords(glyf: DataView, at: number, flags: number[], short: number, same: number) {
  const values: number[] = [];
  let cursor = at;
  let value = 0;
  for (const flag of flags) {
    if (flag & short) {
      const step = glyf.getUint8(cursor++);
      value += flag & same ? step : -step;
    } else if (!(flag & same)) {
      value += glyf.getInt16(cursor);
      cursor += 2;
    }
    values.push(value);
  }
  return { values, next: cursor };
}

function contours(glyf: DataView, at: number): Point[][] {
  const count = glyf.getInt16(at);
  if (count < 0) throw new Error('composite glyphs are not supported');
  const ends = Array.from({ length: count }, (_, i) => glyf.getUint16(at + 10 + i * 2));
  const total = (ends.at(-1) ?? -1) + 1;
  const instructions = at + 10 + count * 2;
  const { flags, next } = readFlags(glyf, instructions + 2 + glyf.getUint16(instructions), total);
  const xs = readCoords(glyf, next, flags, 2, 16);
  const ys = readCoords(glyf, xs.next, flags, 4, 32);
  const points = flags.map((flag, i) => ({
    x: xs.values[i] ?? 0,
    y: -(ys.values[i] ?? 0),
    on: (flag & 1) === 1,
  }));
  return ends.map((end, i) => points.slice(i === 0 ? 0 : (ends[i - 1] ?? 0) + 1, end + 1));
}

const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true });
const xy = (p: Point) => `${Math.round(p.x)} ${Math.round(p.y)}`;

/** One closed contour of on- and off-curve points as quadratic path commands. */
function contourPath(points: Point[]): string {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return '';
  const start = first.on ? first : last.on ? last : mid(last, first);
  let d = `M${xy(start)}`;
  let control: Point | undefined;
  for (const point of [...points.slice(first.on ? 1 : 0), start]) {
    if (!point.on) {
      if (control) d += `Q${xy(control)} ${xy(mid(control, point))}`;
      control = point;
      continue;
    }
    d += control ? `Q${xy(control)} ${xy(point)}` : `L${xy(point)}`;
    control = undefined;
  }
  return `${d}Z`;
}

/** The outline of `char` in the font, as an SVG path. */
export function glyphPath(woff: Uint8Array, char: string): Glyph {
  const all = tables(woff);
  const glyf = table(all, 'glyf');
  const at = glyphOffset(all, glyphIndex(table(all, 'cmap'), char));
  const [xMin, yMin, xMax, yMax] = [2, 4, 6, 8].map((delta) => glyf.getInt16(at + delta));
  return {
    d: contours(glyf, at).map(contourPath).join(''),
    unitsPerEm: table(all, 'head').getUint16(18),
    box: {
      x: xMin ?? 0,
      y: -(yMax ?? 0),
      width: (xMax ?? 0) - (xMin ?? 0),
      height: (yMax ?? 0) - (yMin ?? 0),
    },
  };
}
