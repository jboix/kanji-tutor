/**
 * Builds the handwriting reference patterns (I4) from KanjiCanvas (MIT, Dominik Klein,
 * https://github.com/asdfjkl/kanjicanvas) at a pinned commit.
 *
 *   bun scripts/handwrite-patterns.ts
 *
 * Downloads `ref-patterns.js` into the git-ignored `data/raw/kanjicanvas/`, checks its sha256 and
 * writes `src/features/handwrite/recognizer/patterns.json`: one base64 string per kanji. Each
 * string decodes to bytes `[strokes, points of stroke 1 … n, x0, y0, x1, y1, …]`, where a
 * coordinate byte b stands for `b * SCALE - OFFSET` in KanjiCanvas's 256-unit box (the reference
 * points are already moment-normalised and resampled, so they range about −72 to 424).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const COMMIT = 'a9214105f156def3b96930e5fcf10b7652b7a1f7';
const URL = `https://raw.githubusercontent.com/asdfjkl/kanjicanvas/${COMMIT}/docs/resources/javascript/ref-patterns.js`;
const SHA256 = 'e1770a3f32ce18cc1c0eff67c539e663a3e2b0437172bde66abc3336aedf06c7';
/** Must match `recognizer/patterns.ts`. */
const SCALE = 2;
const OFFSET = 80;

type RefPattern = [char: string, strokes: number, points: [number, number][][]];

const root = resolve(import.meta.dir, '..');
const rawDir = join(root, 'data', 'raw', 'kanjicanvas');
const out = join(root, 'src', 'features', 'handwrite', 'recognizer', 'patterns.json');

async function source(): Promise<string> {
  mkdirSync(rawDir, { recursive: true });
  const path = join(rawDir, 'ref-patterns.js');
  if (!existsSync(path)) {
    console.log(`downloading ${URL}`);
    const response = await fetch(URL);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${URL}`);
    writeFileSync(path, new Uint8Array(await response.arrayBuffer()));
  }
  const bytes = readFileSync(path);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== SHA256) throw new Error(`sha256 mismatch for ${path}: ${actual}`);
  return bytes.toString('utf8');
}

/** The array literal after `KanjiCanvas.refPatterns =`, which is plain JSON bar a trailing comma. */
function parse(text: string): RefPattern[] {
  const start = text.indexOf('[', text.indexOf('KanjiCanvas.refPatterns'));
  const body = text.slice(start, text.lastIndexOf(']') + 1).replace(/,\s*\]$/, ']');
  return JSON.parse(body) as RefPattern[];
}

function byte(value: number): number {
  const b = Math.round((value + OFFSET) / SCALE);
  if (b < 0 || b > 255) throw new Error(`coordinate ${value} out of range`);
  return b;
}

function encode([, count, strokes]: RefPattern): string {
  if (count !== strokes.length || count > 255) throw new Error('bad stroke count');
  const bytes = [count, ...strokes.map((s) => s.length)];
  if (bytes.some((n) => n > 255)) throw new Error('stroke too long');
  for (const stroke of strokes) for (const [x, y] of stroke) bytes.push(byte(x), byte(y));
  return Buffer.from(bytes).toString('base64');
}

const patterns = parse(await source()).filter(([char]) => /^\p{Script=Han}$/u.test(char));
const table: Record<string, string> = {};
for (const pattern of patterns) table[pattern[0]] = encode(pattern);
const json = {
  source: `KanjiCanvas ${COMMIT} (MIT), see LICENSE-kanjicanvas.txt`,
  scale: SCALE,
  offset: OFFSET,
  patterns: table,
};
writeFileSync(out, `${JSON.stringify(json, null, 2)}\n`);
console.log(
  `${patterns.length} kanji → ${out} (${(readFileSync(out).length / 1024).toFixed(0)} KB)`,
);
