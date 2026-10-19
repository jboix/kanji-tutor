import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import {
  harderLevel,
  learnerLevelOf,
  levelAfterLists,
  raiseLearnerLevel,
} from './learner-level.ts';

describe('learner level (D38)', () => {
  it('is N5 when never set', () => {
    expect(learnerLevelOf({})).toBe(5);
    expect(learnerLevelOf({ learnerLevel: 3 })).toBe(3);
  });

  it('moves one level past the hardest list known', () => {
    expect(levelAfterLists([])).toBeUndefined();
    expect(levelAfterLists([5])).toBe(4);
    expect(levelAfterLists([5, 4])).toBe(3);
    expect(levelAfterLists([4])).toBe(3);
    expect(harderLevel(5, 3)).toBe(3);
  });

  it('only ever raises the stored level', async () => {
    const repos = createMemoryRepos();
    expect(await raiseLearnerLevel(repos.settings, 4)).toBe(4);
    expect(await raiseLearnerLevel(repos.settings, 3)).toBe(3);
    expect(await raiseLearnerLevel(repos.settings, 4)).toBe(3);
    expect((await repos.settings.get()).learnerLevel).toBe(3);
  });
});
