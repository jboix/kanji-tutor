/**
 * Question material rules from the quality review: tokens whose reading the tokenizer may
 * get wrong or that are numbers are never asked, lookalikes are everyday kanji, and grammar is
 * asked at the learner's level and the one below.
 */
import { describe, expect, it } from 'vitest';
import { catalogueFor, everydayKanji, misleading } from './sources.ts';

describe('question material', () => {
  it('never asks a surface with two common readings or a number', () => {
    expect(misleading('行っ')).toBe(true);
    expect(misleading('方')).toBe(true);
    expect(misleading('二千')).toBe(true);
    expect(misleading('百')).toBe(true);
    expect(misleading('行き')).toBe(false);
    expect(misleading('一緒')).toBe(false);
  });

  it('takes lookalikes from kanji a learner meets (not 燵 or 檎)', () => {
    const base = { meanings: [], on: [], kun: [], components: [] };
    expect(everydayKanji({ ...base, char: '持', jlpt: 4 })).toBe(true);
    expect(everydayKanji({ ...base, char: '僅', grade: 9 })).toBe(false);
    expect(everydayKanji({ ...base, char: '燵' })).toBe(false);
  });

  it('asks grammar of the learner level and the one below: たい is no N3 question', () => {
    expect(new Set(catalogueFor(3).map((e) => e.level))).toEqual(new Set([3, 4]));
    expect(catalogueFor(3).some((e) => e.id === 'tai')).toBe(false);
    expect(new Set(catalogueFor(5).map((e) => e.level))).toEqual(new Set([5]));
  });
});
