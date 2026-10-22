/**
 * Property tests for level gating (G3) and the variety mix (V2) over the e2e fixture pack and
 * random learner states: no session card's sentence is above the learner's level, no new word
 * is above it (class-lesson words may be one level harder), and no type comes three in a row
 * when the session has enough exercises.
 */
import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { fixturePack } from '../../test/fixture-pack.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import type { JlptLevel } from '../learner-view.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import type { Item, KnowledgeLevel, LearnerLevel } from '../types.ts';
import { newWordItem } from './items.ts';
import { lessonPlan } from './lesson-plan.ts';
import { type LevelGate, stretchLevel, wordJlptOf } from './level-gate.ts';
import { buildSession } from './session.ts';
import { exerciseSlots, longestRun } from './session-mix.ts';

/** Mulberry32: a small seeded PRNG, so every run checks the same states. */
function prng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface State {
  level: LearnerLevel;
  lesson: string | undefined;
  lessonWords: Set<string>;
}

const LESSON = 'Class 7';

/** Tracks a random share of the fixture words at random levels, some due, some lesson words. */
async function randomLearner(repos: Repos, seed: number): Promise<State> {
  const random = prng(seed);
  const level = ([5, 4, 3] as const)[Math.floor(random() * 3)] ?? 5;
  const withLesson = random() < 0.4;
  const share = random();
  const lessonWords = new Set<string>();
  const items: Item[] = [];
  for (const word of fixturePack().words) {
    if (random() > share) continue;
    const known = Math.floor(random() * 5) as KnowledgeLevel;
    const inLesson = withLesson && known <= 2 && random() < 0.2;
    if (inLesson) lessonWords.add(word.id);
    const lesson = inLesson ? { lesson: LESSON } : {};
    const kind = inLesson ? 'textbook' : 'import';
    const item = newWordItem({ wordId: word.id, kind, now: NOW, level: known, ...lesson });
    const due = random() < 0.3 ? NOW - 1 : NOW + 30 * 86_400_000;
    items.push(item.card ? { ...item, card: { ...item.card, due } } : item);
  }
  await repos.items.putMany(items);
  const lesson = withLesson ? LESSON : undefined;
  await repos.settings.patch({ learnerLevel: level, ...(lesson ? { currentLesson: lesson } : {}) });
  return { level, lesson, lessonWords };
}

const synthetic = (card: SessionCard) => /^(drill|grammar-intro):/.test(card.sentence.id);

/** The hardest level a word may bring: the class lesson's one harder, a taught word its own. */
function wordAllowed(state: State, gate: LevelGate, id: string): JlptLevel {
  if (state.lessonWords.has(id)) return stretchLevel(state.level);
  return gate.taught?.get(id) ?? state.level;
}

function allowedLevel(state: State, gate: LevelGate, card: SessionCard): JlptLevel {
  const levels = card.sentence.wordIds.map((id) => wordAllowed(state, gate, id));
  return Math.min(state.level, ...levels) as JlptLevel;
}

/** Targets whose own level is checked: not taught by a unit, not a bound piece. */
function checked(gate: LevelGate, card: SessionCard) {
  return card.targets.filter((t) => {
    const pos = card.sentence.tokens[t.tokenIndex]?.pos ?? '';
    return !gate.taught?.has(t.wordId) && pos !== 'suffix' && pos !== 'prefix';
  });
}

async function checkSession(repos: Repos, state: State, cards: readonly SessionCard[]) {
  const items = new Map((await repos.items.byKind('word')).map((i) => [i.ref, i.level]));
  const { gate } = await lessonPlan(repos, { now: NOW, levels: items });
  for (const card of cards.filter((c) => !synthetic(c))) {
    expect(card.sentence.level, card.sentence.id).toBeDefined();
    expect(card.sentence.level ?? 0, card.sentence.id).toBeGreaterThanOrEqual(
      allowedLevel(state, gate, card),
    );
  }
  const fresh = cards
    .flatMap((c) => checked(gate, c))
    .filter((t) => (items.get(t.wordId) ?? 0) < 3);
  const jlpt = await wordJlptOf(
    repos,
    fresh.map((t) => t.wordId),
  );
  for (const target of fresh) {
    const allowed = state.lessonWords.has(target.wordId) ? stretchLevel(state.level) : state.level;
    expect(jlpt.get(target.wordId) ?? 1, target.surface).toBeGreaterThanOrEqual(allowed);
  }
}

describe('level gating over the fixture pack (G3)', { timeout: 120_000 }, () => {
  it('never shows a sentence or a new word above the learner level', async () => {
    let checked = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const repos = await curriculumRepos();
      const state = await randomLearner(repos, seed);
      const cards = await buildSession(repos, { now: NOW });
      await checkSession(repos, state, cards);
      checked += cards.length;
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('keeps reading runs to two once there are enough exercises (V2)', async () => {
    let full = 0;
    for (let seed = 20; seed <= 27; seed++) {
      const repos = await curriculumRepos();
      await randomLearner(repos, seed);
      const cards = await buildSession(repos, { now: NOW });
      const readings = cards.filter((c) => c.reason !== 'drill').length;
      const exercises = cards.filter((c) => c.reason === 'drill' && !c.grammarIntro).length;
      if (exercises >= exerciseSlots(readings)) {
        expect(longestRun(cards)).toBeLessThanOrEqual(2);
        if (readings >= 6) full += 1;
      }
      // A grammar introduction may open the session (L8); an exercise never does.
      const first = cards[0];
      expect(first?.reason === 'drill' && !first.grammarIntro && cards.length > 1).toBe(false);
    }
    expect(full).toBeGreaterThan(0);
  });
});
