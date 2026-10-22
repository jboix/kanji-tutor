import { describe, expect, it } from 'vitest';
import type { Token, Word } from '../domain/types.ts';
import { joinKanaWords, kanaSpans, kanaWordOf } from './kana-join.ts';
import { resolveTokens } from './resolve-tokens.ts';

const word = (id: string, readings: string[], pos = ['n'], common = true): Word => ({
  id,
  forms: [],
  readings,
  glosses: [id],
  common,
  pos,
});
const WAGAMAMA = word('1197020', ['わがまま'], ['adj-na', 'n']);
const CAKE = word('cake', ['チーズケーキ']);

let at = 0;
const tok = (surface: string, pos: string, wordId?: string): Token => {
  const token: Token = { surface, reading: surface, base: surface, pos, start: at };
  at += surface.length;
  return wordId ? { ...token, wordId } : token;
};
const tokens = (...list: [string, string][]) => {
  at = 0;
  return list.map(([surface, pos]) => tok(surface, pos));
};

describe('kana words the tokenizer splits', () => {
  it('lists the spans of two or three kana pieces, never particles or demonstratives', () => {
    const split = tokens(
      ['わが', 'adnominal'],
      ['まま', 'noun'],
      ['だ', 'auxiliary'],
      ['。', 'symbol'],
    );
    expect(kanaSpans(split)).toEqual(['わがまま']);
    const productive = tokens(['その', 'adnominal'], ['よう', 'noun'], ['に', 'particle']);
    expect(kanaSpans(productive)).toEqual([]);
    expect(kanaSpans(tokens(['で', 'particle'], ['は', 'particle']))).toEqual([]);
  });

  it('takes the one common entry read so that does not conjugate', () => {
    expect(kanaWordOf([WAGAMAMA], 'わがまま')).toBe(WAGAMAMA);
    expect(
      kanaWordOf([word('a', ['こうこう']), word('b', ['こうこう'])], 'こうこう'),
    ).toBeUndefined();
    expect(kanaWordOf([word('rare', ['わがまま'], ['n'], false)], 'わがまま')).toBeUndefined();
    expect(kanaWordOf([word('v', ['もたれる'], ['v1'])], 'もたれる')).toBeUndefined();
  });

  it('joins a found span into one noun token with its id and a hiragana reading', () => {
    const split = tokens(['チーズ', 'noun'], ['ケーキ', 'noun'], ['を', 'particle']);
    expect(joinKanaWords(split, new Map([['チーズケーキ', 'cake']]))).toEqual([
      {
        surface: 'チーズケーキ',
        reading: 'ちいずけえき',
        base: 'チーズケーキ',
        pos: 'noun',
        start: 0,
        wordId: 'cake',
      },
      split[2],
    ]);
  });

  it('joins at run time before resolving, so まま is not read as 儘', async () => {
    const mama = word('1585410', ['まま']);
    const lookup = async (text: string) =>
      ({ わがまま: [WAGAMAMA], まま: [mama], チーズケーキ: [CAKE] })[text] ?? [];
    const split = tokens(['わが', 'adnominal'], ['まま', 'noun'], ['だ', 'auxiliary']);
    const resolved = await resolveTokens(split, lookup);
    expect(resolved.map((t) => [t.surface, t.wordId])).toEqual([
      ['わがまま', WAGAMAMA.id],
      ['だ', undefined],
    ]);
  });
});
