import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import type { Word } from '../types.ts';
import { captureDictionary } from './capture-fixtures.ts';
import { newWordItem } from './items.ts';
import { applyCandidate, kanaRun, kanjiCandidates } from './kanji-candidates.ts';

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
  word('9', '私', 'わたし', { jlpt: 5, pos: ['pn'] }),
  word('10', '渡し', 'わたし', { common: false, pos: ['n'] }),
  word('11', '歯', 'は', { jlpt: 5, pos: ['n'] }),
  word('12', '葉', 'は', { jlpt: 4, pos: ['n'] }),
  word('13', '日本語', 'にほんご', { jlpt: 5, pos: ['n'] }),
  word('14', '日本', 'にほん', { jlpt: 5, pos: ['n'] }),
  word('15', '本', 'ほん', { jlpt: 5, pos: ['n'] }),
  word('16', '勉強', 'べんきょう', { jlpt: 5, pos: ['n', 'vs'] }),
  word('17', '食べる', 'たべる', { jlpt: 5, pos: ['v1', 'vt'] }),
  word('18', '書く', 'かく', { jlpt: 5, pos: ['v5k', 'vt'] }),
  word('19', '買う', 'かう', { jlpt: 5, pos: ['v5u', 'vt'] }),
  word('20', '高い', 'たかい', { jlpt: 5, pos: ['adj-i'] }),
  word('21', '柿', 'かき', { jlpt: 3, pos: ['n'] }),
  word('22', '出る', 'でる', { jlpt: 5, pos: ['v1'] }),
  word('23', '手', 'て', { jlpt: 5, pos: ['n'] }),
];

function repos() {
  return createMemoryRepos({ dictionary: captureDictionary(WORDS) });
}

const forms = (list: { form: string }[]) => list.map((c) => c.form);

const at = (start: number, end = start, from?: number) => ({
  start,
  end,
  ...(from ? { from } : {}),
});

/** The words of the likeliest phrase, as the options show them: the first word, then the rest. */
async function cut(text: string, store = repos()) {
  const [first, whole] = await kanjiCandidates(store, text, at(text.length));
  return first?.next === undefined ? [first?.form] : [first.form, whole?.form];
}

describe('kanaRun (C6)', () => {
  it('takes the whole kana run before the caret, twelve kana at most', () => {
    expect(kanaRun('私はがくせい', at(6))?.kana).toBe('はがくせい');
    expect(kanaRun('学生 です', at(3))).toBeUndefined();
    expect(kanaRun('abc', at(3))).toBeUndefined();
    expect(kanaRun('ノートに', at(4))?.kana).toBe('に');
    expect(kanaRun('あいうえおかきくけこさしすせ', at(14))).toEqual({
      kana: 'うえおかきくけこさしすせ',
      start: 2,
      end: 14,
    });
  });

  it('takes a kana selection as it is, and nothing for a mixed one', () => {
    expect(kanaRun('はしをわたる', at(0, 2))).toEqual({ kana: 'はし', start: 0, end: 2 });
    expect(kanaRun('橋をわたる', at(0, 2))).toBeUndefined();
  });

  it('never reaches back past settled text, unless the caret is before it', () => {
    expect(kanaRun('わたしはがくせい', at(8, 8, 4))?.kana).toBe('がくせい');
    expect(kanaRun('わたしは', at(4, 4, 4))).toBeUndefined();
    expect(kanaRun('わたしはがくせい', at(3, 3, 4))?.kana).toBe('わたし');
  });
});

describe('kanjiCandidates: the phrase cut into words (C6)', () => {
  it('keeps particles and the copula in kana', async () => {
    expect(await cut('わたしは')).toEqual(['私', '私は']);
    expect(await cut('がくせいです')).toEqual(['学生', '学生です']);
    expect(await cut('にほんごをべんきょうする')).toEqual(['日本語', '日本語を勉強する']);
    expect(await cut('これはがくせい')).toEqual(['これ', 'これは学生']);
  });

  it('keeps the okurigana and endings of verbs and adjectives', async () => {
    expect(await cut('たべます')).toEqual(['食べます']);
    expect(await cut('たべて')).toEqual(['食べて']);
    expect(await cut('かきました')).toEqual(['書きました']);
    expect(await cut('かいて')).toEqual(['書いて']);
    expect(await cut('かって')).toEqual(['買って']);
    expect(await cut('たかかった')).toEqual(['高かった']);
    expect(await cut('ほんをかいたい')).toEqual(['本', '本を買いたい']);
    expect(await cut('ほんをたべ')).toEqual(['本', '本を食べ']);
  });

  it("puts the learner's own words first, then common words and easier levels", async () => {
    const store = repos();
    expect(forms(await kanjiCandidates(store, 'はし', at(2)))).toEqual([
      '箸',
      'はし',
      'ハシ',
      '橋',
      '端',
    ]);
    await store.items.put(newWordItem({ wordId: '1', kind: 'import', now: NOW, level: 2 }));
    const list = await kanjiCandidates(store, 'はし', at(2));
    expect(forms(list)).toEqual(['端', 'はし', 'ハシ', '箸', '橋']);
    expect(list[0]).toMatchObject({ kana: 'はし', start: 0, end: 2, wordId: '1', known: true });
    expect(list[1]?.known).toBe(false);
  });
});

describe('kanjiCandidates: the options (C6)', () => {
  it('leads with the first word and the rest to come, then whole phrases', async () => {
    const list = await kanjiCandidates(repos(), 'わたしは', at(4));
    expect(list.map((c) => [c.form, c.next, c.start, c.end])).toEqual([
      ['私', 'は', 0, 3],
      ['私は', undefined, 0, 4],
      ['わたしは', undefined, 0, 4],
      ['ワタシは', undefined, 0, 4],
      ['渡しは', undefined, 0, 4],
    ]);
    expect(list.every((c) => c.runEnd === 4)).toBe(true);
  });

  it('offers a particle as itself first, its kanji after', async () => {
    expect(forms(await kanjiCandidates(repos(), 'は', at(1)))).toEqual(['は', 'ハ', '歯', '葉']);
  });

  it('offers nothing without a kanji, and leaves katakana as it is', async () => {
    expect(await kanjiCandidates(repos(), 'これ', at(2))).toEqual([]);
    expect(await kanjiCandidates(repos(), 'です', at(2))).toEqual([]);
    expect(await kanjiCandidates(repos(), 'コーヒー', at(4))).toEqual([]);
    expect(await kanjiCandidates(repos(), 'コーヒー', at(0, 4))).toEqual([]);
    // A hiragana run right after katakana is still looked up on its own.
    expect(forms(await kanjiCandidates(repos(), 'テストはし', at(5)))[0]).toBe('箸');
  });

  it('cuts a selection too, and caps the options', async () => {
    const list = await kanjiCandidates(repos(), 'わたしはがくせいです', at(3, 8));
    expect(list[0]).toMatchObject({ form: 'は', next: '学生', start: 3, end: 4, runEnd: 8 });
    expect(await kanjiCandidates(repos(), 'はし', at(2), 2)).toHaveLength(2);
  });

  it('asks the dictionary for each span once while typing goes on', async () => {
    const store = repos();
    let asked = 0;
    const wordsByText = store.dictionary.wordsByText;
    store.dictionary.wordsByText = (text) => {
      asked++;
      return wordsByText(text);
    };
    await kanjiCandidates(store, 'わたし', at(3));
    const first = asked;
    await kanjiCandidates(store, 'わたしは', at(4));
    // Only the spans that end with the new kana are new.
    expect(asked - first).toBeLessThan(first);
    expect(asked - first).toBeGreaterThan(0);
  });
});

describe('applyCandidate (C6)', () => {
  it('replaces the whole phrase and puts the caret after it', async () => {
    const text = 'これはがくせいです';
    const list = await kanjiCandidates(repos(), text, at(9));
    const whole = list.find((c) => c.form === 'これは学生です') ?? fail();
    expect(applyCandidate(text, whole)).toEqual({ text: 'これは学生です', caret: 7, settled: 7 });
  });

  it('converts the first word only, the caret staying at the end of the phrase', async () => {
    const text = 'わたしはがくせい';
    const [first] = await kanjiCandidates(repos(), text, at(8));
    expect(applyCandidate(text, first ?? fail())).toEqual({
      text: '私はがくせい',
      caret: 6,
      settled: 1,
    });
    const next = await kanjiCandidates(repos(), '私はがくせい', at(6, 6, 1));
    expect(next[0]).toMatchObject({ form: 'は', next: '学生', start: 1, end: 2 });
  });
});

function fail(): never {
  throw new Error('no candidate');
}
