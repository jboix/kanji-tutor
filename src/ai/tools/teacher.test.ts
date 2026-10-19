import { describe, expect, it } from 'vitest';
import { fakeLearner, learnerOverview } from '../testing/context.ts';
import { learnerSnapshot } from './teacher.ts';

describe('learnerSnapshot', () => {
  it('keys level and coverage tenths at that level', async () => {
    const snapshot = await learnerSnapshot(fakeLearner());
    expect(snapshot).toMatchObject({
      key: 'N4 w2 k1 g0',
      line: 'Learner level: N4 (set); about 20% of N4 words known.',
      learner: { level: 4 },
    });
  });

  it('changes only when a bucket or the level changes', async () => {
    const at = (known: number) =>
      learnerSnapshot(
        fakeLearner({
          getLearnerProfile: async () =>
            learnerOverview({
              level: 5,
              levelSource: 'estimated',
              coverage: { words: [{ level: 5, known, total: 100 }], kanji: [], grammar: [] },
            }),
        }),
      );
    expect((await at(31))?.key).toBe((await at(39))?.key);
    expect((await at(41))?.key).toBe('N5 w4 k0 g0');
  });

  it('is undefined when the view fails', async () => {
    const failing = fakeLearner({
      getLearnerProfile: () => Promise.reject(new Error('closed')),
    });
    expect(await learnerSnapshot(failing)).toBeUndefined();
  });
});
