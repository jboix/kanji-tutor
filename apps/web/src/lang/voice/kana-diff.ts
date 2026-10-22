/** Where a spoken reading differs from the expected one, kana by kana (voice.html gap mark). */

export type KanaSegmentKind = 'same' | 'missing' | 'extra';

export interface KanaSegment {
  kind: KanaSegmentKind;
  text: string;
}

const cell = (table: number[][], i: number, j: number) => table[i]?.[j] ?? 0;

/** Longest-common-subsequence lengths: `table[i][j]` for the suffixes from i and j. */
function lcsTable(a: readonly string[], b: readonly string[]): number[][] {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    const row = table[i] ?? [];
    for (let j = b.length - 1; j >= 0; j--) {
      const skip = Math.max(cell(table, i + 1, j), cell(table, i, j + 1));
      row[j] = a[i] === b[j] ? cell(table, i + 1, j + 1) + 1 : skip;
    }
  }
  return table;
}

function push(segments: KanaSegment[], kind: KanaSegmentKind, text: string) {
  const last = segments.at(-1);
  if (last?.kind === kind) last.text += text;
  else segments.push({ kind, text });
}

interface Cursor {
  i: number;
  j: number;
}

/** The next step of the alignment; ties drop an expected kana first. */
function stepKind(a: string[], b: string[], table: number[][], at: Cursor): KanaSegmentKind {
  if (at.i >= a.length) return 'extra';
  if (at.j >= b.length) return 'missing';
  if (a[at.i] === b[at.j]) return 'same';
  const skipExpected = cell(table, at.i + 1, at.j);
  return skipExpected >= cell(table, at.i, at.j + 1) ? 'missing' : 'extra';
}

/** The kana a step covers, moving the cursor past it. */
function take(kind: KanaSegmentKind, a: string[], b: string[], at: Cursor): string {
  if (kind === 'extra') return b[at.j++] ?? '';
  if (kind === 'same') at.j++;
  return a[at.i++] ?? '';
}

/**
 * Segments of `expected` and `said` in reading order: `same` kana, kana the speaker left out
 * (`missing`, from expected) and kana they added (`extra`, from said). In a substitution the
 * missing kana come first: てがみ / てかみ → て, -が, +か, み.
 */
export function kanaDiff(expected: string, said: string): KanaSegment[] {
  const a = [...expected];
  const b = [...said];
  const table = lcsTable(a, b);
  const segments: KanaSegment[] = [];
  const at: Cursor = { i: 0, j: 0 };
  while (at.i < a.length || at.j < b.length) {
    const kind = stepKind(a, b, table, at);
    push(segments, kind, take(kind, a, b, at));
  }
  return segments;
}
