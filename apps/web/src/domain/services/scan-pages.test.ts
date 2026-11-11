import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import {
  HANDOUT_PAGE,
  KANJI_PAGE,
  LINE_RAIN,
  ORDERED_PAGE,
  scanDictionary,
} from '../../test/scan-fixtures.ts';
import { buildScan, type PageDraft } from './scan-build.ts';
import { withKept } from './scan-choice.ts';
import {
  exerciseParam,
  exerciseQuestions,
  parseExercise,
  scanPages,
  unsupportedCount,
} from './scan-pages.ts';
import { buildScanPractice } from './scan-practice.ts';
import { emptyScan } from './scans.ts';

const NOW = Date.parse('2026-11-10T10:00:00Z');

async function lessonOf(pages: readonly PageDraft[]) {
  const repos = createMemoryRepos({ dictionary: scanDictionary(), settings: { learnerLevel: 5 } });
  const base = emptyScan({ id: 'scan1', now: NOW });
  return { repos, lesson: (await buildScan(repos, { base, pages, level: 5 })).lesson };
}

describe('scanPages', () => {
  it('gives a page in its printed order, each exercise with its questions', async () => {
    const { lesson } = await lessonOf([KANJI_PAGE, ORDERED_PAGE]);
    const [, page] = scanPages(lesson);
    expect(page?.unordered).toBe(false);
    expect(page?.blocks.map((block) => block.kind)).toEqual([
      'instruction',
      'exercise',
      'unsupported',
    ]);
    expect(page?.blocks[0]?.lines).toEqual([{ index: 0, text: '正しいものを選びなさい。' }]);
    expect(page?.blocks[1]?.questions.map((q) => q.id)).toEqual(['1-1', '1-2']);
    expect(page?.blocks[2]).toMatchObject({
      lines: [{ index: 1, text: '①＿＿　②＿＿' }],
      reason: 'It needs the pictures.',
    });
    expect(unsupportedCount(lesson.pages[1] ?? {})).toBe(1);
    expect(unsupportedCount(lesson.pages[0] ?? {})).toBe(0);
  });

  it('shows a page stored without its order as its lines, then its exercises', async () => {
    const old = { ...HANDOUT_PAGE, lines: [LINE_RAIN] };
    const { lesson } = await lessonOf([old]);
    expect(lesson.pages[0]?.blocks).toBeUndefined();
    const [page] = scanPages(lesson);
    expect(page?.unordered).toBe(true);
    expect(page?.blocks.map((block) => [block.kind, block.lines.length])).toEqual([
      ['text', 1],
      ['exercise', 0],
    ]);
    expect(page?.blocks[1]?.questions).toHaveLength(2);
  });

  it('does not call pasted text unordered: it was never a printed page', async () => {
    const pasted: PageDraft = { kind: 'reading', lines: [LINE_RAIN], questions: [] };
    const { lesson } = await lessonOf([pasted]);
    expect(scanPages(lesson)[0]).toMatchObject({ unordered: false, blocks: [{ kind: 'text' }] });
  });

  it('names an exercise by its page and block, and finds its questions', async () => {
    const { lesson } = await lessonOf([KANJI_PAGE, ORDERED_PAGE]);
    const ref = parseExercise(exerciseParam({ page: 1, block: 1 }));
    expect(ref).toEqual({ page: 1, block: 1 });
    expect(exerciseQuestions(lesson, { page: 1, block: 1 }).map((q) => q.id)).toEqual([
      '1-1',
      '1-2',
    ]);
    expect(exerciseQuestions(lesson, { page: 1, block: 2 })).toEqual([]);
    expect(exerciseQuestions(lesson, { page: 9, block: 0 })).toEqual([]);
    expect(parseExercise('nope')).toBeUndefined();
    expect(parseExercise(null)).toBeUndefined();
  });
});

describe('practising one exercise', () => {
  it('asks its kept questions in printed order, and nothing else of the lesson', async () => {
    const { repos, lesson } = await lessonOf([KANJI_PAGE, ORDERED_PAGE]);
    const options = { now: NOW, listening: false, exercise: { page: 1, block: 1 } };
    const all = await buildScanPractice(repos, lesson, options);
    expect(all.map((card) => card.key)).toEqual(['question:1-1', 'question:1-2']);
    const some = withKept(lesson, ['question:1-1'], false);
    const kept = await buildScanPractice(repos, some, options);
    expect(kept.map((card) => card.key)).toEqual(['question:1-2']);
    // Practised or not, the exercise can be done again.
    const done = { ...lesson, practised: { 'question:1-1': NOW, 'question:1-2': NOW } };
    expect(await buildScanPractice(repos, done, options)).toHaveLength(2);
  });
});
