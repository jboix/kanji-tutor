import { describe, expect, it } from 'vitest';
import { fixturePack, fixtureRepos } from '../../test/fixture-pack.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import { newCard } from '../scheduler.ts';
import { buildSession } from '../services/session.ts';
import type { Item } from '../types.ts';

/** Every fixture word known, and a few kanji words due again today. */
async function learnerRepos() {
  const repos = await fixtureRepos();
  const items = fixturePack().words.map(
    (w, i): Item => ({
      id: `word:${w.id}`,
      kind: 'word',
      ref: w.id,
      level: i % 7 === 0 ? 2 : 3,
      card: { ...newCard(NOW), due: i % 7 === 0 ? NOW - 1 : NOW + 30 * 86_400_000 },
      source: { kind: 'import', week: '2026-W42', addedAt: NOW },
      updatedAt: NOW,
    }),
  );
  await repos.items.putMany(items);
  return repos;
}

describe('questions in a session', { timeout: 30_000 }, () => {
  it('adds questions after reading cards when asked', async () => {
    const repos = await learnerRepos();
    const cards = await buildSession(repos, { now: NOW, drillShare: 0, questionEvery: 1 });
    const questions = cards.filter((c) => c.question);
    expect(questions.length).toBeGreaterThan(0);
    expect(cards[0]?.question).toBeUndefined();
    expect(questions.every((c) => c.reason === 'drill' && c.targets.length === 0)).toBe(true);
    const off = await buildSession(repos, { now: NOW, drillShare: 0, questionEvery: 0 });
    expect(off.some((c) => c.question)).toBe(false);
  });
});
