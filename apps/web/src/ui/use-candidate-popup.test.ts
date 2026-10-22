import { describe, expect, it } from 'vitest';
import { popupKey } from './use-candidate-popup.ts';

const typed = (index: number) => ({ index, count: 3, sideways: true });
const moved = (index: number) => ({ index, count: 3, sideways: false });

describe('popupKey (C6)', () => {
  it.each<[string, number, ReturnType<typeof popupKey>]>([
    ['ArrowDown', 0, { highlight: 1 }],
    ['ArrowRight', 0, { highlight: 1 }],
    // ↑ and ← from the first stay on the first: never a jump to the last.
    ['ArrowUp', 0, { highlight: 0 }],
    ['ArrowLeft', 0, { highlight: 0 }],
    ['ArrowUp', 2, { highlight: 1 }],
    ['ArrowDown', 2, { highlight: 2 }],
    ['ArrowRight', 2, { highlight: 2 }],
    ['Enter', 0, { pick: 0 }],
    ['Enter', 1, { pick: 1 }],
    // Space types a space.
    [' ', 0, undefined],
    ['Escape', 1, { close: true }],
    ['Tab', 1, { close: true, keep: true }],
    ['a', 1, undefined],
  ])('%j on %i of 3, kana just typed', (key, index, expected) => {
    expect(popupKey(key, typed(index))).toEqual(expected);
  });

  it('leaves ←/→ to the caret when the popup opened on a caret move, ↓/↑ still choose', () => {
    expect(popupKey('ArrowLeft', moved(0))).toBeUndefined();
    expect(popupKey('ArrowRight', moved(0))).toBeUndefined();
    expect(popupKey('ArrowDown', moved(0))).toEqual({ highlight: 1 });
    expect(popupKey('ArrowUp', moved(0))).toEqual({ highlight: 0 });
    expect(popupKey('Enter', moved(0))).toEqual({ pick: 0 });
  });

  it('takes no key while the popup is closed', () => {
    for (const key of ['ArrowDown', 'Enter', 'Escape', 'Tab']) {
      expect(popupKey(key, { index: 0, count: 0, sideways: true })).toBeUndefined();
    }
  });
});
