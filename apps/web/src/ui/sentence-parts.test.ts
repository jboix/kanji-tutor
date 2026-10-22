import { describe, expect, it } from 'vitest';
import type { Token } from '../domain/types.ts';
import { groupParts, sentenceParts } from './sentence-parts.ts';

const token = (surface: string, start: number): Token => ({
  surface,
  reading: surface,
  base: surface,
  pos: 'noun',
  start,
});

describe('sentenceParts', () => {
  it('keeps text between and after tokens, in text order', () => {
    const parts = sentenceParts('本 を読む。', [token('読む', 3), token('本', 0)]);
    expect(parts).toEqual([
      { kind: 'token', index: 1 },
      { kind: 'text', text: ' を', start: 1 },
      { kind: 'token', index: 0 },
      { kind: 'text', text: '。', start: 5 },
    ]);
  });

  it('returns one text part when there are no tokens', () => {
    expect(sentenceParts('本', [])).toEqual([{ kind: 'text', text: '本', start: 0 }]);
  });
});

describe('groupParts', () => {
  const tokens = [token('間', 0), token('に', 1), token('、', 2), token('本', 3)];
  const parts = sentenceParts('間に、本', tokens);

  it('keeps closing punctuation with the token before it', () => {
    const groups = groupParts(parts, tokens);
    expect(groups.map((g) => [g.parts.length, g.trailing.length])).toEqual([
      [1, 0],
      [1, 1],
      [1, 0],
    ]);
  });

  it('joins adjacent target tokens into one run', () => {
    const groups = groupParts(parts, tokens, [0, 1]);
    expect(groups[0]).toMatchObject({ target: true, trailing: [{ kind: 'token', index: 2 }] });
    expect(groups[0]?.parts).toHaveLength(2);
    expect(groups[1]).toMatchObject({ target: false });
  });
});
