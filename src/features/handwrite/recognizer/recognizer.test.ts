import { describe, expect, it } from 'vitest';
import { endPointDistance } from './distance.ts';
import { createRecognizer, loadRecognizer, type Pattern } from './index.ts';
import { decodePatterns } from './patterns.ts';
import { SAMPLES } from './sample-strokes.ts';
import { completeMap, getMap } from './stroke-map.ts';

const recognizer = await loadRecognizer();

function rankOf(char: string, strokes: Pattern): number {
  return recognizer.recognize(strokes, 5).findIndex((c) => c.char === char);
}

function sample(char: string): Pattern {
  const strokes = SAMPLES[char];
  if (!strokes) throw new Error(`no sample for ${char}`);
  return strokes;
}

describe('offline recognizer (KanjiCanvas port)', () => {
  it.each(['一', '二', '十', '口', '人', '山', '待'])('finds %s in the top 3', (char) => {
    const rank = rankOf(char, sample(char));
    expect(rank).toBeGreaterThanOrEqual(0);
    expect(rank).toBeLessThan(3);
  });

  it('ignores stroke order (I4)', () => {
    const drawn = sample('待');
    const shuffled = [drawn[4], drawn[0], drawn[8], drawn[2], drawn[6], drawn[1], drawn[7]];
    const rest = [drawn[3], drawn[5]];
    const strokes = [...shuffled, ...rest].flatMap((s) => (s ? [s] : []));
    expect(recognizer.recognize(strokes, 1)[0]?.char).toBe('待');
    expect(recognizer.recognize([...drawn].reverse(), 1)[0]?.char).toBe('待');
  });

  it('ignores size and position', () => {
    const small = sample('十').map((s) => s.map(([x, y]) => [x / 3 + 10, y / 3 + 120] as const));
    expect(recognizer.recognize(small, 1)[0]?.char).toBe('十');
  });

  it('puts 待-like kanji after 待 for the mockup drawing', () => {
    const chars = recognizer.recognize(sample('待'), 5).map((c) => c.char);
    expect(chars[0]).toBe('待');
    expect(chars).toEqual(expect.arrayContaining(['侍', '時']));
  });

  it('returns nothing for no strokes, and scores in ascending order', () => {
    expect(recognizer.recognize([])).toEqual([]);
    expect(recognizer.recognize([[]])).toEqual([]);
    const scores = recognizer.recognize(sample('二')).map((c) => c.score);
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
  });
});

describe('patterns and stroke maps', () => {
  it('decodes base64 patterns with their stroke counts', () => {
    // 2 strokes of 2 and 1 points: bytes [2, 2, 1, x, y, x, y, x, y]
    const base64 = btoa(String.fromCharCode(2, 2, 1, 40, 50, 60, 50, 50, 40));
    const [ref] = decodePatterns({ scale: 2, offset: 80, patterns: { 二: base64 } });
    expect(ref?.strokes).toEqual([
      [
        [0, 20],
        [40, 20],
      ],
      [[20, 0]],
    ]);
    const chars = createRecognizer(ref ? [ref] : []).recognize([[[0, 0]], [[9, 9]]]);
    expect(chars.map((c) => c.char)).toEqual(['二']);
  });

  it('joins extra strokes onto a neighbour (M-N map)', () => {
    const two: Pattern = [
      [
        [0, 10],
        [60, 10],
      ],
      [
        [170, 10],
        [220, 10],
      ],
    ];
    const four: Pattern = [
      [
        [10, 15],
        [50, 15],
      ],
      [
        [50, 15],
        [60, 15],
      ],
      [
        [170, 15],
        [180, 15],
      ],
      [
        [180, 15],
        [220, 15],
      ],
    ];
    const map = completeMap(four, two, endPointDistance, getMap(four, two, endPointDistance));
    expect(map).toEqual([0, 0, 1, 1]);
  });
});
