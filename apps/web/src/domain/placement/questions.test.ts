import { describe, expect, it } from 'vitest';
import { fixturePack, fixtureRepos } from '../../test/fixture-pack.ts';
import { placementQuestion, usedId } from './questions.ts';
import { levelSuggestion } from './suggestion.ts';

const NOW = Date.parse('2026-10-18T09:00:00Z');

describe('placement questions (A11)', () => {
  it('builds readings, spellings and grammar at each level from zero, and passages', async () => {
    const repos = await fixtureRepos();
    const made: string[] = [];
    for (const level of [5, 4, 3] as const) {
      for (const kind of [
        'kanji-reading',
        'grammar-form',
        'orthography',
        'comprehension',
      ] as const) {
        const found = await placementQuestion(repos, {
          level,
          kinds: [kind],
          seed: 's',
          used: new Set(),
        });
        if (found) made.push(`${kind}@${level}`);
        if (found) expect(found.question.options).toHaveLength(4);
      }
    }
    // J6: grammar distractors stay at or below the level, so N5's 文法形式の判断 asks a particle
    // (D95); the fixture's few N3 sentences give none.
    expect(made).toEqual([
      'kanji-reading@5',
      'grammar-form@5',
      'orthography@5',
      'comprehension@5',
      'kanji-reading@4',
      'grammar-form@4',
      'orthography@4',
      'comprehension@4',
      'kanji-reading@3',
      'orthography@3',
      'comprehension@3',
    ]);
  });

  it('asks a word of the level itself, and never the same sentence twice', async () => {
    const repos = await fixtureRepos();
    const request = { level: 4 as const, kinds: ['kanji-reading' as const], seed: 's' };
    const first = await placementQuestion(repos, { ...request, used: new Set() });
    expect(first?.kind).toBe('kanji-reading');
    const word = first?.question.itemId?.replace('word:', '');
    expect(fixturePack().words.find((w) => w.id === word)?.jlpt).toBe(4);
    const second =
      first && (await placementQuestion(repos, { ...request, used: new Set([usedId(first)]) }));
    expect(second && usedId(second)).not.toBe(first && usedId(first));
  });

  it('falls through to the next kind when one has no material', async () => {
    const repos = await fixtureRepos();
    const found = await placementQuestion(repos, {
      level: 5,
      kinds: ['kanji-reading', 'comprehension'],
      seed: 's',
      used: new Set(['vending-machine']),
    });
    expect(found).toBeDefined();
  });
});

describe('levelSuggestion (A11)', () => {
  it('counts reviews and suggests a level from 30 days of them, without changing it', async () => {
    const repos = await fixtureRepos();
    const n5 = fixturePack()
      .words.filter((w) => w.jlpt === 5)
      .slice(0, 20);
    for (const [i, word] of n5.entries()) {
      await repos.reviews.add({
        at: NOW - i * 3_600_000,
        itemId: `word:${word.id}`,
        answer: 'x',
        expected: 'x',
        verdict: 'correct',
        durationMs: 1000,
        mode: 'typed',
      });
    }
    expect(await levelSuggestion(repos, NOW)).toEqual({ reviews: 20, current: 5, suggested: 4 });
    expect((await repos.settings.get()).learnerLevel).toBeUndefined();
    await repos.settings.patch({ learnerLevel: 4 });
    expect(await levelSuggestion(repos, NOW)).toEqual({ reviews: 20, current: 4 });
    expect(await levelSuggestion(repos, NOW + 40 * 86_400_000)).toEqual({
      reviews: 20,
      current: 4,
    });
  });
});
