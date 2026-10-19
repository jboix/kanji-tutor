import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { kanaWordsOf, tokenizeAround } from './kana-words.ts';
import { buildTokenizer, type Tokenize } from './tokenizer.ts';

const ROOT = resolve(import.meta.dirname, '..', '..');
let tokenize: Tokenize;
beforeAll(async () => {
  tokenize = await buildTokenizer(ROOT);
}, 60_000);

const words = (...written: string[]) => ({
  words: written.map((w) => ({ written: w, reading: w })),
});
const surfaces = (t: Tokenize, text: string) => t(text).map((r) => r.surface_form);

describe('kana unit words (T8)', () => {
  it('keeps kana nouns, longest first, and leaves kana verbs and short words to kuromoji', () => {
    const unit = words('じゅく', 'しんかんせん', 'もえる', 'しか', '学生');
    expect(kanaWordsOf(unit, tokenize)).toEqual(['しんかんせん', 'じゅく']);
  });

  it('tokenizes a kana noun as one noun, with the particles around it parsed as before', () => {
    const t = tokenizeAround(tokenize, ['じゅく']);
    expect(surfaces(t, '毎日じゅくに行きます。')).toEqual([
      '毎日',
      'じゅく',
      'に',
      '行き',
      'ます',
      '。',
    ]);
    const [, noun] = t('毎日じゅくに行きます。');
    expect(noun).toMatchObject({ pos: '名詞', basic_form: 'じゅく', reading: 'ジュク' });
  });

  it('changes nothing when no word is written', () => {
    const t = tokenizeAround(tokenize, ['じゅく']);
    expect(t('学校に行きます。')).toEqual(tokenize('学校に行きます。'));
    expect(tokenizeAround(tokenize, [])).toBe(tokenize);
  });
});
