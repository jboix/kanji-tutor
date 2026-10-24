import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import type { Repos } from '../repos.ts';
import type { GrammarPoint, KnowledgeLevel } from '../types.ts';
import { acceptComposition } from './compose.ts';
import {
  addGrammarPoint,
  composeTarget,
  grammarIdFor,
  isGrammarUsed,
  lessonGrammar,
  nextComposeTarget,
} from './grammar.ts';
import { todaySummary } from './summary.ts';

const NOW = Date.UTC(2026, 9, 18, 9, 0);
const LESSON = 'Tobira 第4課';

function point(id: string, lesson: string | undefined = LESSON): GrammarPoint {
  const p: GrammarPoint = {
    id,
    pattern: `〜${id}`,
    meaning: `meaning of ${id}`,
    exampleSentenceIds: [],
  };
  if (lesson !== undefined) p.lesson = lesson;
  return p;
}

async function seed(repos: Repos, points: GrammarPoint[], levels: Record<string, KnowledgeLevel>) {
  for (const p of points) await repos.grammar.put(p);
  for (const [id, level] of Object.entries(levels)) {
    await repos.items.put({
      id: `grammar:${id}`,
      kind: 'grammar',
      ref: id,
      level,
      source: { kind: 'manual', lesson: LESSON, week: '2026-W42', addedAt: NOW },
      updatedAt: NOW,
    });
  }
}

describe('nextComposeTarget', () => {
  it('goes on to the next unused point of the same lesson, round from the one written', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    await seed(repos, [point('a'), point('x', 'Other'), point('b'), point('c')], { b: 4 });
    expect(await nextComposeTarget(repos, 'b')).toEqual({
      grammar: point('c'),
      position: 3,
      total: 3,
    });
    await seed(repos, [], { c: 3 });
    expect((await nextComposeTarget(repos, 'c'))?.grammar.id).toBe('a');
  });

  it('is undefined once every other point is used, or for a point that is gone', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    await seed(repos, [point('a'), point('b')], { a: 3 });
    expect(await nextComposeTarget(repos, 'b')).toBeUndefined();
    expect(await nextComposeTarget(createMemoryRepos(), 'gone')).toBeUndefined();
  });
});

describe('composeTarget', () => {
  it('is undefined with no grammar points', async () => {
    expect(await composeTarget(createMemoryRepos())).toBeUndefined();
  });

  it('picks the first unused point of the current lesson, with its position', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    await seed(repos, [point('a'), point('x', 'Other'), point('b'), point('c')], { a: 3, b: 1 });
    expect(await composeTarget(repos)).toEqual({ grammar: point('b'), position: 2, total: 3 });
  });

  it('agrees with Today on the next point and on the used count after accepting', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    await seed(repos, [point('a'), point('b'), point('c')], { a: 4, b: 1 });
    const before = await todaySummary(repos, NOW);
    const target = await composeTarget(repos);
    expect(target?.grammar.id).toBe(before.progress.nextGrammar?.id);
    expect(before.progress.grammar).toEqual({ done: 1, total: 3 });
    const correction = { corrected: '文。', marks: [], usesTarget: true, readings: [] };
    await acceptComposition(repos, { grammar: point('b'), original: '文。', correction, now: NOW });
    const after = await todaySummary(repos, NOW);
    expect(after.progress.grammar).toEqual({ done: 2, total: 3 });
    expect(after.progress.nextGrammar?.id).toBe('c');
    expect((await composeTarget(repos))?.grammar.id).toBe('c');
  });

  it('falls back to the first point once all are used', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    await seed(repos, [point('a'), point('b')], { a: 3, b: 4 });
    expect((await composeTarget(repos))?.grammar.id).toBe('a');
  });

  it('takes the point from the query, placed among its own lesson', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    await seed(repos, [point('a'), point('x', 'Other'), point('y', 'Other')], {});
    expect(await composeTarget(repos, 'y')).toEqual({
      grammar: point('y', 'Other'),
      position: 2,
      total: 2,
    });
    expect((await composeTarget(repos, 'missing'))?.grammar.id).toBe('a');
  });

  it('counts every point when it has no lesson', async () => {
    const repos = createMemoryRepos();
    await seed(repos, [point('a', undefined), point('b')], {});
    expect(await composeTarget(repos, 'a')).toEqual({
      grammar: point('a', undefined),
      position: 1,
      total: 2,
    });
  });
});

describe('lessonGrammar', () => {
  it('uses every point when the current lesson has none', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: 'Empty' } });
    await seed(repos, [point('a'), point('b', 'Other')], {});
    expect((await lessonGrammar(repos)).map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('isGrammarUsed', () => {
  it('needs level 3 or a compose source', () => {
    const base = {
      id: 'grammar:a' as const,
      kind: 'grammar' as const,
      ref: 'a',
      source: { kind: 'manual' as const, week: 'w', addedAt: 0 },
      updatedAt: 0,
    };
    expect(isGrammarUsed(undefined)).toBe(false);
    expect(isGrammarUsed({ ...base, level: 2 })).toBe(false);
    expect(isGrammarUsed({ ...base, level: 3 })).toBe(true);
    expect(isGrammarUsed({ ...base, level: 1, source: { ...base.source, kind: 'compose' } })).toBe(
      true,
    );
  });
});

describe('addGrammarPoint', () => {
  it('saves the point and a level-1 manual item tagged to the current lesson', async () => {
    const repos = createMemoryRepos({ settings: { currentLesson: LESSON } });
    const added = await addGrammarPoint(repos, {
      pattern: ' 〜わけではない ',
      meaning: " It's not that… ",
      now: NOW,
    });
    expect(added).toEqual({
      id: 'わけではない',
      pattern: '〜わけではない',
      meaning: "It's not that…",
      lesson: LESSON,
      exampleSentenceIds: [],
    });
    const item = await repos.items.get('grammar:わけではない');
    expect(item?.level).toBe(1);
    expect(item?.kind).toBe('grammar');
    expect(item?.card?.due).toBe(NOW);
    expect(item?.source).toEqual({
      kind: 'manual',
      lesson: LESSON,
      week: '2026-W42',
      addedAt: NOW,
    });
  });

  it('keeps an existing point and allows no lesson', async () => {
    const repos = createMemoryRepos();
    const first = await addGrammarPoint(repos, { pattern: '〜ばかり', meaning: 'only', now: NOW });
    expect(first.lesson).toBeUndefined();
    expect((await repos.items.get('grammar:ばかり'))?.source.lesson).toBeUndefined();
    const again = await addGrammarPoint(repos, {
      pattern: '~ばかり',
      meaning: 'x',
      lesson: 'L',
      now: 1,
    });
    expect(again).toEqual(first);
  });

  it('rejects an empty pattern', async () => {
    await expect(
      addGrammarPoint(createMemoryRepos(), { pattern: ' 〜 ', meaning: 'x', now: NOW }),
    ).rejects.toThrow('pattern');
    expect(grammarIdFor('～ ても いい')).toBe('てもいい');
  });
});
