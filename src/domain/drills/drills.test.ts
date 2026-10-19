import { describe, expect, it } from 'vitest';
import { K, S, W } from '../../test/reading-fixtures.ts';
import type { WordLevels } from '../session-types.ts';
import type {
  GrammarPoint,
  Kanji,
  KanjiReading,
  KnowledgeLevel,
  Sentence,
  Word,
} from '../types.ts';
import { blankText, KANJI_BLANK, PATTERN_BLANK } from './blank.ts';
import { clozeDrill, patternText } from './cloze.ts';
import { familyDrill } from './family.ts';
import { lookalikeDrill } from './lookalike.ts';
import { drillCount, drillKinds, interleave } from './mix.ts';
import { readingsDrill } from './readings.ts';
import { seededOrder } from './seed.ts';

const kanji = (char: string): Kanji => {
  const entry = K.find((k) => k.char === char);
  if (!entry) throw new Error(`no fixture kanji ${char}`);
  return entry;
};

const levels = (pairs: [Word, KnowledgeLevel][]): WordLevels =>
  new Map(pairs.map(([word, level]) => [word.id, level]));

/** Everyone in S.waiting known: 駅 友達 待つ 間 本 読む. */
const allKnown = levels([
  [W.eki, 3],
  [W.tomodachi, 3],
  [W.matsu, 3],
  [W.aida, 3],
  [W.hon, 3],
  [W.yomu, 3],
]);

describe('seededOrder', () => {
  it('is stable for a seed and keeps every value', () => {
    const values = ['a', 'b', 'c', 'd', 'e'];
    const once = seededOrder(values, (v) => v, 'x');
    expect(seededOrder(values, (v) => v, 'x')).toEqual(once);
    expect([...once].sort()).toEqual(values);
  });
});

describe('blankText', () => {
  it('blanks one kanji inside a token and keeps the okurigana and offsets', () => {
    const at = S.waiting.text.indexOf('待');
    const blanked = blankText(S.waiting, at, at + 1, KANJI_BLANK);
    expect(blanked.text).toBe(S.waiting.text.replace('待', KANJI_BLANK));
    expect(blanked.tokens[blanked.blank]?.surface).toBe(KANJI_BLANK);
    expect(blanked.tokens[blanked.blank + 1]).toMatchObject({ surface: 'っ', start: at + 1 });
    for (const token of blanked.tokens) {
      expect(blanked.text.slice(token.start, token.start + token.surface.length)).toBe(
        token.surface,
      );
    }
  });

  it('replaces a longer range with a fixed blank and shifts what follows', () => {
    const blanked = blankText(S.waiting, 5, 9, PATTERN_BLANK);
    expect(blanked.text).toBe(`駅で友達を${PATTERN_BLANK}${S.waiting.text.slice(9)}`);
    const last = blanked.tokens.at(-1);
    expect(last && blanked.text.slice(last.start)).toBe('。');
  });
});

describe('lookalikeDrill', () => {
  const pair = { kanji: kanji('待'), lookalike: kanji('持'), confused: true };

  it.each([
    ['all words known', allKnown, true],
    [
      'the blanked word is the only unknown',
      levels([
        [W.eki, 3],
        [W.tomodachi, 3],
        [W.aida, 3],
        [W.hon, 3],
        [W.yomu, 3],
      ]),
      true,
    ],
    [
      'another word is unknown too',
      levels([
        [W.eki, 3],
        [W.matsu, 3],
        [W.aida, 3],
        [W.hon, 3],
        [W.yomu, 3],
      ]),
      false,
    ],
  ] as const)('%s', (_, known, ok) => {
    const drill = lookalikeDrill({
      pairs: [pair],
      sentences: [S.waiting],
      levels: known,
      seed: 'd',
    });
    expect(drill !== undefined).toBe(ok);
  });

  it('blanks 待 in 待っ with both kanji as choices and their readings', () => {
    const drill = lookalikeDrill({
      pairs: [pair],
      sentences: [S.waiting, S.student],
      levels: allKnown,
      seed: 'd',
    });
    expect(drill).toMatchObject({
      kind: 'lookalike',
      answer: '待',
      wordId: W.matsu.id,
      itemId: `word:${W.matsu.id}`,
      at: S.waiting.text.indexOf('待'),
      confused: true,
    });
    expect(drill?.choices.map((c) => c.char).sort()).toEqual(['待', '持']);
    expect(drill?.choices.find((c) => c.char === '持')?.readings).toEqual(['ジ', 'も.つ']);
  });

  it('tries pairs in order and skips a pair no sentence carries', () => {
    const none = { kanji: kanji('時'), lookalike: kanji('持'), confused: true };
    const drill = lookalikeDrill({
      pairs: [none, { ...pair, confused: false }],
      sentences: [S.waiting],
      levels: allKnown,
      seed: 'd',
    });
    expect(drill?.answer).toBe('待');
    expect(drill?.confused).toBe(false);
  });

  it('is undefined when the lookalike is in the sentence too, or the pair is one kanji', () => {
    const both: Sentence = { ...S.waiting, id: 'both', text: `${S.waiting.text}持` };
    const same = { kanji: kanji('待'), lookalike: kanji('待'), confused: false };
    expect(
      lookalikeDrill({ pairs: [pair], sentences: [both], levels: allKnown, seed: 'd' }),
    ).toBeUndefined();
    expect(
      lookalikeDrill({ pairs: [same], sentences: [S.waiting], levels: allKnown, seed: 'd' }),
    ).toBeUndefined();
  });
});

const row = (id: string, level: KnowledgeLevel, wordIds: string[]): KanjiReading => {
  const [char = '', reading = ''] = id.split(':');
  return { id, kanji: char, reading, level, wordIds };
};

const words = new Map([W.gakusei, W.ikiru, W.issho, W.sensei].map((w) => [w.id, w]));

describe('readingsDrill', () => {
  const known = levels([
    [W.gakusei, 3],
    [W.ikiru, 3],
    [W.issho, 3],
    [W.sensei, 4],
  ]);

  it('picks one known word per reading of 生, learning readings first', () => {
    const rows = [
      row('生:セイ', 4, [W.gakusei.id, W.sensei.id]),
      row('生:い.きる', 3, [W.ikiru.id]),
      row('生:ショウ', 2, [W.issho.id]),
    ];
    const drill = readingsDrill({ kanji: '生', rows, words, levels: known, seed: 'd' });
    const order = drill?.items.map((i) => i.kanjiReading) ?? [];
    expect(order.slice(0, 2).sort()).toEqual(['い.きる', 'ショウ']);
    expect(order[2]).toBe('セイ');
    expect(drill?.items.find((i) => i.form === '一生')).toMatchObject({
      readings: ['いっしょう'],
      itemId: `word:${W.issho.id}`,
    });
  });

  it.each([
    ['one reading only', [row('生:セイ', 3, [W.gakusei.id])]],
    [
      'every reading solid',
      [row('生:セイ', 4, [W.gakusei.id]), row('生:い.きる', 4, [W.ikiru.id])],
    ],
    ['a word never met', [row('生:セイ', 3, [W.gakusei.id]), row('生:い.きる', 3, ['999'])]],
  ])('is undefined with %s', (_, rows) => {
    expect(readingsDrill({ kanji: '生', rows, words, levels: known, seed: 'd' })).toBeUndefined();
  });

  it('keeps at most four words', () => {
    const many = ['セイ', 'ショウ', 'い.きる', 'う.まれる', 'なま'].map((r, i) =>
      row(`生:${r}`, 3, [String(100 + i)]),
    );
    const forms = new Map(
      many.map((_, i) => [
        String(100 + i),
        { ...W.gakusei, id: String(100 + i), forms: [`生${i}`] },
      ]),
    );
    const met = new Map([...forms.keys()].map((id) => [id, 3 as KnowledgeLevel]));
    expect(
      readingsDrill({ kanji: '生', rows: many, words: forms, levels: met, seed: 'd' })?.items,
    ).toHaveLength(4);
  });
});

describe('familyDrill', () => {
  const members = [kanji('生'), kanji('星'), kanji('性')];
  const on = (pairs: [string, string[]][]) => new Map(pairs.map(([c, r]) => [c, new Set(r)]));

  it('asks for the on reading of the member not read yet, from two known members', () => {
    const solo = new Map([['性', [{ ...W.gakusei, forms: ['性'], readings: ['せい'] }]]]);
    const drill = familyDrill({
      part: '生',
      members,
      knownOn: on([
        ['生', ['セイ']],
        ['星', ['セイ']],
      ]),
      solo,
      seed: 'd',
    });
    expect(drill).toMatchObject({
      kind: 'family',
      part: '生',
      sound: 'セイ',
      known: ['生', '星'],
      guess: '性',
      itemId: 'kanjiReading:性:セイ',
      accepted: ['せい', 'しょう'],
      word: { form: '性', reading: 'せい' },
    });
  });

  it.each([
    ['only one member is known', on([['生', ['セイ']]])],
    [
      'every member is read already',
      on([
        ['生', ['セイ']],
        ['星', ['セイ']],
        ['性', ['ショウ']],
      ]),
    ],
  ])('is undefined when %s', (_, knownOn) => {
    expect(familyDrill({ part: '生', members, knownOn, seed: 'd' })).toBeUndefined();
  });

  it('is undefined for a family without on readings, and leaves out a word it cannot confirm', () => {
    expect(familyDrill({ part: '寺', members: [], knownOn: new Map(), seed: 'd' })).toBeUndefined();
    const drill = familyDrill({
      part: '生',
      members,
      knownOn: on([
        ['生', ['セイ']],
        ['星', ['セイ']],
      ]),
      seed: 'd',
    });
    expect(drill?.word).toBeUndefined();
  });
});

const point = (id: string, pattern: string): GrammarPoint => ({
  id,
  pattern,
  meaning: `meaning of ${id}`,
  lesson: 'L4',
  exampleSentenceIds: [],
});

describe('clozeDrill', () => {
  const points = [
    point('ている', '〜ている'),
    point('ことにする', '〜ことにする'),
    point('ば〜ほど', '〜ば〜ほど'),
    point('ながら', '〜ながら'),
  ];

  it('blanks a pattern the sentence writes out, with two other patterns of the lesson', () => {
    const drill = clozeDrill({ points, sentences: [S.waiting], levels: allKnown, seed: 'd' });
    expect(drill).toMatchObject({
      kind: 'cloze',
      grammarId: 'ている',
      itemId: 'grammar:ている',
      start: 7,
      end: 10,
    });
    expect(S.waiting.text.slice(drill?.start, drill?.end)).toBe('ている');
    expect(drill?.choices.map((c) => c.pattern).sort()).toEqual(['ことにする', 'ている', 'ながら']);
  });

  it('is undefined with an unknown word in the sentence, one pattern only, or nothing to blank', () => {
    const unknown = levels([[W.eki, 3]]);
    expect(
      clozeDrill({ points, sentences: [S.waiting], levels: unknown, seed: 'd' }),
    ).toBeUndefined();
    expect(
      clozeDrill({
        points: [point('ている', '〜ている')],
        sentences: [S.waiting],
        levels: allKnown,
        seed: 'd',
      }),
    ).toBeUndefined();
    expect(
      clozeDrill({
        points,
        sentences: [S.waiting],
        levels: allKnown,
        exclude: new Set(['ている']),
        seed: 'd',
      }),
    ).toBeUndefined();
  });

  it('prefers planned points and tagged sentences', () => {
    const tagged: Sentence = { ...S.waiting, id: 'tagged', grammarIds: ['ている'] };
    const drill = clozeDrill({
      points,
      prefer: ['ている'],
      sentences: [S.waiting, tagged],
      levels: allKnown,
      seed: 'd',
    });
    expect(drill?.sentence.id).toBe('tagged');
  });

  it('reads a pattern without its 〜 and drops split patterns', () => {
    expect(patternText('〜 わけ ではない')).toBe('わけではない');
    expect(patternText('〜ば〜ほど')).toBe('');
  });
});

describe('mix rules', () => {
  it.each([
    [20, 0.1, 2],
    [8, 0.1, 0],
    [0, 0.5, 0],
    [5, 0.5, 5],
    [5, 0.9, 5],
    [10, 0, 0],
    [10, -1, 0],
    [12, 0.25, 4],
  ])('%i sentences at %f get %i drills', (cards, share, drills) => {
    expect(drillCount(cards, share)).toBe(drills);
  });

  it('never starts with a drill and never puts two in a row', () => {
    const reading = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10'];
    expect(interleave(reading, ['d1', 'd2'])).toEqual([
      'r1',
      'r2',
      'r3',
      'd1',
      'r4',
      'r5',
      'r6',
      'd2',
      'r7',
      'r8',
      'r9',
      'r10',
    ]);
    expect(interleave(['r1', 'r2'], ['d1', 'd2', 'd3'])).toEqual(['r1', 'd1', 'r2', 'd2']);
    expect(interleave([], ['d1'])).toEqual([]);
  });

  it('puts the kind of the most frequent recent mistake first', () => {
    const none = { errors: {}, clozeMisses: 0, focus: {}, grammarFocus: false };
    expect(drillKinds(none)).toEqual(['lookalike', 'readings', 'cloze', 'family']);
    expect(drillKinds({ ...none, errors: { 'long-vowel': 3 } })[0]).toBe('readings');
    expect(drillKinds({ ...none, errors: { 'long-vowel': 3, 'wrong-kanji': 2 } })[0]).toBe(
      'lookalike',
    );
    expect(drillKinds({ ...none, grammarFocus: true })[0]).toBe('cloze');
    expect(drillKinds({ ...none, focus: { sokuon: 0.3 } })[0]).toBe('readings');
  });
});
