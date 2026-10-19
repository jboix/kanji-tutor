import { describe, expect, it } from 'vitest';
import { areaNotes } from './notes.ts';
import { levelFromReviews } from './review-estimate.ts';
import {
  answerStep,
  nextKind,
  PLACEMENT_LENGTH,
  type PlacementKind,
  proposedLevel,
  type Staircase,
  staircaseDone,
  startStaircase,
} from './staircase.ts';

function run(answers: readonly boolean[], kind: PlacementKind = 'kanji-reading'): Staircase {
  return answers.reduce((state, right) => answerStep(state, kind, right), startStaircase());
}

describe('the placement staircase (A11)', () => {
  it('starts at N5 and moves up after two right answers in a row', () => {
    expect(startStaircase().level).toBe(5);
    expect(run([true]).level).toBe(5);
    expect(run([true, true]).level).toBe(4);
    expect(run([true, true, true, true]).level).toBe(3);
    expect(run([true, true, true, true, true, true]).level).toBe(3);
  });

  it('moves down after two wrong in a row, never below N5, and a mixed pair stays', () => {
    expect(run([true, true, false, false]).level).toBe(5);
    expect(run([false, false, false]).level).toBe(5);
    expect(run([true, true, true, false, true, false]).level).toBe(4);
  });

  it('records each answer at the level it was asked', () => {
    expect(run([true, true, false]).steps.map((s) => s.level)).toEqual([5, 5, 4]);
  });

  it('takes the kinds in turn and stops after about 15 questions', () => {
    const kinds = [0, 1, 2, 3, 4].map((n) => nextKind(run(Array(n).fill(true))));
    expect(kinds).toEqual([
      'kanji-reading',
      'grammar-form',
      'orthography',
      'comprehension',
      'kanji-reading',
    ]);
    expect(staircaseDone(run(Array(PLACEMENT_LENGTH - 1).fill(true)))).toBe(false);
    expect(staircaseDone(run(Array(PLACEMENT_LENGTH).fill(true)))).toBe(true);
  });

  it('proposes one past the hardest steady level', () => {
    expect(proposedLevel([])).toBe(5);
    expect(proposedLevel(run([false, false, true, false]).steps)).toBe(5);
    // N5 steady, N4 shaky: work on N4.
    expect(
      proposedLevel(run([true, true, false, false, true, true, false, true, false]).steps),
    ).toBe(4);
    // Steady through N4 and at N3: N3 is the top.
    expect(proposedLevel(run([true, true, true, true, true, true]).steps)).toBe(3);
  });

  it('writes plain notes per area, with no score', () => {
    const state = [
      ['kanji-reading', true],
      ['kanji-reading', true],
      ['kanji-reading', false],
      ['grammar-form', false],
    ] as const;
    const steps = state.reduce(
      (s, [kind, right]) => answerStep(s, kind, right),
      startStaircase(),
    ).steps;
    expect(areaNotes(steps)).toEqual([
      { kind: 'kanji-reading', status: 'steady-shaky', steady: 5, shaky: 4 },
      { kind: 'grammar-form', status: 'not-yet', level: 4 },
    ]);
    expect(areaNotes(run([true], 'comprehension').steps)[0]).toEqual({
      kind: 'comprehension',
      status: 'steady',
      steady: 5,
    });
    expect(JSON.stringify(areaNotes(steps))).not.toMatch(/\d+%|score|points/);
  });
});

describe('the quiet re-estimate (A11)', () => {
  const reviews = (level: 5 | 4 | 3 | 2, right: number, wrong: number) => [
    ...Array.from({ length: right }, () => ({ level, correct: true })),
    ...Array.from({ length: wrong }, () => ({ level, correct: false })),
  ];

  it('needs enough reviews at a level', () => {
    expect(levelFromReviews([])).toBeUndefined();
    expect(levelFromReviews(reviews(5, 11, 0))).toBeUndefined();
  });

  it('suggests the next level once a level is solid', () => {
    expect(levelFromReviews(reviews(5, 18, 2))).toBe(4);
    expect(levelFromReviews([...reviews(5, 20, 0), ...reviews(4, 18, 2)])).toBe(3);
    expect(levelFromReviews(reviews(2, 20, 0))).toBe(3);
  });

  it('suggests an easier level when the hardest one reviewed is shaky', () => {
    expect(levelFromReviews(reviews(4, 5, 10))).toBe(5);
    expect(levelFromReviews(reviews(5, 5, 10))).toBeUndefined();
    expect(levelFromReviews(reviews(4, 10, 5))).toBeUndefined();
  });
});
