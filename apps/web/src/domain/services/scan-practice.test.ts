import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import {
  GRAMMAR_PAGE,
  HANDOUT_PAGE,
  KANJI_PAGE,
  LINE_RAIN,
  packSentence,
  scanDictionary,
  SCAN_WORDS as W,
} from '../../test/scan-fixtures.ts';
import type { Repos } from '../repos.ts';
import type { ScannedLesson } from '../scan-types.ts';
import { newWordItem } from './items.ts';
import {
  gradeHandout,
  recordScanDrill,
  recordScanQuestion,
  recordScanReading,
} from './scan-answer.ts';
import { buildScan } from './scan-build.ts';
import { buildScanPractice } from './scan-practice.ts';
import { scanPracticeMinutes, scanProgress } from './scan-progress.ts';
import { countScanCard, prepareScanCard, scanSessionCards } from './scan-session.ts';
import { describeScanItems, kanjiReadings } from './scan-view.ts';
import { deleteScan, emptyScan, saveScan } from './scans.ts';
import { buildSession } from './session.ts';

const NOW = Date.parse('2026-10-25T10:00:00Z');

async function setup(): Promise<{ r: Repos; lesson: ScannedLesson }> {
  const r = createMemoryRepos({ dictionary: scanDictionary(), settings: { learnerLevel: 5 } });
  await r.sentences.put(packSentence('tatoeba:1', LINE_RAIN));
  const base = emptyScan({ id: 'scan1', now: NOW });
  const built = await buildScan(r, {
    base,
    pages: [KANJI_PAGE, GRAMMAR_PAGE, HANDOUT_PAGE],
    level: 5,
  });
  await saveScan(r, built, NOW);
  const lesson = await r.scans.get('scan1');
  if (!lesson) throw new Error('not saved');
  return { r, lesson };
}

describe('describeScanItems', () => {
  it('labels each item with our meaning, level and the learner state', async () => {
    const { r, lesson } = await setup();
    await r.items.put(newWordItem({ wordId: W.hare.id, kind: 'import', now: 0, level: 3 }));
    await r.kanjiReadings.put({
      id: '雨:あめ',
      kanji: '雨',
      reading: 'あめ',
      level: 1,
      wordIds: [],
    });
    const views = await describeScanItems(r, lesson);
    const by = (text: string) => views.find((v) => v.text === text);
    expect(by('雨')).toMatchObject({
      meaning: 'rain',
      jlpt: 5,
      state: 'learning',
      reading: 'ウ・あめ',
    });
    expect(by('晴')).toMatchObject({ jlpt: 3, state: 'not-started', reading: 'セイ・は(れる)' });
    expect(by('晴れ')).toMatchObject({ reading: 'はれ', jlpt: 4, state: 'known', inLists: true });
    expect(by('曇')).toMatchObject({ inLists: false, meaning: 'cloudy' });
    expect(by('雪見日和')).toMatchObject({
      inLists: false,
      reading: 'ゆきみびより',
      readingVerified: false,
    });
    // N5 grammar is at an N5 learner's level: still to learn, not counted as known.
    expect(by('〜でしょう')).toMatchObject({ jlpt: 5, state: 'not-started', sentences: 0 });
    expect(by('〜そうだ (様子)')).toMatchObject({ jlpt: 4, state: 'not-started' });
  });

  it('formats kanji readings, on first, kun with okurigana in brackets', () => {
    const kanji = {
      char: '生',
      meanings: [],
      on: ['セイ', 'ショウ'],
      kun: ['い.きる', 'う.む', 'なま'],
      components: [],
    };
    expect(kanjiReadings(kanji)).toBe('セイ・ショウ・い(きる)・う(む)');
  });
});

describe('scanProgress', () => {
  it('counts items in our lists and questions, per kind and handout page', async () => {
    const { lesson } = await setup();
    const fresh = scanProgress(lesson);
    expect(fresh.parts).toEqual([
      { kind: 'kanji', done: 0, total: 2 },
      { kind: 'word', done: 0, total: 2 },
      { kind: 'grammar', done: 0, total: 2 },
      { kind: 'questions', page: 2, done: 0, total: 2 },
    ]);
    expect(fresh.total).toBe(8);
    expect(fresh.lastPractisedAt).toBeUndefined();
    const some = scanProgress({
      ...lesson,
      practised: { 'kanji:雨': NOW, 'question:2-1': NOW + 5 },
    });
    expect(some.done).toBe(2);
    expect(some.lastPractisedAt).toBe(NOW + 5);
  });
});

describe('buildScanPractice', () => {
  it('crosses the items with pack sentences and adds the handout questions', async () => {
    const { r, lesson } = await setup();
    const cards = await buildScanPractice(r, lesson, { now: NOW, listening: false, size: 30 });
    const keys = cards.map((c) => c.key);
    expect(keys).toContain('kanji:雨');
    expect(keys).toContain('word:s1');
    expect(keys).toContain('question:2-1');
    expect(keys).toContain('question:2-2');
    expect(keys.some((k) => k.startsWith('kanji:曇'))).toBe(false);
    // 雨 is read in the pack sentence that uses it.
    const rain = cards.find((c) => c.key === 'kanji:雨');
    expect(rain?.kind === 'card' && rain.card.sentence.id).toBe('tatoeba:1');
  });

  it('puts what was not practised yet first and keeps to its size', async () => {
    const { r, lesson } = await setup();
    const practised = { ...lesson, practised: { 'kanji:雨': NOW, 'kanji:晴': NOW } };
    const cards = await buildScanPractice(r, practised, { now: NOW, listening: false, size: 4 });
    expect(cards).toHaveLength(4);
    expect(cards[0]?.key).toBe('word:s1');
  });
});

describe('scan answers', () => {
  it('a right reading tracks the word with a scan source and counts it', async () => {
    const { r, lesson } = await setup();
    const cards = await buildScanPractice(r, lesson, { now: NOW, listening: false, size: 30 });
    const card = cards.find((c) => c.key === 'kanji:雨');
    if (card?.kind !== 'card') throw new Error('no card');
    const target = card.card.targets.find((t) => t.wordId === W.ame.id);
    if (!target) throw new Error('no target');
    const base = { lessonId: 'scan1', key: card.key, durationMs: 2000, now: NOW };
    const grade = await recordScanReading(r, {
      ...base,
      card: card.card,
      target,
      answer: 'あめ',
      mode: 'typed',
    });
    expect(grade.verdict).toBe('correct');
    const item = await r.items.get(`word:${W.ame.id}`);
    expect(item?.source).toMatchObject({ kind: 'scan', scanId: 'scan1' });
    expect(item?.level).toBe(1);
    expect(item?.card?.reps).toBe(1);
    expect((await r.scans.get('scan1'))?.practised['kanji:雨']).toBe(NOW);
  });

  it('nothing from a scan is introduced in the daily session, its reviews come back', async () => {
    const { r } = await setup();
    await r.items.put({
      ...newWordItem({ wordId: W.yohou.id, kind: 'scan', now: NOW }),
      source: { kind: 'scan', scanId: 'scan1', week: '2026-W43', addedAt: NOW },
    });
    const later = NOW + 60_000;
    const cards = await buildSession(r, { now: later, size: 5 });
    expect(cards.some((c) => c.targets.some((t) => t.wordId === W.yohou.id))).toBe(false);
    expect(cards.some((c) => c.sentence.id.startsWith('capture:'))).toBe(false);
  });

  it('a grammar drill reviews the point, created from the scan', async () => {
    const { r } = await setup();
    const drill = {
      kind: 'cloze' as const,
      sentence: packSentence('tatoeba:1', LINE_RAIN),
      grammarId: 'deshou',
      itemId: 'grammar:deshou' as const,
      meaning: '',
      start: 0,
      end: 1,
      choices: [
        { grammarId: 'deshou', pattern: 'でしょう' },
        { grammarId: 'darou', pattern: 'だろう' },
      ],
    };
    const base = { lessonId: 'scan1', key: 'grammar:deshou', durationMs: 1000, now: NOW };
    const grade = await recordScanDrill(r, { ...base, drill, step: 0, answer: 'deshou' });
    expect(grade.verdict).toBe('correct');
    const item = await r.items.get('grammar:deshou');
    expect(item?.source.kind).toBe('scan');
    expect(item?.card?.reps).toBe(1);
  });

  it('grades handout answers against the tutor’s and moves what they practise', async () => {
    const { r, lesson } = await setup();
    const [choose, reading] = lesson.questions;
    if (!(choose && reading)) throw new Error('no questions');
    expect(gradeHandout(choose, ' そう ').verdict).toBe('correct');
    expect(gradeHandout(choose, 'よう').verdict).toBe('wrong');
    expect(gradeHandout(reading, 'てんきよほー').verdict).not.toBe('correct');
    expect(gradeHandout(choose, '', true).skipped).toBe(true);
    const base = { lessonId: 'scan1', durationMs: 1000, now: NOW };
    await recordScanQuestion(r, { ...base, question: choose, answer: 'そう' });
    expect((await r.items.get('grammar:sou-look'))?.card?.reps).toBe(1);
    await recordScanQuestion(r, { ...base, question: reading, answer: 'てんきよほう' });
    expect((await r.items.get(`word:${W.yohou.id}`))?.level).toBe(1);
    const saved = await r.scans.get('scan1');
    expect(Object.keys(saved?.practised ?? {}).sort()).toEqual(
      ['grammar:sou-look', 'kanji:雨', 'question:2-1', 'question:2-2', 'word:s1'].sort(),
    );
  });
});

describe('a scanned lesson as a reading session', () => {
  it('marks every card with its lesson and key, handout questions with the question', async () => {
    const { r } = await setup();
    const cards = await buildSession(r, { now: NOW, scan: 'scan1', listening: false });
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((card) => card.scan?.lessonId === 'scan1')).toBe(true);
    const handout = cards.find((card) => card.handout);
    expect(handout).toMatchObject({ reason: 'drill', targets: [], scan: { key: 'question:2-1' } });
    expect(await buildSession(r, { now: NOW, scan: 'gone' })).toEqual([]);
  });

  it('tracks what a card practises before the answer, and counts it once right', async () => {
    const { r } = await setup();
    const cards = await scanSessionCards(r, 'scan1', { now: NOW, listening: false });
    const reading = cards.find((card) => card.scan?.key === 'kanji:雨');
    if (!reading) throw new Error('no card');
    await prepareScanCard(r, reading, NOW);
    expect((await r.items.get(`word:${W.ame.id}`))?.source).toMatchObject({ kind: 'scan' });
    await countScanCard(r, reading, false, NOW);
    expect((await r.scans.get('scan1'))?.practised).toEqual({});
    await countScanCard(r, reading, true, NOW);
    expect((await r.scans.get('scan1'))?.practised).toEqual({ 'kanji:雨': NOW });
  });

  it('takes the learner’s own mark for a free answer', async () => {
    const { r, lesson } = await setup();
    const [question] = lesson.questions;
    if (!question) throw new Error('no question');
    const free = { ...question, type: 'free' as const };
    const base = { lessonId: 'scan1', durationMs: 1000, now: NOW };
    const kept = await recordScanQuestion(r, {
      ...base,
      question: free,
      answer: 'x',
      selfMarked: true,
    });
    expect(kept.verdict).toBe('correct');
    const not = await recordScanQuestion(r, {
      ...base,
      question: free,
      answer: 'そう',
      selfMarked: false,
    });
    expect(not.verdict).toBe('wrong');
  });

  it('estimates the practice in minutes and deletes a lesson with its lines', async () => {
    const { r, lesson } = await setup();
    expect(scanPracticeMinutes(lesson)).toBe(4);
    const line = lesson.pages[0]?.lines[0]?.sentenceId ?? '';
    expect(await r.sentences.get(line)).toBeDefined();
    await deleteScan(r, 'scan1');
    expect(await r.scans.get('scan1')).toBeUndefined();
    expect(await r.sentences.get(line)).toBeUndefined();
  });
});
