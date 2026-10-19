import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import type { SessionCard } from '../session-types.ts';
import {
  COMES_BACK,
  cardItems,
  coverageOf,
  currentSection,
  finishPart,
  nextPart,
  PART_SECONDS,
  sectionParts,
} from './lesson-sections.ts';
import { buildSession } from './session.ts';
import { cardType, longestRun } from './session-mix.ts';
import { sessionSeconds } from './session-outline.ts';
import {
  grammarSection,
  lessonData,
  lessonItems,
  reviewSection,
  withoutRuns,
  wordsSection,
} from './unit-lesson.ts';
import { finishLessonPart } from './units.ts';

const UNITS = ['i-am-a-student', 'self-introduction', 'family', 'my-day'] as const;

async function lesson(unit: string, listening = false) {
  const repos = await curriculumRepos();
  const data = await lessonData(repos, unit, { now: NOW, listening });
  if (!data) throw new Error(`no lesson ${unit}`);
  const words = wordsSection(data);
  const grammar = await grammarSection(data);
  const review = await reviewSection(data, [...words, ...grammar]);
  return { repos, data, words, grammar, review };
}

const drillKind = (card: SessionCard) => card.drill?.kind;
/** Spoken listening, not a sentence meaning check (which is shown, not spoken). */
const heard = (card: SessionCard) => card.drill?.kind === 'listening' && !card.drill.read;

describe('a unit lesson in sections (S3)', { timeout: 60_000 }, () => {
  it('言葉: reads each kanji word, then checks its meaning', async () => {
    const { data, words } = await lesson('i-am-a-student');
    const reads = words.filter((c) => cardType(c) === 'reading');
    const kanjiWords = data.words.filter((w) => /\p{Script=Han}/u.test(w.forms[0] ?? ''));
    expect(reads.map((c) => c.targets[0]?.wordId)).toEqual(
      expect.arrayContaining(kanjiWords.map((w) => w.id)),
    );
    for (const card of reads) expect(card).toMatchObject({ reason: 'new', sentence: { level: 5 } });
    const meanings = words.filter((c) => drillKind(c) === 'meaning');
    expect(meanings.length).toBe(data.words.length);
    // A word's meaning is checked after it is read, never before.
    for (const card of meanings) {
      const id = card.drill?.kind === 'meaning' ? card.drill.wordId : '';
      const read = words.findIndex((c) => c.targets[0]?.wordId === id);
      if (read >= 0) expect(words.indexOf(card)).toBeGreaterThan(read);
    }
  });

  it('文法: each point explained, then two to four drills on it', async () => {
    const { data, grammar } = await lesson('self-introduction');
    for (const id of data.unit.grammar) {
      const at = grammar.findIndex((c) => c.grammarIntro === id);
      expect(at, id).toBeGreaterThanOrEqual(0);
      const next = grammar.slice(at + 1);
      const end = next.findIndex((c) => c.grammarIntro !== undefined);
      const drills = end < 0 ? next : next.slice(0, end);
      expect(drills.length, id).toBeGreaterThanOrEqual(2);
      expect(drills.length, id).toBeLessThanOrEqual(4);
      for (const card of drills)
        expect(cardItems(card).flatMap((c) => c.items)).toContain(`grammar:${id}`);
    }
  });

  it('brings every word and point back at least three times, in different types', async () => {
    for (const unit of UNITS) {
      const { data, words, grammar, review } = await lesson(unit);
      const coverage = coverageOf([...words, ...grammar, ...review], lessonItems(data));
      for (const [key, types] of coverage) {
        expect(types.size, `${unit} ${key}: ${[...types].join(', ')}`).toBeGreaterThanOrEqual(
          COMES_BACK,
        );
      }
    }
  });

  it('keeps まとめ mixed: no type three times in a row when it can be helped', async () => {
    const { review } = await lesson('family');
    expect(review.length).toBeGreaterThan(0);
    expect(new Set(review.map(cardType)).size).toBeGreaterThan(1);
    const shuffled = withoutRuns(review);
    expect(longestRun(shuffled)).toBeLessThanOrEqual(Math.max(2, longestRun(review)));
  });

  it('offers listening only with a Japanese voice', async () => {
    const off = await lesson('family');
    const all = [...off.words, ...off.grammar, ...off.review];
    expect(all.some(heard)).toBe(false);
    const on = await lesson('family', true);
    expect(on.review.some(heard)).toBe(true);
  });

  it('builds each section as a session part, and its parts take about five minutes', async () => {
    const repos = await curriculumRepos();
    const unit = 'self-introduction';
    const words = await buildSession(repos, { now: NOW, unit, section: 'words', part: 1 });
    expect(words.length).toBeGreaterThan(0);
    expect(sessionSeconds(words)).toBeLessThanOrEqual(PART_SECONDS + 60);
    const status = (await repos.settings.get()).unitStatus?.[unit];
    expect(status?.sections?.words?.parts).toBeGreaterThanOrEqual(1);
    expect(status?.introducedAt).toBe(NOW);
    const reading = await buildSession(repos, { now: NOW, unit, section: 'reading' });
    expect(reading).toHaveLength(1);
    expect(reading[0]?.passage).toBeDefined();
    const practice = await buildSession(repos, { now: NOW, unit, section: 'practice' });
    expect(practice.some((c) => c.passage)).toBe(false);
    expect(practice.some((c) => cardType(c) === 'reading')).toBe(true);
    const grammar = await buildSession(repos, { now: NOW, unit, section: 'grammar', part: 9 });
    expect(grammar.length).toBeGreaterThan(0);
    expect(await buildSession(repos, { now: NOW, unit: 'nope', section: 'words' })).toEqual([]);
  });

  it('resumes where the section was left', async () => {
    const repos = await curriculumRepos();
    const unit = 'family';
    await buildSession(repos, { now: NOW, unit, section: 'words' });
    await finishLessonPart(repos, unit, 'words', 1, NOW);
    const progress = (await repos.settings.get()).unitStatus?.[unit] ?? {};
    const parts = progress.sections?.words?.parts ?? 1;
    expect(currentSection(progress)).toBe(parts > 1 ? 'words' : 'grammar');
    expect(nextPart(progress.sections?.words)).toBe(parts > 1 ? 2 : 1);
  });
});

describe('lesson sections, pure', () => {
  const card = (id: string, intro = false): SessionCard => ({
    sentence: { id, text: id, source: 'unit', tokens: [], wordIds: [], verified: true },
    targets: [],
    reason: 'drill',
    ...(intro ? { grammarIntro: id } : {}),
  });

  it('cuts a section into parts, never right after a grammar introduction', () => {
    const cards = Array.from({ length: 30 }, (_, i) => card(`c${i}`, i % 5 === 0));
    const parts = sectionParts(cards, 100);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.flat()).toEqual(cards);
    for (const part of parts) expect(part.at(-1)?.grammarIntro).toBeUndefined();
    expect(sectionParts(cards.slice(0, 2))).toHaveLength(1);
  });

  it('counts parts done, out of order once, and finds the next section', () => {
    expect(finishPart(undefined, 1, 2, NOW)).toEqual({ parts: 2, done: 1, at: NOW });
    expect(finishPart({ parts: 3, done: 2 }, 1, 3, NOW).done).toBe(2);
    expect(nextPart({ parts: 2, done: 2 })).toBe(1);
    expect(nextPart(undefined)).toBe(1);
    expect(currentSection({})).toBe('words');
    const all = { parts: 1, done: 1 };
    const sections = { words: all, grammar: all, practice: all, reading: all, review: all };
    expect(currentSection({ sections })).toBeUndefined();
    const { reading: _, ...unread } = sections;
    expect(currentSection({ readAt: NOW, sections: unread })).toBeUndefined();
  });
});
