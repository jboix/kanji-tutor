import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import type { KanjiReading } from '../types.ts';
import {
  choosePractice,
  lastPartAt,
  learningReading,
  type NextLesson,
  nextLesson,
  resolveStart,
  startPlan,
} from './start-plan.ts';
import { unitPath } from './units.ts';

const HOUR = 3_600_000;
const lesson = (due: boolean): NextLesson => ({
  unit: 'i-am-a-student',
  section: 'grammar',
  part: 2,
  due,
});

describe('resolveStart (IA3)', () => {
  it('plays the due lesson part first on the daily mix, then the mix', () => {
    expect(resolveStart({ choice: 'mix', lesson: lesson(true) })).toEqual({
      kind: 'lesson',
      unit: 'i-am-a-student',
      section: 'grammar',
      part: 2,
    });
    expect(resolveStart({ choice: 'mix', lesson: lesson(false) })).toEqual({ kind: 'mix' });
    expect(resolveStart({ choice: 'mix' })).toEqual({ kind: 'mix' });
  });

  it('plays the next lesson part on Next lesson, due or not, else the mix', () => {
    expect(resolveStart({ choice: 'lesson', lesson: lesson(false) })).toMatchObject({
      kind: 'lesson',
      part: 2,
    });
    expect(resolveStart({ choice: 'lesson' })).toEqual({ kind: 'mix' });
  });

  it('follows reading, grammar and kanji, with or without a focus', () => {
    expect(resolveStart({ choice: 'reading', lesson: lesson(true) })).toEqual({ kind: 'reading' });
    expect(resolveStart({ choice: 'grammar', grammar: 'desu' })).toEqual({
      kind: 'grammar',
      grammar: 'desu',
    });
    expect(resolveStart({ choice: 'grammar' })).toEqual({ kind: 'grammar' });
    const focus = { kanji: '生', reading: 'セイ' };
    expect(resolveStart({ choice: 'kanji', kanji: focus })).toEqual({ kind: 'kanji', focus });
    expect(resolveStart({ choice: 'kanji' })).toEqual({ kind: 'kanji' });
  });
});

describe('the next lesson part', () => {
  it('is due until a part is finished today, in any unit', () => {
    const status = { a: { sections: { words: { parts: 2, done: 1, at: NOW - 30 * HOUR } } } };
    expect(lastPartAt(status)).toBe(NOW - 30 * HOUR);
    expect(lastPartAt({ b: { sections: { words: { parts: 2, done: 0 } } } })).toBe(0);
    expect(lastPartAt({})).toBe(0);
  });

  it('takes the first part not done of the current section', async () => {
    const repos = await curriculumRepos();
    const { current } = await unitPath(repos, NOW);
    expect(nextLesson(current, NOW, 0)).toEqual({
      unit: 'i-am-a-student',
      section: 'words',
      part: 1,
      due: true,
    });
    expect(nextLesson(current, NOW, startOfDay(NOW) + 1)?.due).toBe(false);
    expect(nextLesson(current, NOW, startOfDay(NOW) - 1)?.due).toBe(true);
    expect(nextLesson(undefined, NOW, 0)).toBeUndefined();
  });
});

function startOfDay(at: number): number {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

describe('learningReading', () => {
  const row = (id: string, level: 0 | 1 | 2 | 3, words: number): KanjiReading => {
    const [kanji = '', reading = ''] = id.split(':');
    return { id, kanji, reading, level, wordIds: Array.from({ length: words }, (_, i) => `${i}`) };
  };

  it('picks a reading being learned, with the most words', () => {
    const rows = [
      row('生:セイ', 3, 9),
      row('生:ショウ', 1, 2),
      row('学:ガク', 2, 4),
      row('日:ニチ', 0, 9),
    ];
    expect(learningReading(rows)).toEqual({ kanji: '学', reading: 'ガク' });
    expect(learningReading([row('生:セイ', 3, 9)])).toBeUndefined();
  });
});

describe('startPlan', () => {
  it('starts a learner from zero on the first unit, then follows the saved choice', async () => {
    const repos = await curriculumRepos();
    expect(await startPlan(repos, NOW)).toEqual({
      kind: 'lesson',
      unit: 'i-am-a-student',
      section: 'words',
      part: 1,
    });
    await choosePractice(repos, 'reading');
    expect((await repos.settings.get()).practice).toBe('reading');
    expect(await startPlan(repos, NOW)).toEqual({ kind: 'reading' });
    const grammar = await startPlan(repos, NOW, 'grammar');
    expect(grammar).toMatchObject({ kind: 'grammar', grammar: expect.any(String) });
  });

  it('plays the daily mix for a learner following a class lesson', async () => {
    const repos = await curriculumRepos();
    await repos.settings.patch({ currentLesson: 'L1' });
    expect(await startPlan(repos, NOW, 'mix')).toEqual({ kind: 'mix' });
    expect(await startPlan(repos, NOW, 'lesson')).toEqual({ kind: 'mix' });
  });
});
