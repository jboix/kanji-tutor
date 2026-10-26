import { describe, expect, it, vi } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import type { Repos } from '../repos.ts';
import { unitById } from '../themes/index.ts';
import type { KnowledgeLevel } from '../types.ts';
import { newWordItem } from './items.ts';
import { lessonPlan } from './lesson-plan.ts';
import { sharedReads } from './read-cache.ts';
import { meetsDone } from './unit-path.ts';
import {
  finishLessonPart,
  lessonNext,
  markUnitDone,
  markUnitRead,
  startLessonSection,
  startUnit,
  unitPath,
  unitView,
} from './units.ts';

async function know(repos: Repos, ids: readonly string[], level: KnowledgeLevel = 3) {
  await repos.items.putMany(
    ids.map((wordId) => newWordItem({ wordId, kind: 'import', now: NOW, level })),
  );
}

async function rightGrammar(repos: Repos, ids: readonly string[]) {
  for (const id of ids) {
    await repos.reviews.add({
      at: NOW,
      itemId: `grammar:${id}`,
      answer: 'x',
      expected: 'x',
      verdict: 'correct',
      durationMs: 1000,
      mode: 'drill',
    });
  }
}

describe('the unit path (T3, T4)', () => {
  it('starts a learner from zero on the first N5 unit, its words first', async () => {
    const repos = await curriculumRepos();
    const path = await unitPath(repos, NOW);
    expect(path.level).toBe(5);
    expect(path.current?.unit.id).toBe('i-am-a-student');
    expect(path.current).toMatchObject({ state: 'current', step: 'words', review: false });
    expect(path.current?.words.total).toBeGreaterThanOrEqual(5);
    expect(path.units).toHaveLength(41);
    const later = path.units.find((v) => v.unit.id === 'self-introduction');
    expect(later?.state).toBe('not-started');
    // Units the installed packs lack cannot be worked on.
    expect(path.units.find((v) => v.unit.level === 4)?.pack).toBeUndefined();
  });

  it('moves through the lesson sections (S3), then counts the unit done and goes on', async () => {
    const repos = await curriculumRepos();
    const id = 'i-am-a-student';
    await startLessonSection(repos, id, 'words', 2, NOW);
    let view = await unitView(repos, id, NOW);
    expect(view).toMatchObject({ state: 'current', step: 'words' });
    expect((await repos.settings.get()).activeUnit).toBe(id);
    await finishLessonPart(repos, id, 'words', 1, NOW);
    expect((await unitView(repos, id, NOW))?.progress.sections?.words).toMatchObject({
      parts: 2,
      done: 1,
    });
    expect(await lessonNext(repos, id)).toEqual({ section: 'words', part: 2 });
    await finishLessonPart(repos, id, 'words', 2, NOW);
    expect((await unitView(repos, id, NOW))?.step).toBe('grammar');
    await finishLessonPart(repos, id, 'grammar', 1, NOW);
    await finishLessonPart(repos, id, 'practice', 1, NOW);
    expect((await unitView(repos, id, NOW))?.step).toBe('reading');
    await finishLessonPart(repos, id, 'reading', 1, NOW);
    view = await unitView(repos, id, NOW);
    expect(view?.step).toBe('review');
    expect(view?.progress.readAt).toBe(NOW);
    await finishLessonPart(repos, id, 'review', 1, NOW);
    expect(await lessonNext(repos, id)).toBeUndefined();
    // Every section done, the words not known yet: the unit is done and the path goes on.
    const path = await unitPath(repos, NOW);
    expect(path.units[0]).toMatchObject({ state: 'done', step: 'done' });
    expect(path.current?.unit.id).toBe('self-introduction');
    expect((await repos.settings.get()).unitStatus?.[id]?.doneAt).toBe(NOW);
  });

  it('stores every unit that became done in one write, and reads the path once per view', async () => {
    const repos = await curriculumRepos();
    const ids = ['i-am-a-student', 'self-introduction'];
    const first = await unitPath(repos, NOW);
    for (const id of ids) {
      await know(repos, first.units.find((v) => v.unit.id === id)?.wordIds ?? []);
      await rightGrammar(repos, unitById(id)?.grammar ?? []);
    }
    const patch = vi.spyOn(repos.settings, 'patch');
    const units = vi.spyOn(repos.units, 'all');
    const shared = sharedReads(repos);
    await Promise.all([unitPath(shared, NOW), unitPath(shared, NOW)]);
    expect(patch).toHaveBeenCalledTimes(1);
    expect(units).toHaveBeenCalledTimes(1);
    const status = (await repos.settings.get()).unitStatus ?? {};
    expect(ids.map((id) => status[id]?.doneAt)).toEqual([NOW, NOW]);
  });

  it('counts the Read step of the earlier path as 読み物 done', async () => {
    const repos = await curriculumRepos();
    await markUnitRead(repos, 'i-am-a-student', NOW);
    for (const section of ['words', 'grammar', 'practice'] as const) {
      await finishLessonPart(repos, 'i-am-a-student', section, 1, NOW);
    }
    expect((await unitView(repos, 'i-am-a-student', NOW))?.step).toBe('review');
  });

  it('keeps a unit opened early as the active lesson until it is done', async () => {
    const repos = await curriculumRepos();
    await startUnit(repos, 'my-day', NOW);
    const path = await unitPath(repos, NOW);
    expect(path.current?.unit.id).toBe('my-day');
    expect(path.units.find((v) => v.unit.id === 'self-introduction')?.state).toBe('not-started');
    expect(await unitView(repos, 'nope', NOW)).toBeUndefined();
  });

  it('treats units below the level as review units that can be marked done or skipped', async () => {
    const repos = await curriculumRepos();
    await repos.settings.patch({ learnerLevel: 4 });
    await markUnitDone(repos, 'family', NOW);
    await markUnitDone(repos, 'my-day', NOW, true);
    const path = await unitPath(repos, NOW);
    expect(path.current).toBeUndefined();
    const family = path.units.find((v) => v.unit.id === 'family');
    expect(family).toMatchObject({ review: true, state: 'done', skipped: false });
    expect(path.units.find((v) => v.unit.id === 'my-day')).toMatchObject({ skipped: true });
  });

  it('needs 80% of the words and every grammar point', () => {
    const counts = (known: number, reviewed: number) => ({
      words: { known, met: known, total: 10 },
      grammar: { reviewed, total: 3 },
    });
    expect(meetsDone(counts(8, 3))).toBe(true);
    expect(meetsDone(counts(7, 3))).toBe(false);
    expect(meetsDone(counts(10, 2))).toBe(false);
    expect(
      meetsDone({ words: { known: 0, met: 0, total: 0 }, grammar: { reviewed: 0, total: 0 } }),
    ).toBe(false);
  });
});

describe('lessonPlan (V1, T3)', () => {
  it('takes new words from the current unit, then the first cluster', async () => {
    const repos = await curriculumRepos();
    const plan = await lessonPlan(repos, { now: NOW, levels: new Map() });
    expect(plan.unit?.unit.id).toBe('i-am-a-student');
    expect(plan.fresh.slice(0, plan.unit?.wordIds.length)).toEqual(plan.unit?.wordIds);
    const first = (await repos.clusters.byLevel(5))[0];
    expect(plan.fresh).toContain(first?.wordIds[0]);
    expect(plan.preferred.length).toBeGreaterThan(0);
    expect(plan.grammar).toEqual(unitById('i-am-a-student')?.grammar);
    const taught = new Map(plan.unit?.wordIds.map((id) => [id, 4] as const));
    expect(plan.gate).toEqual({ level: 5, stretch: new Set(), taught });
  });

  it('never gates out the words of the current or an opened unit', async () => {
    const repos = await curriculumRepos();
    await startUnit(repos, 'family', NOW);
    const plan = await lessonPlan(repos, { now: NOW, levels: new Map() });
    const path = await unitPath(repos, NOW);
    const family = path.units.find((v) => v.unit.id === 'family');
    expect(plan.unit?.unit.id).toBe('family');
    expect([...(plan.gate.taught?.keys() ?? [])]).toEqual(family?.wordIds);
    await markUnitRead(repos, 'family', NOW);
    const practise = await lessonPlan(repos, { now: NOW, levels: new Map(), unit: 'my-day' });
    for (const id of [...(family?.wordIds ?? []), ...(practise.unit?.wordIds ?? [])]) {
      expect(practise.gate.taught?.get(id), id).toBe(4);
    }
  });

  it('follows the class lesson instead, whose words may be one level harder', async () => {
    const repos = await curriculumRepos();
    await repos.settings.patch({ currentLesson: 'L1', learnerLevel: 4 });
    await repos.items.put(newWordItem({ wordId: '1', kind: 'textbook', now: NOW, lesson: 'L1' }));
    const plan = await lessonPlan(repos, { now: NOW, levels: new Map() });
    expect(plan.unit).toBeUndefined();
    expect(plan.fresh).toEqual([]);
    expect([...plan.gate.stretch]).toEqual(['1']);
  });

  it('teaches a practised unit’s words one level above the learner', async () => {
    const repos = await curriculumRepos();
    await repos.settings.patch({ learnerLevel: 4 });
    const plan = await lessonPlan(repos, { now: NOW, levels: new Map(), unit: 'family' });
    expect(plan.unit?.unit.id).toBe('family');
    expect(plan.gate.stretch.size).toBe(0);
    expect([...(plan.gate.taught?.keys() ?? [])]).toEqual(plan.unit?.wordIds);
    expect(new Set(plan.gate.taught?.values())).toEqual(new Set([3]));
    const n3 = await lessonPlan(repos, { now: NOW, levels: new Map(), unit: 'nope' });
    expect(n3.unit).toBeUndefined();
  });
});
