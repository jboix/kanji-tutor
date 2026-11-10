import { describe, expect, it } from 'vitest';
import { isLastToDraw, leaveOpen, nextToDraw, startSteps } from './kanji-steps.ts';
import type { Stroke } from './recognizer/geometry.ts';

const stroke: Stroke = [
  [0, 0],
  [10, 10],
];

describe('kanji steps', () => {
  it('starts on the first kanji with nothing drawn', () => {
    const steps = startSteps(3);
    expect(steps).toEqual({ at: 0, strokes: [[], [], []], read: ['', '', ''] });
    expect(isLastToDraw(steps)).toBe(false);
    expect(isLastToDraw(startSteps(1))).toBe(true);
  });

  it('keeps the strokes and the reading of the kanji left', () => {
    const left = leaveOpen(startSteps(2), [stroke], '春');
    expect(left.strokes[0]).toEqual([stroke]);
    expect(left.read).toEqual(['春', '']);
    expect(leaveOpen(left, [], '春').read).toEqual(['', '']);
  });

  it('goes on to the next kanji still to draw, wrapping round to one skipped before', () => {
    const steps = { at: 1, strokes: [[], [], [], []], read: ['', '書', '', '日'] };
    expect(nextToDraw(steps)).toBe(2);
    expect(nextToDraw({ ...steps, read: ['', '書', '本', '日'] })).toBe(0);
    expect(nextToDraw({ ...steps, read: ['手', '書', '本', '日'] })).toBeUndefined();
  });

  it('checks the answer from a kanji opened again once the rest are drawn', () => {
    const steps = { at: 0, strokes: [[stroke], [stroke]], read: ['春', '道'] };
    expect(isLastToDraw(steps)).toBe(true);
    expect(isLastToDraw({ ...steps, read: ['春', ''] })).toBe(false);
  });
});
