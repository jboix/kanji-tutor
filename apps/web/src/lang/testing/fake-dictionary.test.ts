import { describe, expect, it } from 'vitest';
import { createFakeDictionary } from './fake-dictionary.ts';

describe('createFakeDictionary', () => {
  const dictionary = createFakeDictionary();

  it('looks words up by id, text and reading prefix', async () => {
    expect((await dictionary.word('1328000'))?.forms).toEqual(['手紙']);
    expect((await dictionary.words(['1328000', 'nope'])).map((w) => w?.id)).toEqual([
      '1328000',
      undefined,
    ]);
    expect((await dictionary.wordsByText('てがみ')).map((w) => w.id)).toEqual(['1328000']);
    const prefix = await dictionary.wordsByReadingPrefix('たべ', 10);
    expect(prefix.at(-1)?.common).toBe(false);
    expect(await dictionary.wordCount()).toBeGreaterThan(10);
  });

  it('looks kanji up by character, phonetic and component', async () => {
    expect((await dictionary.kanji('待'))?.kun).toEqual(['ま.つ']);
    expect((await dictionary.kanjiMany(['待', '龘'])).map((k) => k?.char)).toEqual([
      '待',
      undefined,
    ]);
    expect((await dictionary.kanjiByPhonetic('寺')).map((k) => k.char)).toEqual(['待', '持']);
    expect((await dictionary.kanjiByComponent('木')).map((k) => k.char)).toEqual(['本']);
  });
});
