import { describe, expect, it } from 'vitest';
import { caretBox, placePopup, visibleTop } from './caret-position.ts';

const room = (above: number, left = 40) => ({
  caret: { top: 100, left, height: 30 },
  size: { width: 120, height: 44 },
  width: 300,
  above,
});

describe('placePopup (C6)', () => {
  it('sits just above the character, its bottom clear of the text', () => {
    expect(placePopup(room(200))).toEqual({ top: 52, left: 40, below: false });
  });

  it('goes below the character when there is no room above', () => {
    expect(placePopup(room(47))).toEqual({ top: 134, left: 40, below: true });
    expect(placePopup(room(48)).below).toBe(false);
  });

  it('stays inside its parent, never past either side', () => {
    expect(placePopup(room(200, 250)).left).toBe(180);
    expect(placePopup({ ...room(200, 10), size: { width: 400, height: 44 } }).left).toBe(0);
  });
});

describe('caretBox (C6)', () => {
  it('measures with a mirror it removes, and takes the field scroll off', () => {
    const field = document.createElement('textarea');
    field.value = 'わたしはがくせい';
    document.body.append(field);
    const before = document.body.childElementCount;
    field.scrollTop = 0;
    const box = caretBox(field, 4);
    expect(document.body.childElementCount).toBe(before);
    expect(box).toEqual({ top: expect.any(Number), left: expect.any(Number), height: 0 });
    field.remove();
  });

  it('works on a one-line input too', () => {
    const field = document.createElement('input');
    field.value = 'せんせい';
    document.body.append(field);
    expect(Number.isFinite(caretBox(field, 4).left)).toBe(true);
    field.remove();
  });
});

describe('visibleTop', () => {
  it('is the top of the nearest scrolling parent, or the viewport', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.append(inner);
    document.body.append(outer);
    expect(visibleTop(inner)).toBe(0);
    outer.style.overflowY = 'auto';
    expect(visibleTop(inner)).toBe(0);
    outer.remove();
  });
});
