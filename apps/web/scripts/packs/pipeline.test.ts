import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { Kanji } from '../../src/domain/types.ts';
import { joinCompounds } from './compounds.ts';
import { chunk, contentHash, emit } from './emit.ts';
import { buildLookup, type JmWord, toWord, usualKanjiForm } from './jmdict.ts';
import {
  assignPhonetics,
  componentsOf,
  kanjiJlpt,
  partCandidates,
  toKanji,
  unvoice,
  vocabularyKanjiLevels,
} from './kanji.ts';
import { dedupe, fitsLevelLength, keepText, toSentence } from './select.ts';
import { pairSentences } from './tatoeba.ts';
import { baseReading, coarsePos, mapTokens, type RawToken, verbClass } from './tokens.ts';

function jm(id: string, kanji: string[], kana: string[], pos: string[], misc: string[] = []) {
  const text = (t: string) => ({ common: true, text: t, tags: [] });
  return {
    id,
    kanji: kanji.map(text),
    kana: kana.map(text),
    sense: [{ partOfSpeech: pos, misc, gloss: [{ lang: 'eng', text: `gloss ${id}` }] }],
  } satisfies JmWord;
}

const DICT: JmWord[] = [
  jm('1416650', ['駅'], ['えき'], ['n']),
  jm('1335730', ['友達'], ['ともだち'], ['n']),
  jm('1420490', ['待つ'], ['まつ'], ['v5t', 'vt']),
  jm('1546640', ['要る'], ['いる'], ['v5r', 'vi'], ['uk']),
  jm('1577980', ['居る'], ['いる'], ['v1', 'vi'], ['uk']),
  jm('1215230', ['間'], ['あいだ'], ['n']),
  jm('1215240', ['間'], ['ま'], ['n']),
  jm('2028930', [], ['を'], ['prt']),
  jm('2028990', [], ['で'], ['prt']),
  jm('1327190', ['手'], ['て'], ['n']),
];
const lookup = buildLookup(DICT);

function raw(
  surface: string,
  pos: string,
  basic: string,
  reading: string,
  detail = '一般',
  conjugated?: string,
): RawToken {
  return {
    surface_form: surface,
    pos,
    pos_detail_1: detail,
    basic_form: basic,
    reading,
    conjugated_type: conjugated,
  };
}

describe('tokens', () => {
  it('maps IPADIC parts of speech to coarse English names', () => {
    expect(coarsePos({ pos: '名詞', pos_detail_1: '代名詞' })).toBe('pronoun');
    expect(coarsePos({ pos: '名詞', pos_detail_1: '接尾' })).toBe('suffix');
    expect(coarsePos({ pos: '助動詞', pos_detail_1: '*' })).toBe('auxiliary');
    expect(coarsePos({ pos: 'フィラー', pos_detail_1: '*' })).toBe('other');
  });

  it('maps conjugation classes to JMdict verb tags', () => {
    expect(verbClass('一段')).toBe('v1');
    expect(verbClass('五段・タ行')).toBe('v5t');
    expect(verbClass('五段・カ行促音便')).toBe('v5k');
    expect(verbClass('五段・ラ行特殊')).toBe('v5aru');
    expect(verbClass('サ変・スル')).toBe('vs-');
    expect(verbClass(undefined)).toBeUndefined();
  });

  it('derives the reading of the dictionary form from the surface reading', () => {
    expect(baseReading('待っ', '待つ', 'まっ')).toBe('まつ');
    expect(baseReading('読み', '読む', 'よみ')).toBe('よむ');
    expect(baseReading('駅', '駅', 'えき')).toBe('えき');
    expect(baseReading('し', 'する', 'し')).toBe('する');
  });

  it('aligns tokens, resolves words by base form, reading and verb class', () => {
    const text = '駅で友達を待っている間';
    const mapped = mapTokens(
      text,
      [
        raw('駅', '名詞', '駅', 'エキ'),
        raw('で', '助詞', 'で', 'デ', '格助詞'),
        raw('友達', '名詞', '友達', 'トモダチ'),
        raw('を', '助詞', 'を', 'ヲ', '格助詞'),
        raw('待っ', '動詞', '待つ', 'マッ', '自立', '五段・タ行'),
        raw('て', '助詞', 'て', 'テ', '接続助詞'),
        raw('いる', '動詞', 'いる', 'イル', '非自立', '一段'),
        raw('間', '名詞', '間', 'アイダ'),
      ],
      lookup,
    );
    expect(mapped.resolved).toBe(true);
    expect(mapped.tokens.map((t) => [t.surface, t.start, t.reading, t.pos, t.wordId])).toEqual([
      ['駅', 0, 'えき', 'noun', '1416650'],
      ['で', 1, 'で', 'particle', '2028990'],
      ['友達', 2, 'ともだち', 'noun', '1335730'],
      ['を', 4, 'を', 'particle', '2028930'],
      ['待っ', 5, 'まっ', 'verb', '1420490'],
      ['て', 7, 'て', 'particle', undefined],
      ['いる', 8, 'いる', 'verb', '1577980'],
      ['間', 10, 'あいだ', 'noun', '1215230'],
    ]);
  });

  it('marks a sentence unresolved when a content word is not in JMdict', () => {
    const mapped = mapTokens(
      'トムを',
      [raw('トム', '名詞', '*', 'トム', '固有名詞'), raw('を', '助詞', 'を', 'ヲ')],
      lookup,
    );
    expect(mapped.resolved).toBe(false);
  });
});

describe('jmdict', () => {
  it('keeps one gloss line per sense and the first sense pos', () => {
    const word = toWord(jm('1416650', ['駅'], ['えき'], ['n']), new Map([['1416650', 5]]));
    expect(word).toEqual({
      id: '1416650',
      forms: ['駅'],
      readings: ['えき'],
      glosses: ['gloss 1416650'],
      common: true,
      jlpt: 5,
      pos: ['n'],
    });
  });
});

describe('kanji', () => {
  const krad: Record<string, string[]> = {
    寺: ['土', '寸'],
    封: ['土', '寸'],
    待: ['寸', '土', '彳'],
    時: ['寸', '土', '日'],
    持: ['寸', '土', '扎'],
    詩: ['言', '口', '寸', '土'],
    討: ['言', '口', '寸'],
    言: ['言', '口'],
  };
  const joyo = new Map(
    Object.entries({ 寺: [6, 'ジ'], 封: [9, 'フウ'], 討: [10, 'トウ'], 言: [7, 'ゲン'] }).map(
      ([char, [strokes, on]]) => [char, { strokes: strokes as number, on: [on as string] }],
    ),
  );
  const parts = partCandidates(krad, joyo);

  it('rebuilds larger parts from KRADFILE elements', () => {
    expect(componentsOf({ char: '待', strokes: 9, on: ['タイ'] }, krad, parts)).toEqual([
      '彳',
      '寺',
    ]);
    // Parts that share an on'yomi win: 寺 (ジ ~ シ) before 討 (トウ).
    expect(componentsOf({ char: '詩', strokes: 13, on: ['シ'] }, krad, parts)).toEqual([
      '寺',
      '言',
    ]);
  });

  it('assigns the phonetic of a sound family of three or more', () => {
    const k = (char: string, on: string, components: string[]): Kanji => ({
      char,
      on: [on],
      kun: [],
      meanings: [],
      components,
    });
    const all = [
      k('寺', 'ジ', ['土', '寸']),
      k('時', 'ジ', ['日', '寺']),
      k('持', 'ジ', ['扎', '寺']),
      k('詩', 'シ', ['言', '寺']),
      k('待', 'タイ', ['彳', '寺']),
    ];
    assignPhonetics(all);
    expect(all.map((x) => x.phonetic)).toEqual([undefined, '寺', '寺', '寺', undefined]);
    expect(unvoice('ジョウ')).toBe('ショウ');
  });

  it('maps the old four-level JLPT onto N5–N1', () => {
    expect(kanjiJlpt(4, false)).toBe(5);
    expect(kanjiJlpt(2, true)).toBe(3);
    expect(kanjiJlpt(2, false)).toBe(2);
    expect(kanjiJlpt(null, true)).toBeUndefined();
  });

  it('levels a kanji by the easiest listed word usually written with it', () => {
    const levels = vocabularyKanjiLevels([
      { form: '悪い', level: 5 },
      { form: '悪魔', level: 2 },
      { form: 'お茶', level: 5 },
      { form: '茶色', level: 4 },
      { form: undefined, level: 5 },
      { form: '人々', level: 5 },
    ]);
    expect(Object.fromEntries(levels)).toEqual({ 悪: 5, 魔: 2, 茶: 5, 色: 4, 人: 5 });
    const old = {
      literal: '悪',
      misc: { grade: 3, strokeCounts: [11], frequency: 530, jlptLevel: 3 },
    };
    const char = { ...old, readingMeaning: null };
    expect(toKanji(char, false, 5).jlpt).toBe(5);
    expect(toKanji(char, false).jlpt).toBe(4);
    expect(toKanji(char, false, 3).jlpt).toBe(4);
  });

  it('takes a word’s usual kanji writing, never a kana word’s', () => {
    expect(usualKanjiForm(jm('1', ['会う', '逢う'], ['あう'], ['v5u']))).toBe('会う');
    expect(usualKanjiForm(jm('2', ['為る'], ['する'], ['vs-i'], ['uk']))).toBeUndefined();
  });
});

describe('unit compounds', () => {
  const t = (surface: string, start: number, pos = 'noun', wordId?: string) => ({
    surface,
    reading: surface,
    base: surface,
    pos,
    start,
    ...(wordId ? { wordId } : {}),
  });
  const compounds = new Map([
    ['自己紹介', { id: '9', reading: 'じこしょうかい' }],
    ['自動販売機', { id: '8', reading: 'じどうはんばいき' }],
  ]);

  it('joins the tokens of a split unit word back into one token with its id and reading', () => {
    const tokens = [t('自己', 0, 'noun', '1'), t('紹介', 2, 'noun', '2'), t('を', 4, 'particle')];
    expect(joinCompounds(tokens, compounds)).toEqual([
      {
        surface: '自己紹介',
        reading: 'じこしょうかい',
        base: '自己紹介',
        pos: 'noun',
        start: 0,
        wordId: '9',
      },
      t('を', 4, 'particle'),
    ]);
    const three = [t('自動', 0), t('販売', 2), t('機', 4, 'suffix')];
    expect(joinCompounds(three, compounds)[0]?.pos).toBe('noun');
    expect(joinCompounds(three, compounds).map((x) => x.wordId)).toEqual(['8']);
  });

  it('leaves other tokens alone', () => {
    const tokens = [t('自己', 0, 'noun', '1'), t('は', 2, 'particle')];
    expect(joinCompounds(tokens, compounds)).toEqual(tokens);
    expect(joinCompounds(tokens, new Map())).toEqual(tokens);
  });
});

describe('tatoeba and selection', () => {
  it('pairs each Japanese sentence with its lowest-id English translation', () => {
    const pairs = pairSentences(
      '10\tjpn\t駅で待つ。\n11\tjpn\t本を読む。\n',
      '20\teng\tI wait.\n21\teng\tI wait at the station.\n',
      '10\t21\n10\t20\n11\t99\n',
    );
    expect(pairs).toEqual([{ id: '10', text: '駅で待つ。', translation: 'I wait.' }]);
  });

  it('keeps short kanji sentences without Latin letters, and drops duplicates', () => {
    expect(keepText('駅で待つ。')).toBe(true);
    expect(keepText('ひらがなだけ。')).toBe(false);
    expect(keepText('Tomは駅にいる。')).toBe(false);
    expect(keepText(`${'駅'.repeat(41)}`)).toBe(false);
    expect(fitsLevelLength({ text: '駅'.repeat(31), level: 4 })).toBe(false);
    expect(fitsLevelLength({ text: '駅'.repeat(31), level: 3 })).toBe(true);
    const a = { id: '1', text: '駅で待つ。', translation: 'a' };
    const b = { id: '2', text: '駅で待つ！', translation: 'b' };
    expect(dedupe([a, b])).toEqual([a]);
  });

  it('tags a sentence with its grammar and level', () => {
    const sentence = toSentence({ id: '7', text: '駅', translation: 'Station.' }, [], {
      grammarIds: ['desu'],
      level: 5,
    });
    expect(sentence).toMatchObject({
      id: 'tatoeba:7',
      source: 'tatoeba',
      verified: true,
      grammarIds: ['desu'],
      level: 5,
    });
  });
});

describe('emit', () => {
  it('writes deterministic gzip chunks with a manifest', () => {
    const records = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    const chunks = chunk('words', records, 2);
    expect(chunks.map((c) => [c.name, c.count])).toEqual([
      ['words-00.json.gz', 2],
      ['words-01.json.gz', 2],
      ['words-02.json.gz', 1],
    ]);
    expect(contentHash(chunks)).toBe(contentHash(chunk('words', records, 2)));
    const dir = mkdtempSync(join(tmpdir(), 'packs-'));
    const { manifest } = emit(dir, 'v1/', 'v1', chunks);
    expect(manifest.files[0]).toMatchObject({
      store: 'words',
      url: 'v1/words-00.json.gz',
      count: 2,
    });
    const parsed = JSON.parse(gunzipSync(readFileSync(join(dir, 'words-02.json.gz'))).toString());
    expect(parsed).toEqual([{ id: '4' }]);
  });
});
