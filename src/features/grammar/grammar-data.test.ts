import { describe, expect, it } from 'vitest';
import { FUNCTION_WORDS, GRAMMAR_CATALOGUE } from '../../domain/grammar/index.ts';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import {
  bare,
  entryById,
  familyLabel,
  formationParts,
  groupByLevel,
  groupLabel,
  isFunctionWord,
  relatedOf,
  searchEntries,
} from './grammar-data.ts';

const t = createTranslator('en', ENGLISH, ENGLISH);

describe('grammar data', () => {
  it('splits a formation into slots and fixed grammar', () => {
    expect(formationParts('V-て + もいい')).toEqual([
      { text: 'V-て', slot: true, at: 0 },
      { text: 'もいい', slot: false, at: 1 },
    ]);
  });

  it('keeps a bracketed " + " inside its part', () => {
    const parts = formationParts('plain form (な-adj + な / N + の) + くせに');
    expect(parts.map((p) => p.text)).toEqual(['plain form (な-adj + な / N + の)', 'くせに']);
    expect(parts.map((p) => p.slot)).toEqual([true, false]);
  });

  it('finds related points of the same family, never the point itself', () => {
    const entry = entryById('te-mo-ii');
    if (!entry) throw new Error('missing');
    const related = relatedOf(entry);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((e) => !isFunctionWord(e) && e.family === 'permission')).toBe(true);
    expect(related.map((e) => e.id)).not.toContain('te-mo-ii');
  });

  it('relates function words written the same, then their catalogue point', () => {
    const from = entryById('particle-kara-from');
    if (!from || !isFunctionWord(from)) throw new Error('missing');
    expect(relatedOf(from).map((e) => e.id)).toContain('particle-kara-because');
    expect(groupLabel(from, t)).toBe('Particles and function words');
    expect(searchEntries('subject', FUNCTION_WORDS).map((e) => e.id)).toContain('particle-ga');
  });

  it('searches pattern, meaning and id, ignoring 〜 and case', () => {
    expect(searchEntries('〜てもいい', GRAMMAR_CATALOGUE).map((e) => e.id)).toContain('te-mo-ii');
    expect(searchEntries('ALL RIGHT TO', GRAMMAR_CATALOGUE).map((e) => e.id)).toContain('te-mo-ii');
    expect(searchEntries('te mo ii', GRAMMAR_CATALOGUE).map((e) => e.id)).toContain('te-mo-ii');
    expect(searchEntries('zzzz', GRAMMAR_CATALOGUE)).toEqual([]);
    expect(searchEntries('  ', GRAMMAR_CATALOGUE)).toHaveLength(GRAMMAR_CATALOGUE.length);
  });

  it('groups by level, N5 first, and by family', () => {
    const groups = groupByLevel(GRAMMAR_CATALOGUE);
    expect(groups.map((g) => g.level)).toEqual([5, 4, 3]);
    const count = groups.flatMap((g) => g.families.flatMap((f) => f.entries)).length;
    expect(count).toBe(GRAMMAR_CATALOGUE.length);
  });

  it('labels families, including ones added later', () => {
    expect(familyLabel('giving-receiving', t)).toBe('Giving and receiving');
    expect(familyLabel('permission', t)).toBe('Permission');
    expect(familyLabel('case-particle', t)).toBe('Case particle');
    expect(bare('〜てもいい')).toBe('てもいい');
  });
});
