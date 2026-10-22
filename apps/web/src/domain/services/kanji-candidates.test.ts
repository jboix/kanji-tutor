import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import type { Word } from '../types.ts';
import { captureDictionary } from './capture-fixtures.ts';
import { newWordItem } from './items.ts';
import { applyCandidate, kanaRuns, kanjiCandidates } from './kanji-candidates.ts';

const NOW = Date.UTC(2026, 9, 17);

function word(id: string, form: string, reading: string, extra: Partial<Word> = {}): Word {
  return {
    id,
    forms: form ? [form] : [],
    readings: [reading],
    glosses: [],
    common: true,
    ...extra,
  };
}

const WORDS = [
  word('1', '端', 'はし', { common: false }),
  word('2', '橋', 'はし', { jlpt: 4 }),
  word('3', '箸', 'はし', { jlpt: 5 }),
  word('4', '学生', 'がくせい', { jlpt: 5 }),
  word('5', '性', 'せい', { jlpt: 3 }),
  word('6', '', 'これ'),
  word('7', '珈琲', 'コーヒー', { common: false }),
  word('8', '橋', 'きょう', { common: false }),
];

function repos() {
  return createMemoryRepos({ dictionary: captureDictionary(WORDS) });
}

const forms = (list: { form: string }[]) => list.map((c) => c.form);

describe('kanaRuns (C6)', () => {
  it('takes every ending of the kana run before the caret, longest first', () => {
    expect(kanaRuns('私はがくせい', 6).map((r) => r.kana)).toEqual([
      'はがくせい',
      'がくせい',
      'くせい',
      'せい',
      'い',
    ]);
    expect(kanaRuns('学生 です', 3)).toEqual([]);
    expect(kanaRuns('abc', 3)).toEqual([]);
    expect(kanaRuns('ノートに', 4).map((r) => r.kana)).toEqual(['に']);
  });

  it('takes a kana selection as it is, and nothing for a mixed one', () => {
    expect(kanaRuns('はしをわたる', 0, 2)).toEqual([{ kana: 'はし', start: 0, end: 2 }]);
    expect(kanaRuns('橋をわたる', 0, 2)).toEqual([]);
  });

  it('looks back eight characters at most', () => {
    const runs = kanaRuns('あいうえおかきくけこ', 10);
    expect(runs[0]).toEqual({ kana: 'うえおかきくけこ', start: 2, end: 10 });
    expect(runs).toHaveLength(8);
  });
});

describe('kanjiCandidates (C6)', () => {
  it('offers spellings by reading: known words first, then common, then easier levels', async () => {
    const store = repos();
    expect(forms(await kanjiCandidates(store, 'はし', { start: 2, end: 2 }))).toEqual([
      '箸',
      '橋',
      '端',
    ]);
    await store.items.put(newWordItem({ wordId: '1', kind: 'import', now: NOW, level: 2 }));
    const list = await kanjiCandidates(store, 'はし', { start: 2, end: 2 });
    expect(forms(list)).toEqual(['端', '箸', '橋']);
    expect(list[0]).toMatchObject({ kana: 'はし', start: 0, end: 2, wordId: '1', known: true });
    expect(list[1]?.known).toBe(false);
  });

  it('puts the longest run first and skips kana-only words', async () => {
    const list = await kanjiCandidates(repos(), 'これがくせい', { start: 6, end: 6 });
    expect(list.map((c) => [c.form, c.kana])).toEqual([
      ['学生', 'がくせい'],
      ['性', 'せい'],
    ]);
    expect(await kanjiCandidates(repos(), 'これ', { start: 2, end: 2 })).toEqual([]);
  });

  it('leaves katakana as it is, and caps the row', async () => {
    expect(await kanjiCandidates(repos(), 'コーヒー', { start: 4, end: 4 })).toEqual([]);
    expect(await kanjiCandidates(repos(), 'コーヒー', { start: 0, end: 4 })).toEqual([]);
    // A hiragana run right after katakana is still looked up on its own.
    expect(forms(await kanjiCandidates(repos(), 'テストはし', { start: 5, end: 5 }))).toEqual([
      '箸',
      '橋',
      '端',
    ]);
    expect(await kanjiCandidates(repos(), 'はし', { start: 2, end: 2 }, 2)).toHaveLength(2);
  });
});

describe('applyCandidate (C6)', () => {
  it('replaces the kana run and puts the caret after the spelling', async () => {
    const text = 'これはがくせいです';
    const [first] = await kanjiCandidates(repos(), text, { start: 7, end: 7 });
    expect(first?.form).toBe('学生');
    expect(applyCandidate(text, first ?? fail())).toEqual({ text: 'これは学生です', caret: 5 });
  });
});

function fail(): never {
  throw new Error('no candidate');
}
