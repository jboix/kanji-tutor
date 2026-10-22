/**
 * In-memory `DictionaryRepo` for tests in any workstream, seeded with a few JMdict- and
 * KANJIDIC2-like entries (readings as in JMdict; ids are illustrative). Pass your own entries to
 * replace them.
 */
import type { DictionaryRepo } from '../../domain/repos.ts';
import type { Kanji, Word } from '../../domain/types.ts';

function word(
  id: string,
  forms: string[],
  readings: string[],
  glosses: string[],
  extra: Partial<Word> = {},
): Word {
  return { id, forms, readings, glosses, common: true, ...extra };
}

/** Seed words: N5–N3 vocabulary used by the lang tests, plus a few kana-only and rare ones. */
export const SAMPLE_WORDS: readonly Word[] = [
  word('1175880', ['駅'], ['えき'], ['station'], { jlpt: 5, pos: ['n'] }),
  word('1430570', ['友達'], ['ともだち'], ['friend'], { jlpt: 5, pos: ['n'] }),
  word('1407980', ['待つ'], ['まつ'], ['to wait'], { jlpt: 5, pos: ['v5t'] }),
  word('1196010', ['間'], ['あいだ', 'ま', 'かん'], ['space', 'interval'], { pos: ['n'] }),
  word('1522150', ['本'], ['ほん'], ['book'], { jlpt: 5, pos: ['n'] }),
  word('1557080', ['読む'], ['よむ'], ['to read'], { jlpt: 5, pos: ['v5m'] }),
  word('1074950', ['紹介'], ['しょうかい'], ['introduction'], { jlpt: 3, pos: ['n', 'vs'] }),
  word('1162390', ['一生'], ['いっしょう'], ['whole life'], { jlpt: 3, pos: ['n'] }),
  word('1163400', ['一緒'], ['いっしょ'], ['together'], { jlpt: 4, pos: ['n'] }),
  word('1328000', ['手紙'], ['てがみ'], ['letter'], { jlpt: 5, pos: ['n'] }),
  word('1580930', ['人々', '人びと'], ['ひとびと'], ['people'], { jlpt: 3, pos: ['n'] }),
  word('1158190', ['行う'], ['おこなう'], ['to perform'], { jlpt: 3, pos: ['v5u'] }),
  word('1578850', ['行く', '往く'], ['いく', 'ゆく'], ['to go'], { jlpt: 5, pos: ['v5k-s'] }),
  word('1579130', ['今日'], ['きょう', 'こんにち'], ['today'], { jlpt: 5, pos: ['n'] }),
  word('1037590', [], ['コーヒー'], ['coffee'], { jlpt: 5, pos: ['n'] }),
  word('1188380', ['何'], ['なに', 'なん'], ['what'], { jlpt: 5, pos: ['pn'] }),
  word('1358280', ['食べる'], ['たべる'], ['to eat'], { jlpt: 5, pos: ['v1'] }),
  word('1358300', ['食べ物'], ['たべもの'], ['food'], { jlpt: 5, pos: ['n'] }),
  word('2029110', [], ['たべっこ'], ['(rare test entry)'], { common: false }),
  word('1310640', ['持つ'], ['もつ'], ['to hold'], { jlpt: 5, pos: ['v5t'] }),
  word('1416170', ['大人'], ['おとな'], ['adult'], { jlpt: 5, pos: ['n'] }),
  // R10: にほんじん is the usual reading, にっぽんじん a valid, less common variant.
  word('1464530', ['日本人'], ['にほんじん', 'にっぽんじん'], ['Japanese person'], {
    jlpt: 5,
    pos: ['n'],
    variants: ['にっぽんじん'],
  }),
];

/** Seed kanji. */
export const SAMPLE_KANJI: readonly Kanji[] = [
  {
    char: '待',
    meanings: ['wait', 'depend on'],
    on: ['タイ'],
    kun: ['ま.つ'],
    strokes: 9,
    grade: 3,
    jlpt: 4,
    components: ['彳', '寺'],
    phonetic: '寺',
  },
  {
    char: '持',
    meanings: ['hold', 'have'],
    on: ['ジ'],
    kun: ['も.つ'],
    strokes: 9,
    grade: 3,
    jlpt: 4,
    components: ['扌', '寺'],
    phonetic: '寺',
  },
  { char: '本', meanings: ['book', 'origin'], on: ['ホン'], kun: ['もと'], components: ['木'] },
];

function hasText(entry: Word, text: string): boolean {
  return entry.forms.includes(text) || entry.readings.includes(text);
}

/** Creates an in-memory dictionary over `words` and `kanji`. */
export function createFakeDictionary(
  words: readonly Word[] = SAMPLE_WORDS,
  kanji: readonly Kanji[] = SAMPLE_KANJI,
): DictionaryRepo {
  const byId = new Map(words.map((entry) => [entry.id, entry]));
  const byChar = new Map(kanji.map((entry) => [entry.char, entry]));
  const commonFirst = (a: Word, b: Word) => Number(b.common) - Number(a.common);
  return {
    word: async (id) => byId.get(id),
    words: async (ids) => ids.map((id) => byId.get(id)),
    wordsByText: async (text) => words.filter((entry) => hasText(entry, text)),
    wordsByReadingPrefix: async (kana, limit) =>
      words
        .filter((entry) => entry.readings.some((reading) => reading.startsWith(kana)))
        .sort(commonFirst)
        .slice(0, limit),
    kanji: async (char) => byChar.get(char),
    kanjiMany: async (chars) => chars.map((char) => byChar.get(char)),
    kanjiByPhonetic: async (component) => kanji.filter((entry) => entry.phonetic === component),
    kanjiByComponent: async (component) =>
      kanji.filter((entry) => entry.components.includes(component)),
    wordCount: async () => words.length,
  };
}
