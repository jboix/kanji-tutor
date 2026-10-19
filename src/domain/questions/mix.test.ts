import { describe, expect, it } from 'vitest';
import { allLevels, fixturePack, fixtureRepos } from '../../test/fixture-pack.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import type { SessionCard } from '../session-types.ts';
import type { Item, Sentence } from '../types.ts';
import { mixQuestions, placeQuestions, QUESTION_KINDS, questionCard, questionsFor } from './mix.ts';
import type { QuestionContext } from './sources.ts';
import type { Question } from './types.ts';

const sentence = (id: string): Sentence => ({
  id,
  text: id,
  source: 'tatoeba',
  tokens: [],
  wordIds: [],
  verified: true,
});
const reading = (id: string): SessionCard => ({
  sentence: sentence(id),
  targets: [],
  reason: 'due',
});
const drill = (id: string): SessionCard => ({
  sentence: sentence(id),
  targets: [],
  reason: 'drill',
  drill: {
    kind: 'family',
    part: '青',
    sound: 'セイ',
    known: [],
    guess: '精',
    itemId: 'kanji:精',
    accepted: [],
  },
});
const question = (id: string) =>
  questionCard({ question: { id, kind: 'context-word' } as Question, sentence: sentence(id) });
const ids = (cards: readonly SessionCard[]) => cards.map((c) => c.sentence.id);

describe('placeQuestions', () => {
  it('puts one after every N reading cards, never first or last', () => {
    const cards = ['a', 'b', 'c', 'd', 'e'].map(reading);
    expect(ids(placeQuestions(cards, [question('q1'), question('q2'), question('q3')], 2))).toEqual(
      ['a', 'b', 'q1', 'c', 'd', 'q2', 'e'],
    );
  });

  it('waits for a gap away from drills', () => {
    const cards = [reading('a'), drill('d'), reading('b'), reading('c')];
    expect(ids(placeQuestions(cards, [question('q1')], 1))).toEqual(['a', 'd', 'b', 'q1', 'c']);
  });
});

async function context(): Promise<QuestionContext> {
  return {
    repos: await fixtureRepos(),
    levels: allLevels(3),
    sentences: fixturePack().sentences,
    avoid: new Set(),
    learnerLevel: 3,
    grammar: [],
    seed: 'mix',
  };
}

describe('questionsFor', () => {
  it('takes the kinds in turn, each on its own sentence', async () => {
    const made = await questionsFor([], await context(), 5);
    expect(made.map((m) => m.question.kind)).toEqual(QUESTION_KINDS);
    expect(new Set(made.map((m) => m.sentence.id)).size).toBe(5);
    expect(made.every((m) => m.question.sentenceId === m.sentence.id)).toBe(true);
  });

  it('never uses a session sentence and drops kinds that run out', async () => {
    const ctx = await context();
    const order = fixturePack().sentences.filter((s) => s.text.length > 12);
    const cards = fixturePack()
      .sentences.filter((s) => !order.includes(s))
      .map((s) => ({
        ...reading(s.id),
        sentence: s,
      }));
    const made = await questionsFor(cards, { ...ctx, sentences: fixturePack().sentences }, 3, [
      'sentence-order',
      'comprehension',
    ]);
    expect(made.length).toBeLessThanOrEqual(3);
    expect(made.every((m) => !cards.some((c) => c.sentence.id === m.sentence.id))).toBe(true);
    expect(made.every((m) => m.question.kind === 'sentence-order')).toBe(true);
  });
});

describe('mixQuestions', () => {
  it('adds questions from sentences of known words', async () => {
    const repos = await fixtureRepos();
    const items = fixturePack().words.map(
      (w): Item => ({
        id: `word:${w.id}`,
        kind: 'word',
        ref: w.id,
        level: 3,
        source: { kind: 'import', week: '2026-W42', addedAt: NOW },
        updatedAt: NOW,
      }),
    );
    await repos.items.putMany(items);
    const cards = fixturePack()
      .sentences.slice(0, 6)
      .map((s) => ({ ...reading(s.id), sentence: s }));
    const levels = new Map(items.map((i) => [i.ref, i.level]));
    const mixed = await mixQuestions(repos, cards, {
      now: NOW,
      every: 2,
      levels,
      sentences: [],
      recent: [],
    });
    expect(mixed.filter((c) => c.question)).toHaveLength(2);
    expect(mixed[0]?.question).toBeUndefined();
    expect(
      await mixQuestions(repos, cards, { now: NOW, every: 0, levels, sentences: [], recent: [] }),
    ).toBe(cards);
  });
});
