import { describe, expect, it } from 'vitest';
import {
  grammarSearchText,
  jishoGrammarUrl,
  jishoKanjiUrl,
  jishoWordUrl,
  tatoebaSentenceUrl,
  wiktionaryKanjiUrl,
} from './external-links.ts';

describe('external links (R9)', () => {
  it('encodes a word for the Jisho search', () => {
    expect(jishoWordUrl('待つ')).toBe('https://jisho.org/search/%E5%BE%85%E3%81%A4');
    expect(jishoWordUrl(' a b&c ')).toBe('https://jisho.org/search/a%20b%26c');
  });

  it('tags a kanji search with #kanji, encoded', () => {
    expect(jishoKanjiUrl('生')).toBe('https://jisho.org/search/%E7%94%9F%20%23kanji');
  });

  it('links a kanji to its Wiktionary entry', () => {
    expect(wiktionaryKanjiUrl('生')).toBe('https://en.wiktionary.org/wiki/%E7%94%9F');
  });

  it('links a Tatoeba sentence by its id', () => {
    expect(tatoebaSentenceUrl('12345')).toBe('https://tatoeba.org/en/sentences/show/12345');
    expect(tatoebaSentenceUrl('1/2')).toBe('https://tatoeba.org/en/sentences/show/1%2F2');
  });

  it('searches a grammar pattern without 〜, by its first form', () => {
    expect(grammarSearchText('〜です')).toBe('です');
    expect(grammarSearchText('〜じゃない／ではありません')).toBe('じゃない');
    expect(grammarSearchText('〜ている (state)')).toBe('ている');
    expect(jishoGrammarUrl('〜ました')).toBe(jishoWordUrl('ました'));
  });
});
