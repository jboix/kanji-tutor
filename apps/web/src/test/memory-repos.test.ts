import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from './memory-repos.ts';

describe('memory repos', () => {
  it('stores copies and finds due items in due order', async () => {
    const repos = createMemoryRepos();
    const base = { kind: 'word', level: 3, updatedAt: 0 } as const;
    const source = { kind: 'manual', week: '2026-W42', addedAt: 0 } as const;
    const card = (due: number) => ({
      due,
      stability: 1,
      difficulty: 1,
      elapsedDays: 0,
      scheduledDays: 0,
      learningSteps: 0,
      reps: 0,
      lapses: 0,
      state: 0 as const,
    });
    await repos.items.putMany([
      { ...base, id: 'word:2', ref: '2', source, card: card(20) },
      { ...base, id: 'word:1', ref: '1', source, card: card(10) },
      { ...base, id: 'word:3', ref: '3', source, card: card(99) },
    ]);
    expect((await repos.items.dueBefore(50)).map((item) => item.id)).toEqual(['word:1', 'word:2']);
    expect((await repos.settings.patch({ furigana: 'all' })).furigana).toBe('all');
  });
});
