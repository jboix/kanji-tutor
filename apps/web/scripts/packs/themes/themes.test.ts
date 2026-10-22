import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UNITS, unitById } from '../../../src/domain/themes/index.ts';
import type { Unit } from '../../../src/domain/themes/types.ts';
import type { Sentence, Token } from '../../../src/domain/types.ts';
import { packTokenizer } from '../grammar/tokenize.ts';
import { checkThemes } from './check.ts';
import { checkGrammar } from './grammar.ts';
import { asJmWord, resolutionTable, tokenKey } from './pack-words.ts';
import { checkShape, formatViolation } from './rules.ts';
import { unitTexts } from './vocabulary.ts';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');

function unit(overrides: Partial<Unit> = {}): Unit {
  const base = unitById('self-introduction') as Unit;
  return { ...structuredClone(base), order: 1, ...overrides };
}

function messages(units: Unit[]): string[] {
  return checkShape(units).map(formatViolation);
}

describe('checkShape', () => {
  it('accepts the authored path', () => {
    expect(checkShape(UNITS)).toEqual([]);
  });

  it('flags counts out of bounds', () => {
    const u = unit();
    u.words = u.words.slice(0, 3);
    u.questions = u.questions.slice(0, 1);
    expect(messages([u])).toEqual([
      'self-introduction · words: 3 words, expected 8–15',
      'self-introduction · questions: 1 questions, expected 2–4',
    ]);
  });

  it('flags answer and evidence indices that point nowhere', () => {
    const u = unit();
    const q = u.questions[0];
    if (!q) throw new Error('fixture');
    q.answer = 4;
    q.evidence = 99;
    expect(messages([u])).toEqual([
      'self-introduction · questions[0]: answer 4 is not an option index',
      'self-introduction · questions[0]: evidence 99 is not a passage sentence index',
    ]);
  });

  it('flags duplicate ids, gaps in the order and a level going back down', () => {
    const a = unit({ order: 1, level: 4 });
    const b = unit({ order: 3, level: 5 });
    expect(messages([a, b])).toEqual([
      'self-introduction · id: duplicate unit id',
      '* · order: orders are not 1..2',
      'self-introduction · level: N5 after N4',
    ]);
  });

  it('flags readings that are not kana, duplicate words and a bad slug', () => {
    const u = unit({ id: 'Self Intro' });
    u.words = [...u.words, { written: '名前', reading: 'namae' }];
    expect(messages([u])).toEqual([
      'Self Intro · words[13]: reading "namae" is not kana',
      'Self Intro · words: duplicate word 名前',
      'Self Intro · id: id is not a slug',
    ]);
  });

  it('flags empty text and duplicate options', () => {
    const u = unit();
    const q = u.questions[0];
    const s = u.passage.sentences[0];
    if (!q || !s) throw new Error('fixture');
    q.options = ['a', 'a', 'b', 'c'];
    q.explanation = ' ';
    s.en = '';
    expect(messages([u])).toEqual([
      'self-introduction · questions[0]: duplicate options',
      'self-introduction · questions[0]: empty explanation',
      'self-introduction · passage[0]: empty sentence or translation',
    ]);
  });
});

describe('pack helpers', () => {
  const token = (wordId: string): Token => ({
    surface: '待っ',
    reading: 'まっ',
    base: '待つ',
    pos: 'verb',
    wordId,
    start: 0,
  });
  const sentence = (tokens: Token[]): Sentence => ({
    id: 's',
    text: '',
    source: 'tatoeba',
    tokens,
    wordIds: [],
    verified: true,
  });

  it('keys a token by base form, base reading and pos', () => {
    expect(tokenKey(token('1'))).toBe('待つ|まつ|verb');
  });

  it('keeps the most frequent resolution of each token key', () => {
    const table = resolutionTable([sentence([token('2'), token('1')]), sentence([token('2')])]);
    expect(table.get('待つ|まつ|verb')).toBe('2');
  });

  it('sees a kana-only pack word as a usually-kana JMdict entry', () => {
    const jm = asJmWord({ id: '9', forms: [], readings: ['いる'], glosses: [], common: true });
    expect(jm).toMatchObject({
      kanji: [],
      kana: [{ text: 'いる' }],
      sense: [{ partOfSpeech: [] }],
    });
  });

  it('lists every Japanese text of a unit with its place', () => {
    const where = unitTexts(unit()).map((t) => t.where);
    expect(where.slice(0, 2)).toEqual(['passage[0]', 'passage[1]']);
    expect(where).toContain('questions[2].options[3]');
  });
});

describe('checkThemes', () => {
  it('passes every unit against the committed packs and the pack tokenizer', async () => {
    const violations = await checkThemes(UNITS, resolve(ROOT, 'public/packs/manifest.json'), ROOT);
    expect(violations.map(formatViolation)).toEqual([]);
  }, 120_000);

  it('reports words above the level that no unit introduces', async () => {
    const u = unit();
    const s = u.passage.sentences[0];
    if (!s) throw new Error('fixture');
    s.ja = '彼は経済を研究しています。';
    u.words = [...u.words, { written: '名前', reading: 'なまい' }];
    const violations = (await checkThemes([u])).map(formatViolation);
    expect(violations).toContain(
      'self-introduction · words[13]: 名前 (なまい) has no JMdict entry with that reading',
    );
    expect(violations.some((v) => v.includes('passage[0]: 経済'))).toBe(true);
  }, 120_000);
});

describe('checkGrammar', () => {
  it('needs catalogue ids at or below the level that the passage uses', async () => {
    const tokens = await packTokenizer(ROOT);
    const u = unit({ grammar: ['desu', 'nope', 'tsumori', 'te-mo-ii'] });
    expect(checkGrammar([u], tokens).map(formatViolation)).toEqual([
      'self-introduction · grammar[1]: nope is not in the catalogue',
      'self-introduction · grammar[2]: tsumori is N4, above N5',
      'self-introduction · grammar[3]: te-mo-ii (〜てもいい) is not found in the passage',
    ]);
  }, 60_000);
});
