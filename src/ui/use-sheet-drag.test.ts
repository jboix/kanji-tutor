import { describe, expect, it } from 'vitest';
import { DISMISS_SHARE, FLICK_SPEED, shouldDismiss } from './use-sheet-drag.ts';

const HEIGHT = 600;

describe('shouldDismiss (U10)', () => {
  it('dismisses past 30% of the sheet height, however slow', () => {
    expect(DISMISS_SHARE).toBe(0.3);
    expect(shouldDismiss({ distance: 180, height: HEIGHT, velocity: 0 })).toBe(true);
    expect(shouldDismiss({ distance: 179, height: HEIGHT, velocity: 0 })).toBe(false);
  });

  it('dismisses on a quick flick, even a short one', () => {
    expect(shouldDismiss({ distance: 40, height: HEIGHT, velocity: FLICK_SPEED })).toBe(true);
    expect(shouldDismiss({ distance: 40, height: HEIGHT, velocity: FLICK_SPEED - 0.1 })).toBe(
      false,
    );
  });

  it('does not take a jitter for a flick', () => {
    expect(shouldDismiss({ distance: 6, height: HEIGHT, velocity: 2 })).toBe(false);
  });

  it('springs back from an upward or no drag, fast or not', () => {
    expect(shouldDismiss({ distance: -200, height: HEIGHT, velocity: 3 })).toBe(false);
    expect(shouldDismiss({ distance: 0, height: HEIGHT, velocity: 3 })).toBe(false);
  });
});
