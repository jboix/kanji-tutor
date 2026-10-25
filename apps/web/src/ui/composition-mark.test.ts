import { describe, expect, it } from 'vitest';
import type { KanjiCandidate } from '../domain/services/index.ts';
import { markParts } from './composition-mark.tsx';

const at = (form: string, kana: string, start: number): KanjiCandidate => ({
  form,
  kana,
  start,
  end: start + kana.length,
  runEnd: start + kana.length,
  wordId: form,
  known: false,
});

describe('markParts (C6)', () => {
  const text = 'これはがくせい';
  const candidates = [at('学生', 'がくせい', 3), at('性', 'せい', 5)];

  it('marks every kana the candidates cover, the highlighted one as selected', () => {
    expect(markParts(text, candidates, 0)).toEqual([
      { text: 'これは', kind: 'plain', start: 0 },
      { text: 'がくせい', kind: 'selected', start: 3 },
    ]);
    expect(markParts(text, candidates, 1)).toEqual([
      { text: 'これは', kind: 'plain', start: 0 },
      { text: 'がく', kind: 'pending', start: 3 },
      { text: 'せい', kind: 'selected', start: 5 },
    ]);
  });

  it('keeps the text after the segment plain, and marks nothing without a highlight', () => {
    expect(markParts(`${text}です`, candidates, 1).at(-1)).toEqual({
      text: 'です',
      kind: 'plain',
      start: 7,
    });
    expect(markParts(text, [], 0)).toEqual([{ text, kind: 'plain', start: 0 }]);
  });
});
