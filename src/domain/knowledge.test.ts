import { describe, expect, it } from 'vitest';
import { alignReading, deriveKanjiReadings, type KnownWord, nextLevel } from './knowledge.ts';
import type { Grade, Item, Kanji, KnowledgeLevel, Word } from './types.ts';

/** Trimmed KANJIDIC2 entries (on in katakana, kun in hiragana with okurigana after "."). */
const ENTRIES: [string, string[], string[]][] = [
  ['学', ['ガク'], ['まな.ぶ']],
  ['生', ['セイ', 'ショウ'], ['い.きる', 'い.かす', 'う.まれる', 'は.える', 'なま', 'き', 'お.う']],
  ['校', ['コウ', 'キョウ'], []],
  ['人', ['ジン', 'ニン'], ['ひと', '-り', '-と']],
  ['今', ['コン', 'キン'], ['いま']],
  ['日', ['ニチ', 'ジツ'], ['ひ', '-び', '-か']],
  ['一', ['イチ', 'イツ'], ['ひと-', 'ひと.つ']],
  ['本', ['ホン'], ['もと']],
  ['受', ['ジュ'], ['う.ける', 'う.かる']],
  ['付', ['フ'], ['つ.ける', 'つ.く']],
  ['手', ['シュ', 'ズ'], ['て', 'て-', '-て', 'た-']],
  ['紙', ['シ'], ['かみ']],
  ['十', ['ジュウ', 'ジッ', 'ジュッ'], ['とお', 'と']],
  ['分', ['ブン', 'フン', 'ブ'], ['わ.ける', 'わ.かる']],
  ['女', ['ジョ', 'ニョウ'], ['おんな', 'め']],
  ['房', ['ボウ'], ['ふさ']],
  ['持', ['ジ'], ['も.つ']],
  ['待', ['タイ'], ['ま.つ']],
];

const KANJI: ReadonlyMap<string, Kanji> = new Map(
  ENTRIES.map(([char, on, kun]) => [char, { char, on, kun, meanings: [], components: [] }]),
);

const item = (level: KnowledgeLevel): Item => ({
  id: 'word:1206730',
  kind: 'word',
  ref: '1206730',
  level,
  source: { kind: 'manual', week: '2026-W42', addedAt: 0 },
  updatedAt: 0,
});

const grade = (verdict: Grade['verdict']): Grade => ({ verdict, expected: 'が', given: 'が' });

describe('nextLevel (K2)', () => {
  it.each([
    // level, verdict, newContext, next
    [0, 'correct', false, 1],
    [1, 'correct', false, 2],
    [2, 'correct', false, 3],
    [2, 'correct', true, 3],
    [3, 'correct', false, 3],
    [3, 'correct', true, 4],
    [4, 'correct', false, 4],
    [4, 'correct', true, 4],
    [0, 'near-miss', false, 1],
    [2, 'near-miss', true, 2],
    [3, 'near-miss', true, 3],
    [4, 'near-miss', false, 4],
    [0, 'wrong', false, 1],
    [1, 'wrong', false, 1],
    [2, 'wrong', false, 2],
    [3, 'wrong', false, 2],
    [4, 'wrong', true, 2],
  ] as const)('level %i, %s, new context %s → %i', (level, verdict, newContext, next) => {
    expect(nextLevel(item(level), grade(verdict), { newContext })).toBe(next);
  });
});

/** Compact view of an alignment: "学:がく(ガク)" for kanji, "きる" for kana. */
function show(form: string, reading: string): string[] {
  return alignReading(form, reading, KANJI).map((s) =>
    s.kanjiReading ? `${s.text}:${s.reading}(${s.kanjiReading})` : s.text,
  );
}

describe('alignReading', () => {
  it.each([
    ['学生', 'がくせい', ['学:がく(ガク)', '生:せい(セイ)']],
    ['学校', 'がっこう', ['学:がっ(ガク)', '校:こう(コウ)']],
    ['生きる', 'いきる', ['生:い(い.きる)', 'きる']],
    ['生きて', 'いきて', ['生:い(い.きる)', 'きて']],
    ['生まれる', 'うまれる', ['生:う(う.まれる)', 'まれる']],
    ['学ぶ', 'まなぶ', ['学:まな(まな.ぶ)', 'ぶ']],
    ['人々', 'ひとびと', ['人:ひと(ひと)', '々:びと(ひと)']],
    ['人生', 'じんせい', ['人:じん(ジン)', '生:せい(セイ)']],
    ['日本', 'にっぽん', ['日:にっ(ニチ)', '本:ぽん(ホン)']],
    ['一本', 'いっぽん', ['一:いっ(イチ)', '本:ぽん(ホン)']],
    ['手紙', 'てがみ', ['手:て(て)', '紙:がみ(かみ)']],
    ['受付', 'うけつけ', ['受:うけ(う.ける)', '付:つけ(つ.ける)']],
    ['十分', 'じゅうぶん', ['十:じゅう(ジュウ)', '分:ぶん(ブン)']],
    ['女房', 'にょうぼう', ['女:にょう(ニョウ)', '房:ぼう(ボウ)']],
    ['持って', 'もって', ['持:も(も.つ)', 'って']],
    ['生ビール', 'なまびーる', ['生:なま(なま)', 'ビール']],
    ['学生', 'ガクセイ', ['学:がく(ガク)', '生:せい(セイ)']],
  ])('%s / %s', (form, reading, expected) => {
    expect(show(form, reading)).toEqual(expected);
  });

  it('spells out the hiragana reading of each segment', () => {
    expect(alignReading('生きる', 'いきる', KANJI)).toEqual([
      { text: '生', reading: 'い', kanjiReading: 'い.きる', kanji: '生' },
      { text: 'きる', reading: 'きる' },
    ]);
  });

  it('credits 々 to the kanji it repeats', () => {
    expect(alignReading('人々', 'ひとびと', KANJI)[1]?.kanji).toBe('人');
  });

  it.each([
    ['今日', 'きょう'],
    ['大人', 'おとな'],
    ['学生', 'がくせん'],
    ['生きる', 'いきろ'],
  ])('falls back to one unaligned segment for %s / %s', (form, reading) => {
    expect(alignReading(form, reading, KANJI)).toEqual([{ text: form, reading }]);
  });
});

const word = (id: string, forms: string[], readings: string[]): Word => ({
  id,
  forms,
  readings,
  glosses: [],
  common: true,
});

const GAKUSEI = word('1206900', ['学生'], ['がくせい']);
const IKIRU = word('1587020', ['生きる'], ['いきる']);
const SENSEI_LIKE = word('1387990', ['先生'], ['せんせい']);
const GAKKOU = word('1206730', ['学校'], ['がっこう']);
const KYOU = word('1579110', ['今日'], ['きょう', 'こんにち']);
const HITOBITO = word('1500650', ['人々', '人びと'], ['ひとびと']);
const SURU = word('1157170', [], ['する']);

describe('deriveKanjiReadings (K3)', () => {
  const derive = (words: KnownWord[]) => deriveKanjiReadings(words, KANJI);

  it('reading 学生 proves 生:セイ but not 生:い.きる', () => {
    const readings = derive([{ word: GAKUSEI, level: 3 }]);
    expect(readings.map((r) => r.id)).toEqual(['学:ガク', '生:セイ']);
    expect(readings[1]).toEqual({
      id: '生:セイ',
      kanji: '生',
      reading: 'セイ',
      level: 3,
      wordIds: ['1206900'],
    });
  });

  it('takes the best level among the words that prove a reading', () => {
    const readings = derive([
      { word: GAKUSEI, level: 2 },
      { word: GAKKOU, level: 4 },
      { word: IKIRU, level: 1 },
    ]);
    expect(readings.map((r) => [r.id, r.level, r.wordIds])).toEqual([
      ['学:ガク', 4, ['1206900', '1206730']],
      ['校:コウ', 4, ['1206730']],
      ['生:い.きる', 1, ['1587020']],
      ['生:セイ', 2, ['1206900']],
    ]);
  });

  it('uses only the primary reading and credits every written form once', () => {
    const readings = derive([
      { word: KYOU, level: 3 },
      { word: HITOBITO, level: 3 },
    ]);
    expect(readings.map((r) => [r.id, r.wordIds])).toEqual([['人:ひと', ['1500650']]]);
  });

  it('ignores unseen words, kana-only words and kanji missing from the dictionary', () => {
    expect(
      derive([
        { word: GAKUSEI, level: 0 },
        { word: SURU, level: 4 },
        { word: SENSEI_LIKE, level: 4 },
      ]),
    ).toEqual([]);
  });
});
