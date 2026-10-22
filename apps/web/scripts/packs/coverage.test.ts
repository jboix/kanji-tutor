import { describe, expect, it } from 'vitest';
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Sentence, Token, Word } from '../../src/domain/types.ts';
import { buildClusters } from './clusters.ts';
import { focusWords, selectWithCoverage } from './coverage.ts';
import { buildGrammarPack } from './grammar-pack.ts';
import { applyOverrides, inheritPolitePrefix } from './jlpt-overrides.ts';
import type { JmWord } from './jmdict.ts';
import { glossRecords, translationRecords } from './languages.ts';
import { sentenceLevel, uncoveredKanji } from './level.ts';
import { translationsFor } from './tatoeba.ts';
import { grammarIdFor } from './units.ts';

const LEVELS: Record<string, JlptLevel> = { a: 5, b: 5, c: 4, d: 4, e: 3 };
const wordLevel = (id: string) => LEVELS[id];

function token(wordId: string, surface = '漢', pos = 'noun'): Token {
  return { surface, reading: '', base: surface, pos, start: 0, wordId };
}

function sentence(ref: string, ids: string[], level: JlptLevel, extra: Partial<Sentence> = {}) {
  return {
    id: `tatoeba:${ref}`,
    text: '漢'.repeat(ids.length + (Number(ref) % 3)),
    source: 'tatoeba',
    sourceRef: ref,
    tokens: ids.map((id) => token(id)),
    wordIds: ids,
    level,
    grammarIds: [],
    verified: true,
    ...extra,
  } satisfies Sentence;
}

describe('sentence level', () => {
  const ctx = {
    wordLevel,
    kanjiLevel: (c: string) => (({ 駅: 5, 紹: 3 }) as Record<string, JlptLevel>)[c],
    grammarLevel: (id: string) => (id === 'wake' ? 3 : 5) as JlptLevel,
  };

  it('takes the hardest of kanji words, uncovered kanji and grammar; untagged counts as N1', () => {
    expect(sentenceLevel('駅', [token('a', '駅')], [], ctx)).toBe(5);
    expect(sentenceLevel('駅', [token('c', '駅')], [], ctx)).toBe(4);
    expect(sentenceLevel('駅', [token('a', '駅')], ['wake'], ctx)).toBe(3);
    expect(sentenceLevel('駅', [token('zz', '駅')], [], ctx)).toBe(1);
    expect(sentenceLevel('駅鬱', [token('a', '駅')], [], ctx)).toBe(1);
  });

  it('lets a word cover its own kanji: only kanji outside the counted words count', () => {
    expect(sentenceLevel('紹', [token('a', '紹')], [], ctx)).toBe(5);
    expect(uncoveredKanji('駅紹', [token('a', '駅'), token('zz', '紹', 'suffix')])).toEqual(['紹']);
    expect(sentenceLevel('駅紹', [token('a', '駅'), token('zz', '紹', 'suffix')], [], ctx)).toBe(3);
  });

  it('ignores kana words, suffixes and the iteration mark', () => {
    expect(sentenceLevel('駅', [token('a', '駅'), token('zz', 'すぐ')], [], ctx)).toBe(5);
    expect(sentenceLevel('駅', [token('a', '駅'), token('zz', '駅', 'suffix')], [], ctx)).toBe(5);
    expect(sentenceLevel('駅々', [token('a', '駅々')], [], ctx)).toBe(5);
  });
});

describe('coverage selection', () => {
  it('finds focus sentences: one word of the level, the others easier or kana', () => {
    expect(focusWords(sentence('1', ['a', 'b'], 5), wordLevel)).toEqual([]);
    expect(focusWords(sentence('1', ['a'], 5), wordLevel)).toEqual(['a']);
    expect(focusWords(sentence('2', ['a', 'c'], 4), wordLevel)).toEqual(['c']);
    expect(focusWords(sentence('3', ['c', 'd'], 4), wordLevel)).toEqual([]);
    expect(focusWords(sentence('4', ['e'], 1), wordLevel)).toEqual([]);
  });

  it('meets focus and grammar targets before filling up to the cap, deterministically', () => {
    const candidates = [
      sentence('1', ['a'], 5),
      sentence('2', ['a'], 5),
      sentence('3', ['a', 'c'], 4),
      sentence('4', ['e'], 3),
      sentence('5', ['b'], 5, { grammarIds: ['ka'] }),
      sentence('6', ['zz'], 1, { grammarIds: ['ka'] }),
    ];
    const options = {
      core: new Set(['a', 'b', 'c', 'e']),
      wordLevel,
      focusPerWord: 1,
      perGrammar: 1,
      perWord: 1,
      max: 4,
    };
    const kept = selectWithCoverage(candidates, options);
    expect(kept.map((s) => s.sourceRef)).toEqual(['1', '3', '4', '5']);
    expect(selectWithCoverage([...candidates].reverse(), options)).toEqual(kept);
  });
});

describe('coverage quotas and pinned sentences', () => {
  const base = {
    core: new Set(['a', 'b', 'c', 'd', 'e']),
    wordLevel,
    focusPerWord: 0,
    perGrammar: 0,
    perWord: 9,
  };

  it('fills each level up to its quota first, in the quota order, then the rest', () => {
    const candidates = [
      sentence('1', ['a'], 5),
      sentence('2', ['b'], 5),
      sentence('3', ['c'], 4),
      sentence('4', ['d'], 4),
      sentence('5', ['e'], 3),
      sentence('6', ['e'], 3),
    ];
    const quota = [
      [5, 1],
      [3, 2],
    ] as const;
    const kept = selectWithCoverage(candidates, { ...base, max: 4, quota });
    expect(kept.map((s) => s.sourceRef)).toEqual(['1', '2', '5', '6']);
  });

  it('keeps pinned sentences first, up to perPinned per key, even past the cap order', () => {
    const hard = sentence('9', ['zz'], 1);
    const pinned = new Map([['unit:zz', [hard, sentence('8', ['zz'], 1)]]]);
    const kept = selectWithCoverage([sentence('1', ['a'], 5), hard], {
      ...base,
      max: 1,
      pinned,
      perPinned: 1,
    });
    expect(kept.map((s) => s.sourceRef)).toEqual(['9']);
  });
});

describe('grammar pack', () => {
  it('lists every catalogue point with its easiest examples first', () => {
    const pack = buildGrammarPack([
      sentence('1', ['e'], 3, { grammarIds: ['desu'] }),
      sentence('2', ['a'], 5, { grammarIds: ['desu'] }),
    ]);
    const desu = pack.find((p) => p.id === 'desu');
    expect(desu).toMatchObject({ level: 5, catalogue: true });
    expect(desu?.exampleSentenceIds).toEqual(['tatoeba:2', 'tatoeba:1']);
  });

  it('maps unit grammar ids and patterns to catalogue ids', () => {
    expect(grammarIdFor('desu')).toBe('desu');
    expect(grammarIdFor('〜です')).toBe('desu');
    expect(grammarIdFor('〜not-a-point')).toBeUndefined();
  });
});

describe('clusters', () => {
  const word = (id: string, form: string, jlpt: JlptLevel): Word => ({
    id,
    forms: [form],
    readings: [],
    glosses: [],
    common: true,
    jlpt,
  });

  it('groups words of one level by shared kanji, named by the kanji', () => {
    const words = ['生', '生活', '学生', '先生', '生まれる', '一生', '人生'].map((f, i) =>
      word(String(i), f, 5),
    );
    const sentences = words.map((w, i) => ({
      ...sentence(String(i), [w.id], 5),
      tokens: [token(w.id, w.forms[0])],
    }));
    const [cluster] = buildClusters(words, sentences);
    expect(cluster).toMatchObject({ level: 5, name: '生', kanji: '生', order: 0 });
    expect(cluster?.wordIds).toHaveLength(7);
    expect(buildClusters(words, sentences)).toEqual(buildClusters(words, [...sentences].reverse()));
  });
});

describe('languages and overrides', () => {
  const jm = (id: string, kanji: string, kana: string, gloss: string, lang = 'fre'): JmWord => ({
    id,
    kanji: kanji ? [{ common: true, text: kanji, tags: [] }] : [],
    kana: [{ common: true, text: kana, tags: [] }],
    sense: [{ partOfSpeech: ['n'], misc: [], gloss: [{ lang, text: gloss }] }],
  });

  it('keeps glosses of pack words and lowest-id direct translations', () => {
    const dict = { version: '', dictDate: '', words: [jm('1', '駅', 'えき', 'gare')] };
    const words = [{ id: '1' }, { id: '2' }] as Word[];
    expect(glossRecords(dict, 'fre', words)).toEqual([{ id: '1', glosses: ['gare'] }]);
    const found = translationsFor(
      new Set(['10']),
      '30\tfra\tJ’attends.\n31\tfra\tB\n',
      '10\t31\n10\t30\n',
    );
    expect(found).toEqual(new Map([['10', 'J’attends.']]));
    const s = sentence('10', ['a'], 5);
    expect(translationRecords([s], found)).toEqual([{ id: 'tatoeba:10', text: 'J’attends.' }]);
  });

  it('overrides levels of basic words and gives fused polite forms their base level', () => {
    const words = [
      jm('1', '顔', 'かお', 'face', 'eng'),
      jm('2', '寺', 'てら', 't', 'eng'),
      jm('3', 'お寺', 'おてら', 't', 'eng'),
    ];
    const levels = new Map<string, JlptLevel | undefined>([['2', 4]]);
    const missing = applyOverrides(words, levels, [{ written: '顔', reading: 'かお', level: 5 }]);
    inheritPolitePrefix(words, levels, ['お寺']);
    expect(missing).toEqual([]);
    expect(levels.get('1')).toBe(5);
    expect(levels.get('3')).toBe(4);
  });
});
