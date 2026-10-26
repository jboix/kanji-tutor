import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import type { SessionCard } from '../session-types.ts';
import { isExercise } from './drill-answer.ts';
import { introduceGrammar } from './grammar-intro.ts';
import { importKnown } from './import-known.ts';
import { DAY_MS } from './items.ts';
import { pointPractice } from './point-practice.ts';
import { buildSession } from './session.ts';
import { cardType, longestRun } from './session-mix.ts';

const s4 = (cards: readonly SessionCard[]) =>
  cards.flatMap((c) => (c.drill && isExercise(c.drill) ? [c.drill] : []));

describe("Today's session mixes exercise types (S7)", { timeout: 60_000 }, () => {
  it('gives a beginner from zero an S4 exercise every day, after the card it reuses', async () => {
    const repos = await curriculumRepos();
    for (let day = 0; day < 5; day++) {
      const cards = await buildSession(repos, { now: NOW + day * DAY_MS });
      const exercises = s4(cards);
      expect(exercises.length, `day ${day}`).toBeGreaterThan(0);
      expect(new Set(cards.map(cardType)).size, `day ${day}`).toBeGreaterThan(1);
      expect(longestRun(cards), `day ${day}`).toBeLessThanOrEqual(2);
      for (const card of cards.filter((c) => c.drill && 'sentence' in c.drill)) {
        const read = cards.findIndex(
          (c) => c.targets.length > 0 && c.sentence.id === card.sentence.id,
        );
        if (read >= 0) expect(cards.indexOf(card), card.sentence.text).toBeGreaterThan(read);
      }
    }
  });

  it('changes the types from day to day', async () => {
    const repos = await curriculumRepos();
    await importKnown(repos, { lists: ['n5'], now: NOW });
    await introduceGrammar(repos, 'te-mo-ii', NOW);
    const kinds = new Set<string>();
    for (let day = 0; day < 6; day++) {
      for (const drill of s4(await buildSession(repos, { now: NOW + day * DAY_MS })))
        kinds.add(drill.kind);
    }
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });

  it('keeps out S4 exercises when a request forces drills or questions', async () => {
    const repos = await curriculumRepos();
    expect(s4(await buildSession(repos, { now: NOW, questionEvery: 1 }))).toEqual([]);
    expect(s4(await buildSession(repos, { now: NOW, drillShare: 0.5 }))).toEqual([]);
  });

  it('makes listening only for a device with a Japanese voice', async () => {
    const repos = await curriculumRepos();
    const off: string[] = [];
    const on: string[] = [];
    const later: string[] = [];
    for (let day = 0; day < 8; day++) {
      const now = NOW + day * DAY_MS;
      off.push(...s4(await buildSession(repos, { now })).map((d) => d.kind));
      on.push(...s4(await buildSession(repos, { now, listening: true })).map((d) => d.kind));
      // The voice may still be looked up while the session is built.
      const voice = Promise.resolve(true);
      later.push(...s4(await buildSession(repos, { now, listening: voice })).map((d) => d.kind));
    }
    expect(off).not.toContain('listening');
    expect(on).toContain('listening');
    expect(later).toEqual(on);
  });
});

describe('Write the kanji in a session', { timeout: 60_000 }, () => {
  it('writes a word of a card read earlier in the session, never a word just met', async () => {
    const repos = await curriculumRepos();
    await importKnown(repos, { lists: ['n5'], now: NOW });
    const writes: { card: SessionCard; cards: SessionCard[] }[] = [];
    for (let day = 0; day < 12; day++) {
      const cards = await buildSession(repos, { now: NOW + day * DAY_MS });
      for (const card of cards) if (card.drill?.kind === 'write') writes.push({ card, cards });
    }
    expect(writes.length).toBeGreaterThan(0);
    for (const { card, cards } of writes) {
      const read = cards.find((c) => c.targets.length > 0 && c.sentence.id === card.sentence.id);
      expect(read?.reason, card.sentence.text).not.toBe('new');
      expect(cards.indexOf(card)).toBeGreaterThan(cards.indexOf(read as SessionCard));
    }
  });
});

describe('Practise this point (S5)', { timeout: 30_000 }, () => {
  it("gives a short set of the point's drills, every one on the point", async () => {
    const repos = await curriculumRepos();
    const cards = await pointPractice(repos, 'desu', { now: NOW, listening: false });
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.length).toBeLessThanOrEqual(4);
    for (const card of cards) {
      const drill = card.drill;
      const point = drill && 'grammarId' in drill ? drill.grammarId : undefined;
      const tagged = card.sentence.grammarIds?.includes('desu');
      expect(point === 'desu' || tagged, cardType(card)).toBe(true);
    }
    expect(new Set(cards.map(cardType)).size).toBeGreaterThan(1);
  });

  it('has nothing for a point it does not know', async () => {
    const repos = await curriculumRepos();
    expect(await pointPractice(repos, 'no-such-point', { now: NOW, listening: false })).toEqual([]);
  });

  it('gives a particle page fills of that particle, each in its own sentence', async () => {
    const repos = await curriculumRepos();
    const cards = await pointPractice(repos, 'particle-ni', { now: NOW, listening: false });
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.length).toBeLessThanOrEqual(4);
    for (const card of cards) {
      expect(card.drill).toMatchObject({
        kind: 'particle',
        answer: 'に',
        itemId: 'grammar:particle-ni',
      });
    }
    expect(new Set(cards.map((card) => card.sentence.id)).size).toBe(cards.length);
  });
});
