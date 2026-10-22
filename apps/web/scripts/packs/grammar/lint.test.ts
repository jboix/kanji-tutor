import { describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../../../src/domain/grammar/catalogue.ts';
import { FUNCTION_WORDS } from '../../../src/domain/grammar/function-words.ts';
import type { GrammarEntry } from '../../../src/domain/grammar/types.ts';
import { levelCounts, lintCatalogue, lintFunctionWords } from './lint.ts';

const base = GRAMMAR_CATALOGUE[0] as GrammarEntry;

describe('catalogue lint', () => {
  it('finds no problem in the catalogue', () => {
    expect(lintCatalogue()).toEqual([]);
  });

  it('covers roughly 60 N5, 80 N4 and 100 N3 points', () => {
    const counts = levelCounts();
    expect(counts[5]).toBeGreaterThanOrEqual(55);
    expect(counts[4]).toBeGreaterThanOrEqual(75);
    expect(counts[3]).toBeGreaterThanOrEqual(95);
  });

  it('reports duplicates, bad ids, levels, empty fields and lonely families', () => {
    const broken: GrammarEntry[] = [
      base,
      { ...base },
      { ...base, id: 'Bad Id', pattern: '〜x', meaning: ' ', cloze: [] },
      { ...base, id: 'lonely', pattern: '〜y', family: 'wish', level: 2 as 5 },
    ];
    const problems = lintCatalogue(broken);
    expect(problems).toContain(`duplicate id ${base.id}`);
    expect(problems).toContain(`duplicate pattern ${base.pattern}`);
    expect(problems).toContain('Bad Id: empty meaning');
    expect(problems).toContain('Bad Id: id is not kebab-case');
    expect(problems).toContain('Bad Id: empty cloze');
    expect(problems).toContain('lonely: level 2');
    expect(problems).toContain('family wish has a single entry');
  });
});

describe('particle lint (G5)', () => {
  it('finds no problem in the particle entries', () => {
    expect(lintFunctionWords()).toEqual([]);
  });

  it('covers the basic particles and function words', () => {
    const patterns = FUNCTION_WORDS.map((w) => w.pattern.split(' ')[0]);
    for (const p of [
      'が',
      'は',
      'を',
      'に',
      'で',
      'と',
      'も',
      'の',
      'へ',
      'から',
      'まで',
      'や',
      'か',
    ]) {
      expect(patterns).toContain(p);
    }
    for (const p of ['ね', 'よ', 'けど', 'より', 'しか', 'だけ', 'ので', 'のに'])
      expect(patterns).toContain(p);
  });

  it('reports duplicates, bad ids, levels, use counts and unknown links', () => {
    const base = FUNCTION_WORDS[0] as (typeof FUNCTION_WORDS)[number];
    const broken = [
      base,
      { ...base },
      { ...base, id: 'Bad', pattern: 'x', level: 3 as const, uses: [], grammarId: 'nope' },
      { ...base, id: 'desu', pattern: 'y', meaning: ' ' },
    ];
    const problems = lintFunctionWords(broken);
    expect(problems).toContain(`duplicate id ${base.id}`);
    expect(problems).toContain(`duplicate pattern ${base.pattern}`);
    expect(problems).toContain('Bad: bad id');
    expect(problems).toContain('Bad: level 3');
    expect(problems).toContain('Bad: 0 uses');
    expect(problems).toContain('Bad: unknown grammar nope');
    expect(problems).toContain('duplicate id desu');
    expect(problems).toContain('desu: empty meaning');
  });
});
