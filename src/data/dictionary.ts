import { toHiragana } from 'wanakana';
import type { DictionaryRepo } from '../domain/repos.ts';
import type { Word } from '../domain/types.ts';
import type { KanjiReaderDb, WordRow } from './db.ts';

/** Drops the search-only `kana` field from a stored row. */
function toWord(row: WordRow | undefined): Word | undefined {
  if (!row) return undefined;
  const { kana: _kana, ...word } = row;
  return word;
}

function byCommonness(a: WordRow, b: WordRow): number {
  return Number(b.common) - Number(a.common) || (a.kana[0]?.length ?? 0) - (b.kana[0]?.length ?? 0);
}

/** Kanji lookups over the `kanji` table. */
function kanjiLookups(db: KanjiReaderDb) {
  return {
    kanji: (char: string) => db.kanji.get(char),
    kanjiMany: (chars: readonly string[]) => db.kanji.bulkGet([...chars]),
    kanjiByPhonetic: (component: string) => db.kanji.where('phonetic').equals(component).toArray(),
    kanjiByComponent: (component: string) =>
      db.kanji.where('components').equals(component).toArray(),
    kanjiByJlpt: (level: 5 | 4 | 3 | 2 | 1) => db.kanji.where('jlpt').equals(level).toArray(),
  };
}

/** Dictionary packs over Dexie. */
export function dexieDictionary(db: KanjiReaderDb): DictionaryRepo {
  return {
    word: async (id) => toWord(await db.words.get(id)),
    words: async (ids) => (await db.words.bulkGet([...ids])).map(toWord),
    wordsByText: async (text) => {
      const kana = toHiragana(text, { passRomaji: true });
      const rows = await db.words.where('forms').equals(text).or('kana').equals(kana).toArray();
      return rows.sort(byCommonness).flatMap((row) => toWord(row) ?? []);
    },
    wordsByReadingPrefix: async (kana, limit) => {
      const prefix = toHiragana(kana, { passRomaji: true });
      const rows = await db.words
        .where('kana')
        .startsWith(prefix)
        .limit(limit * 4)
        .toArray();
      const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
      return unique
        .sort(byCommonness)
        .slice(0, limit)
        .flatMap((row) => toWord(row) ?? []);
    },
    ...kanjiLookups(db),
    wordsByJlpt: async (level) =>
      (await db.words.where('jlpt').equals(level).toArray()).flatMap((row) => toWord(row) ?? []),
    wordCount: () => db.words.count(),
  };
}

/** Folds a word's readings to hiragana for the `kana` index. */
export function toWordRow(word: Word): WordRow {
  return { ...word, kana: word.readings.map((reading) => toHiragana(reading)) };
}
