import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import {
  GRAMMAR_PAGE,
  HANDOUT_PAGE,
  KANJI_PAGE,
  LINE_DESHOU,
  LINE_RAIN,
  packSentence,
  scanDictionary,
} from '../../test/scan-fixtures.ts';
import type { ScannedLesson } from '../scan-types.ts';
import { buildScan, type PageDraft, rematchScan } from './scan-build.ts';
import { isKept, keptItems, keptQuestions, keysOfKinds, withKept } from './scan-choice.ts';
import { NOTHING_LISTED } from './scan-match.ts';
import { buildScanPractice } from './scan-practice.ts';
import { scanParts, scanProgress } from './scan-progress.ts';
import { emptyScan, saveScan } from './scans.ts';

const NOW = Date.parse('2026-11-10T10:00:00Z');

function repos() {
  return createMemoryRepos({ dictionary: scanDictionary(), settings: { learnerLevel: 3 } });
}

const base = () => emptyScan({ id: 'scan1', now: NOW });

/** A handout whose first line only says what to do; the tutor listed nothing from it. */
const INSTRUCTED: PageDraft = {
  kind: 'handout',
  lines: [{ ...LINE_RAIN, role: 'instruction' }, LINE_DESHOU],
  listed: NOTHING_LISTED,
  questions: [],
};

async function lessonOf(pages: readonly PageDraft[], level: 3 | 5 = 3): Promise<ScannedLesson> {
  const built = await buildScan(repos(), { base: base(), pages, level });
  return built.lesson;
}

describe('withKept', () => {
  it('leaves keys out and brings them back, with no list when all is kept', async () => {
    const lesson = await lessonOf([KANJI_PAGE]);
    expect(lesson.dropped).toBeUndefined();
    const some = withKept(lesson, ['kanji:雨', 'kanji:晴'], false);
    expect(some.dropped).toEqual(['kanji:雨', 'kanji:晴']);
    expect(isKept(some, 'kanji:雨')).toBe(false);
    expect(keptItems(some).some((item) => item.text === '雨')).toBe(false);
    const again = withKept(some, ['kanji:雨'], true);
    expect(again.dropped).toEqual(['kanji:晴']);
    expect('dropped' in withKept(again, ['kanji:晴'], true)).toBe(false);
  });

  it('names everything of a kind, questions included', async () => {
    const lesson = await lessonOf([KANJI_PAGE, HANDOUT_PAGE]);
    expect(keysOfKinds(lesson, ['kanji'])).toEqual(['kanji:雨', 'kanji:晴', 'kanji:曇']);
    expect(keysOfKinds(lesson, ['questions'])).toEqual(['question:1-1', 'question:1-2']);
    const none = withKept(lesson, keysOfKinds(lesson, ['questions']), false);
    expect(keptQuestions(none)).toEqual([]);
  });
});

describe('what starts left out', () => {
  it('is the kanji that only an instruction line uses', async () => {
    const lesson = await lessonOf([INSTRUCTED]);
    const kanji = lesson.items.filter((item) => item.kind === 'kanji');
    // 晴 of the content line comes first; 雨 is only in the instruction.
    expect(kanji.map((item) => [item.text, item.instruction ?? false])).toEqual([
      ['晴', false],
      ['雨', true],
    ]);
    expect(lesson.dropped).toEqual(['kanji:雨']);
    expect(lesson.pages[0]?.lines.map((line) => line.role)).toEqual(['instruction', undefined]);
  });

  it('is not a kanji another page teaches', async () => {
    const lesson = await lessonOf([INSTRUCTED, KANJI_PAGE]);
    expect(lesson.items.find((item) => item.text === '雨')?.instruction).toBeUndefined();
    expect(lesson.dropped).toBeUndefined();
  });

  it('is a grammar point found in instruction lines only', async () => {
    const page = { ...INSTRUCTED, lines: [{ ...LINE_DESHOU, role: 'instruction' as const }] };
    // At N5 the detectors list でしょう; a learner past it is not offered it at all.
    const lesson = await lessonOf([page], 5);
    expect(lesson.items.find((item) => item.ref === 'deshou')?.instruction).toBe(true);
    expect(lesson.dropped).toContain('grammar:deshou');
    // The tutor naming the pattern means the page teaches it.
    const listed = { ...NOTHING_LISTED, grammar: [{ text: '〜でしょう' }] };
    const taught = await lessonOf([{ ...page, listed }], 5);
    expect(taught.dropped ?? []).not.toContain('grammar:deshou');
  });

  it('never undoes the learner’s choice when the lesson is matched again', async () => {
    const r = repos();
    const built = await buildScan(r, { base: base(), pages: [INSTRUCTED], level: 3 });
    await saveScan(r, built, NOW);
    const chosen = withKept(withKept(built.lesson, ['kanji:雨'], true), ['kanji:晴'], false);
    const again = await rematchScan(r, chosen, 3);
    expect(again.items.find((item) => item.text === '雨')?.instruction).toBe(true);
    expect(again.dropped).toEqual(['kanji:晴']);
  });

  it('keeps an existing lesson’s choice when pages are added to it', async () => {
    const r = repos();
    const first = await buildScan(r, { base: base(), pages: [KANJI_PAGE], level: 3 });
    const chosen = withKept(first.lesson, ['kanji:晴'], false);
    const more = await buildScan(r, { base: chosen, pages: [GRAMMAR_PAGE], level: 3 });
    expect(more.lesson.dropped).toEqual(['kanji:晴']);
  });
});

describe('a lesson with things left out', () => {
  async function setup() {
    const r = repos();
    await r.sentences.put(packSentence('tatoeba:1', LINE_RAIN));
    const pages = [KANJI_PAGE, GRAMMAR_PAGE, HANDOUT_PAGE];
    const built = await buildScan(r, { base: base(), pages, level: 3 });
    const left = [...keysOfKinds(built.lesson, ['kanji']), 'question:2-1'];
    return { r, lesson: withKept(built.lesson, left, false) };
  }

  it('counts only what is kept, and still lists the part left out whole', async () => {
    const { lesson } = await setup();
    const progress = scanProgress({ ...lesson, practised: { 'kanji:雨': NOW } });
    expect(progress.parts.map((part) => part.kind)).toEqual(['word', 'grammar', 'questions']);
    expect(progress.done).toBe(0);
    expect(progress.parts.at(-1)).toEqual({
      kind: 'questions',
      done: 0,
      total: 1,
      left: 1,
    });
    expect(scanParts(lesson)[0]).toEqual({ kind: 'kanji', done: 0, total: 0, left: 2 });
  });

  it('practises only what is kept', async () => {
    const { r, lesson } = await setup();
    const cards = await buildScanPractice(r, lesson, { now: NOW, listening: false, size: 30 });
    const keys = new Set(cards.map((card) => card.key));
    expect(keys.has('question:2-2')).toBe(true);
    expect(keys.has('question:2-1')).toBe(false);
    expect([...keys].filter((key) => key.startsWith('kanji:'))).toEqual([]);
    expect([...keys].some((key) => key.startsWith('word:'))).toBe(true);
  });
});
