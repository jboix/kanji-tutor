import { describe, expect, it } from 'vitest';
import type { Token, Word } from '../domain/types.ts';
import { preferReading, resolveTokens } from './resolve-tokens.ts';

const nihonjin: Word = {
  id: '1464700',
  forms: ['日本人'],
  readings: ['にほんじん', 'にっぽんじん'],
  glosses: ['Japanese person'],
  common: true,
  variants: ['にっぽんじん'],
};
const kyou: Word = {
  id: '1579110',
  forms: ['今日'],
  readings: ['きょう', 'こんにち'],
  glosses: ['today'],
  common: true,
};
const token = (surface: string, reading: string): Token => ({
  surface,
  reading,
  base: surface,
  pos: 'noun',
  start: 0,
});

describe('preferred readings at run time (D56)', () => {
  it('reads a tokenizer variant as the preferred reading and keeps the variants', () => {
    expect(preferReading(token('日本人', 'ニッポンジン'), nihonjin)).toMatchObject({
      reading: 'にほんじん',
      variants: ['にっぽんじん'],
    });
  });

  it('leaves readings with a sense of their own and unlisted ones alone', () => {
    const konnichi = token('今日', 'こんにち');
    expect(preferReading(konnichi, kyou)).toBe(konnichi);
    const other = token('日本人', 'やまとびと');
    expect(preferReading(other, nihonjin)).toBe(other);
  });

  it('applies when resolving tokens', async () => {
    const [resolved] = await resolveTokens([token('日本人', 'にっぽんじん')], async () => [
      nihonjin,
    ]);
    expect(resolved).toMatchObject({ wordId: '1464700', reading: 'にほんじん' });
  });
});
