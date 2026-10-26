import { afterEach, describe, expect, it } from 'vitest';
import type { Word } from '../domain/types.ts';
import { KanjiTutorDb } from './db.ts';
import { dexieDictionary, toWordRow } from './dictionary.ts';

const words: Word[] = [
  { id: '1', forms: ['駅'], readings: ['えき'], glosses: ['station'], common: true, jlpt: 5 },
  { id: '2', forms: ['紹介'], readings: ['しょうかい'], glosses: ['intro'], common: true, jlpt: 3 },
  { id: '3', forms: [], readings: ['コーヒー'], glosses: ['coffee'], common: true },
];

let db: KanjiTutorDb;

afterEach(async () => {
  await db.delete();
});

describe('dexie dictionary', () => {
  it('finds words by JLPT level and by reading prefix in either kana', async () => {
    db = new KanjiTutorDb('dictionary-test');
    await db.words.bulkPut(words.map(toWordRow));
    const dictionary = dexieDictionary(db);
    expect((await dictionary.wordsByJlpt?.(5))?.map((word) => word.id)).toEqual(['1']);
    expect((await dictionary.wordsByReadingPrefix('コー', 5)).map((word) => word.id)).toEqual([
      '3',
    ]);
    expect(await dictionary.word('2')).toEqual(words[1]);
  });

  it('finds kanji by JLPT level', async () => {
    db = new KanjiTutorDb('dictionary-kanji-test');
    await db.kanji.bulkPut([
      { char: '駅', meanings: ['station'], on: ['エキ'], kun: [], components: [], jlpt: 4 },
      { char: '本', meanings: ['book'], on: ['ホン'], kun: [], components: [], jlpt: 5 },
      { char: '紹', meanings: ['introduce'], on: ['ショウ'], kun: [], components: [] },
    ]);
    const kanji = await dexieDictionary(db).kanjiByJlpt?.(5);
    expect(kanji?.map((entry) => entry.char)).toEqual(['本']);
  });

  it('finds a word by a written form or a reading in either kana, once', async () => {
    db = new KanjiTutorDb('dictionary-text-test');
    const both: Word = { id: '4', forms: ['えき'], readings: ['えき'], glosses: [], common: false };
    await db.words.bulkPut([...words, both].map(toWordRow));
    const dictionary = dexieDictionary(db);
    expect((await dictionary.wordsByText('駅')).map((word) => word.id)).toEqual(['1']);
    expect((await dictionary.wordsByText('エキ')).map((word) => word.id)).toEqual(['1', '4']);
    expect((await dictionary.wordsByText('えき')).map((word) => word.id)).toEqual(['1', '4']);
  });
});
