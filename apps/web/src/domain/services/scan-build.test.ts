import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import {
  GRAMMAR_PAGE,
  HANDOUT_PAGE,
  KANJI_PAGE,
  LINE_RAIN,
  scanDictionary,
  SCAN_WORDS as W,
} from '../../test/scan-fixtures.ts';
import type { LegacyCapture } from '../scan-types.ts';
import { buildScan, needsMatch, rematchScan } from './scan-build.ts';
import { matchPattern, patternKey } from './scan-match.ts';
import { emptyScan, saveScan, scanFromCapture, titleFromLines } from './scans.ts';

const NOW = Date.parse('2026-10-25T10:00:00Z');

function repos() {
  return createMemoryRepos({ dictionary: scanDictionary(), settings: { learnerLevel: 5 } });
}

const base = () => emptyScan({ id: 'scan1', now: NOW, lesson: 'Week 8' });

describe('matchPattern', () => {
  it('compares patterns without 〜, sense notes and copula', () => {
    expect(patternKey('〜そうだ (様子)')).toBe('そうだ');
    expect(matchPattern('〜そうだ')?.id).toBe('sou-look');
    expect(matchPattern('〜そうです')?.id).toBe('sou-look');
    expect(matchPattern('そうだ', new Set(['sou-hearsay']))?.id).toBe('sou-hearsay');
    expect(matchPattern('〜でしょう')?.id).toBe('deshou');
    expect(matchPattern('に')?.id).toBe('particle-ni');
    expect(matchPattern('〜ぴょん')).toBeUndefined();
  });
});

describe('buildScan', () => {
  it('matches kanji, words and grammar to our data and keeps what it does not know', async () => {
    const r = repos();
    const { lesson } = await buildScan(r, {
      base: base(),
      pages: [KANJI_PAGE, GRAMMAR_PAGE],
      level: 5,
    });
    const pick = (kind: string) =>
      lesson.items.filter((i) => i.kind === kind).map((i) => [i.text, i.ref ?? null, i.page]);
    expect(pick('kanji')).toEqual([
      ['雨', '雨', 0],
      ['晴', '晴', 0],
      ['曇', null, 0],
    ]);
    expect(pick('word')).toEqual([
      ['天気予報', W.yohou.id, 0],
      ['晴れ', W.hare.id, 0],
      ['雪見日和', null, 0],
    ]);
    // The tutor's 〜そうだ, and でしょう found by its detector in the grammar page's line.
    expect(pick('grammar')).toEqual([
      ['〜そうだ', 'sou-look', 1],
      ['〜でしょう', 'deshou', 1],
    ]);
    const unknown = lesson.items.find((i) => i.text === '雪見日和');
    expect(unknown).toMatchObject({
      meaning: 'a fine day for viewing snow',
      reading: { reading: 'ゆきみびより', verified: false },
    });
  });

  it('stores the lines as sentences with their verified flag, and the suggested title', async () => {
    const r = repos();
    const built = await buildScan(r, { base: base(), pages: [KANJI_PAGE, GRAMMAR_PAGE], level: 5 });
    expect(built.lesson.title).toBe('Weather and plans');
    expect(built.lesson.suggestedTitle).toBe('Weather and plans');
    expect(built.lesson.pages.map((p) => p.kind)).toEqual(['kanji-list', 'grammar']);
    expect(built.lesson.pages[0]?.lines).toEqual([
      { text: LINE_RAIN.text, verified: false, sentenceId: 'capture:scan1:0.0' },
    ]);
    expect(built.sentences.map((s) => [s.id, s.verified, s.source])).toEqual([
      ['capture:scan1:0.0', false, 'capture'],
      ['capture:scan1:1.0', true, 'capture'],
    ]);
    expect(built.sentences[1]?.grammarIds).toContain('deshou');
    await saveScan(r, built, NOW);
    expect((await r.scans.get('scan1'))?.title).toBe('Weather and plans');
    expect(await r.sentences.get('capture:scan1:1.0')).toBeDefined();
  });

  it('gives handout questions ids and the items they practise, answers kept', async () => {
    const r = repos();
    const pages = [GRAMMAR_PAGE, KANJI_PAGE, HANDOUT_PAGE];
    const { lesson } = await buildScan(r, { base: base(), pages, level: 5 });
    expect(lesson.questions.map((q) => [q.id, q.page, q.practises])).toEqual([
      ['2-1', 2, ['kanji:雨', 'grammar:sou-look']],
      ['2-2', 2, ['word:s1']],
    ]);
    expect(lesson.questions[0]?.answer).toBe('そう');
  });

  it('adds pages to an existing lesson after its own, without repeating its items', async () => {
    const r = repos();
    const first = await buildScan(r, { base: base(), pages: [KANJI_PAGE], level: 5 });
    const renamed = { ...first.lesson, title: 'My weather' };
    const more = await buildScan(r, { base: renamed, pages: [KANJI_PAGE, HANDOUT_PAGE], level: 5 });
    expect(more.lesson.title).toBe('My weather');
    expect(more.lesson.pages).toHaveLength(3);
    expect(more.lesson.items).toEqual(first.lesson.items);
    expect(more.sentences.map((s) => s.id)).toEqual(['capture:scan1:1.0']);
    expect(more.lesson.questions.map((q) => q.id)).toEqual(['2-1', '2-2']);
  });

  it('pasted text without the tutor lists the new words of its lines', async () => {
    const r = repos();
    const pasted = { kind: 'reading' as const, lines: [LINE_RAIN], questions: [] };
    const { lesson } = await buildScan(r, { base: base(), pages: [pasted], level: 5 });
    expect(lesson.items.map((i) => [i.kind, i.text, i.from])).toEqual([
      ['kanji', '雨', 'text'],
      ['word', '雨', 'text'],
      ['word', '降る', 'text'],
    ]);
    expect(lesson.title).toBe('');
  });

  it('matches again a lesson matched an older way, and only that', async () => {
    const r = repos();
    const pasted = { kind: 'reading' as const, lines: [LINE_RAIN], questions: [] };
    const { lesson } = await buildScan(r, { base: base(), pages: [pasted], level: 5 });
    expect(needsMatch(lesson)).toBe(false);
    const { matchVersion: _version, ...older } = lesson;
    expect(needsMatch(older)).toBe(true);
  });

  it('offers no kanji from the lines that the learner already reads', async () => {
    const r = repos();
    await r.kanjiReadings.put({
      id: '雨:あめ',
      kanji: '雨',
      reading: 'あめ',
      level: 3,
      wordIds: [],
    });
    const pasted = { kind: 'reading' as const, lines: [LINE_RAIN], questions: [] };
    const { lesson } = await buildScan(r, { base: base(), pages: [pasted], level: 5 });
    expect(lesson.items.some((i) => i.kind === 'kanji')).toBe(false);
  });
});

describe('scanFromCapture', () => {
  const capture: LegacyCapture = {
    id: 'cap-1',
    createdAt: NOW,
    photo: new Blob(['jpeg'], { type: 'image/jpeg' }),
    lines: ['雨が降ります。', '明日は晴れるでしょう。'],
    lesson: 'Tobira 第4課',
    week: '2026-W43',
    addedItemIds: ['word:s3', 'grammar:deshou'],
    sentenceIds: ['capture:cap-1:0', 'capture:cap-1:1'],
  };

  it('keeps everything as a lesson of one page', () => {
    const lesson = scanFromCapture(capture);
    expect(lesson).toMatchObject({
      id: 'cap-1',
      createdAt: NOW,
      title: '雨が降ります',
      suggestedTitle: '',
      week: '2026-W43',
      lesson: 'Tobira 第4課',
      addedItemIds: ['word:s3', 'grammar:deshou'],
      unmatched: true,
      items: [],
      questions: [],
      practised: {},
    });
    expect(lesson.pages).toHaveLength(1);
    expect(lesson.pages[0]?.photo).toBe(capture.photo);
    expect(lesson.pages[0]?.lines).toEqual([
      { text: '雨が降ります。', verified: true, sentenceId: 'capture:cap-1:0' },
      { text: '明日は晴れるでしょう。', verified: true, sentenceId: 'capture:cap-1:1' },
    ]);
  });

  it('is matched from its stored lines and what was added from it', async () => {
    const r = repos();
    await r.sentences.putMany([
      {
        id: 'capture:cap-1:0',
        text: '',
        source: 'capture',
        tokens: LINE_RAIN.tokens,
        wordIds: [],
        verified: true,
      },
    ]);
    const lesson = await rematchScan(r, scanFromCapture(capture), 5);
    expect(lesson.unmatched).toBeUndefined();
    expect(lesson.items.map((i) => [i.kind, i.ref])).toEqual([
      ['kanji', '雨'],
      ['word', 's3'],
      ['word', 's4'],
      ['grammar', 'deshou'],
    ]);
  });
});

describe('titleFromLines', () => {
  it('cuts a long first line and drops its closing punctuation', () => {
    expect(titleFromLines(['日本には地域によって様々な方言があるが、若い人は標準語を話す。'])).toBe(
      '日本には地域によって様々な方言があるが、…',
    );
    expect(titleFromLines([])).toBe('');
  });
});
