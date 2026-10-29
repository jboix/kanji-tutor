import { describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../grammar/index.ts';
import { GUIDES, guideFor } from './guides.ts';
import {
  ADJECTIVE_ROWS,
  classOfExample,
  I_ADJECTIVES,
  iAdjectiveIn,
  LOOKALIKE_GODAN,
  NA_ADJECTIVE,
  naAdjectiveIn,
  TABLE_FORMS,
  TABLE_VERBS,
  TE_OTHERS,
  TE_RULES,
  VERB_GROUPS,
  verbIn,
} from './tables.ts';

describe('the guides', () => {
  it('back grammar points of the catalogue, each by one guide', () => {
    const ids = new Set(GRAMMAR_CATALOGUE.map((entry) => entry.id));
    const backed = GUIDES.flatMap((guide) => guide.grammarIds);
    for (const id of backed) expect(ids.has(id), id).toBe(true);
    expect(new Set(backed).size).toBe(backed.length);
    expect(guideFor('te-kudasai')?.id).toBe('te-form');
    expect(guideFor('desu')).toBeUndefined();
  });
});

describe('the guides’ tables', () => {
  it('put each example verb in the group it is listed under', () => {
    const cls = classOfExample;
    for (const verb of VERB_GROUPS.godan) expect(cls(verb), verb.written).toMatch(/^v5/);
    for (const verb of VERB_GROUPS.ichidan) expect(cls(verb), verb.written).toBe('v1');
    for (const verb of LOOKALIKE_GODAN) expect(cls(verb), verb.written).toMatch(/^v5/);
    expect(VERB_GROUPS.irregular.map(cls)).toEqual(['vs', 'vk', 'vs']);
  });

  it('give the て- and た-form endings the engine makes', () => {
    for (const rule of TE_RULES) {
      for (const verb of rule.examples) {
        expect(verbIn(verb, 'te')?.written, verb.written).toMatch(new RegExp(`${rule.te}$`));
        expect(verbIn(verb, 'ta')?.reading, verb.written).toMatch(new RegExp(`${rule.ta}$`));
      }
    }
    expect(TE_OTHERS.map((verb) => verbIn(verb, 'te')?.written)).toEqual([
      '食べて',
      '見て',
      'して',
      '来て',
      '行って',
    ]);
  });

  it('conjugate every table verb in every listed form', () => {
    for (const verb of TABLE_VERBS) {
      for (const form of TABLE_FORMS)
        expect(verbIn(verb, form), `${verb.written} ${form}`).toBeDefined();
    }
    expect(verbIn({ written: '書く', reading: 'かく' }, 'potential')).toEqual({
      written: '書ける',
      reading: 'かける',
    });
  });

  it('make the adjectives’ plain and polite forms, いい as よく', () => {
    const [takai, ii] = I_ADJECTIVES;
    expect(takai && iAdjectiveIn(takai, 'negative')).toEqual(['高くない', '高くないです']);
    expect(ii && iAdjectiveIn(ii, 'past')).toEqual(['よかった', 'よかったです']);
    expect(takai && iAdjectiveIn(takai, 'negativePast')).toEqual([
      '高くなかった',
      '高くなかったです',
    ]);
    expect(naAdjectiveIn(NA_ADJECTIVE, 'negative')).toEqual(['静かじゃない', '静かじゃありません']);
    for (const row of ADJECTIVE_ROWS) expect(takai && iAdjectiveIn(takai, row)[0]).toBeTruthy();
  });
});
