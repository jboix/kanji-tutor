import { describe, expect, it } from 'vitest';
import { unitById } from '../../../src/domain/themes/index.ts';
import type { Unit } from '../../../src/domain/themes/types.ts';
import type { Kanji } from '../../../src/domain/types.ts';
import { checkKanjiLevels, FIRST_N5_KANJI } from './kanji-levels.ts';
import { formatViolation } from './rules.ts';

const base = unitById('i-am-a-student') as Unit;
const levels = new Map<string, Pick<Kanji, 'jlpt'>>([
  ...[...FIRST_N5_KANJI].map((char): [string, Pick<Kanji, 'jlpt'>] => [char, { jlpt: 5 }]),
  ['私', { jlpt: 5 }],
  ['紹', { jlpt: 4 }],
  ['介', { jlpt: 4 }],
]);

function unit(overrides: Partial<Unit>): Unit {
  return { ...structuredClone(base), ...overrides };
}

describe('kanji levels of the units (T8)', () => {
  it('has 80 first N5 kanji', () => {
    expect(FIRST_N5_KANJI.size).toBe(80);
  });

  it('accepts the first unit', () => {
    expect(checkKanjiLevels([base], levels)).toEqual([]);
  });

  it('flags a kanji above the unit’s level in its title, words, passage and questions', () => {
    const u = unit({ order: 3, titleJa: '自己紹介' });
    u.words = [{ written: '紹介', reading: 'しょうかい' }];
    u.passage = { sentences: [{ ja: '紹介します。', en: '' }] };
    u.questions = [];
    const found = checkKanjiLevels([unit({}), unit({ order: 2 }), u], levels).map(formatViolation);
    expect(found).toContain('i-am-a-student · titleJa: 紹 is N4, above N5');
    expect(found).toContain('i-am-a-student · words[0]: 介 is N4, above N5');
    expect(found).toContain('i-am-a-student · passage[0]: 紹 is N4, above N5');
    expect(found).toContain('i-am-a-student · titleJa: 己 is not levelled, above N5');
  });

  it('keeps the opening N5 units to the first 80 kanji, and lets later N5 units use more', () => {
    const write = (order: number) => {
      const u = unit({ order, titleJa: '私の家族' });
      u.words = [];
      u.questions = [];
      u.passage = { sentences: [] };
      return u;
    };
    const found = checkKanjiLevels([write(1), write(2), write(3)], levels).map(formatViolation);
    expect(found.filter((v) => v.includes('私 is not one of the first 80'))).toHaveLength(2);
    expect(found.filter((v) => v.includes('族'))).toHaveLength(3);
  });

  it('allows a kanji at or below an N4 unit’s level and skips 々', () => {
    const u = unit({ level: 4, titleJa: '紹介と人々' });
    u.words = [];
    u.questions = [];
    u.passage = { sentences: [] };
    expect(checkKanjiLevels([u], levels)).toEqual([]);
  });
});
