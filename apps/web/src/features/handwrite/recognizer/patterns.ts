/** Decodes the reference patterns built by `scripts/handwrite-patterns.ts`. */
import type { Reference } from './classify.ts';
import type { Point, Stroke } from './geometry.ts';

export interface PatternTable {
  scale: number;
  offset: number;
  /** Kanji → base64 of `[strokes, points per stroke…, x, y, x, y, …]`. */
  patterns: Record<string, string>;
}

function bytesOf(base64: string): Uint8Array {
  const text = atob(base64);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}

function decodeOne(char: string, base64: string, scale: number, offset: number): Reference {
  const bytes = bytesOf(base64);
  const count = bytes[0] ?? 0;
  const at = (i: number) => (bytes[i] ?? 0) * scale - offset;
  const strokes: Stroke[] = [];
  let cursor = 1 + count;
  for (let s = 0; s < count; s++) {
    const length = bytes[1 + s] ?? 0;
    const stroke: Point[] = [];
    for (let p = 0; p < length; p++, cursor += 2) stroke.push([at(cursor), at(cursor + 1)]);
    strokes.push(stroke);
  }
  return { char, strokes };
}

/** Every reference pattern in the table. */
export function decodePatterns(table: PatternTable): Reference[] {
  return Object.entries(table.patterns).map(([char, base64]) =>
    decodeOne(char, base64, table.scale, table.offset),
  );
}
