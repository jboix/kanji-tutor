import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isEditable,
  keyboardOpen,
  trackViewport,
  useVisualViewport,
  type ViewportLike,
} from './use-visual-viewport.ts';

class FakeViewport extends EventTarget implements ViewportLike {
  width = 360;
  height = 740;
  offsetTop = 0;
  resize(height: number, offsetTop = 0) {
    this.height = height;
    this.offsetTop = offsetTop;
    this.dispatchEvent(new Event('resize'));
  }
}

function field() {
  const input = document.createElement('input');
  document.body.append(input);
  return input;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('keyboard detection', () => {
  it('needs a focused text field and a clearly shorter viewport', () => {
    expect(keyboardOpen(420, 740, true)).toBe(true);
    expect(keyboardOpen(420, 740, false)).toBe(false);
    expect(keyboardOpen(700, 740, true)).toBe(false);
    const box = document.createElement('input');
    box.type = 'checkbox';
    expect(isEditable(box)).toBe(false);
    expect(isEditable(document.createElement('textarea'))).toBe(true);
    expect(isEditable(null)).toBe(false);
  });
});

describe('trackViewport', () => {
  it('follows the visual viewport into --vvh and marks the keyboard open while typing', () => {
    const view = new FakeViewport();
    const root = document.createElement('div');
    const stop = trackViewport(view, root, document);
    expect(root.style.getPropertyValue('--vvh')).toBe('');
    const input = field();
    input.focus();
    view.resize(420, 120);
    expect(root.style.getPropertyValue('--vvh')).toBe('420px');
    expect(root.style.getPropertyValue('--vv-top')).toBe('120px');
    expect(root.dataset.keyboard).toBe('open');
    input.blur();
    expect(root.dataset.keyboard).toBeUndefined();
    view.resize(740);
    stop();
    expect(root.style.getPropertyValue('--vvh')).toBe('');
  });

  it('leaves the frame alone while nothing is focused, however the viewport scrolls (U13)', () => {
    const view = new FakeViewport();
    const root = document.createElement('div');
    const stop = trackViewport(view, root, document);
    // iOS bouncing the page and Safari's toolbar coming back while scrolling up.
    for (const [height, top] of [
      [700, -12],
      [720, -4],
      [740, 0],
    ] as const) {
      view.resize(height, top);
      view.dispatchEvent(new Event('scroll'));
      expect(root.style.getPropertyValue('--vvh')).toBe('');
      expect(root.style.getPropertyValue('--vv-top')).toBe('');
    }
    const input = field();
    input.focus();
    view.resize(420, 120);
    expect(root.style.getPropertyValue('--vv-top')).toBe('120px');
    input.blur();
    expect(root.style.getPropertyValue('--vv-top')).toBe('');
    stop();
  });

  it('starts over when the width changes (rotation), so landscape is not a keyboard', () => {
    const view = new FakeViewport();
    const root = document.createElement('div');
    const stop = trackViewport(view, root, document);
    field().focus();
    view.width = 740;
    view.resize(360);
    expect(root.dataset.keyboard).toBeUndefined();
    stop();
  });
});

describe('useVisualViewport', () => {
  it('shares one tracker between screens and removes it with the last one', () => {
    const view = new FakeViewport();
    Object.defineProperty(window, 'visualViewport', { value: view, configurable: true });
    const root = document.documentElement;
    const first = renderHook(() => useVisualViewport());
    const second = renderHook(() => useVisualViewport());
    field().focus();
    view.resize(420, 120);
    expect(root.style.getPropertyValue('--vvh')).toBe('420px');
    first.unmount();
    view.resize(400, 140);
    expect(root.style.getPropertyValue('--vvh')).toBe('400px');
    second.unmount();
    expect(root.style.getPropertyValue('--vvh')).toBe('');
    expect(root.dataset.keyboard).toBeUndefined();
    Reflect.deleteProperty(window, 'visualViewport');
  });
});
