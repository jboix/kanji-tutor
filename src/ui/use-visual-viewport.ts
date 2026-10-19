/**
 * Keyboard-safe layout (U1). The visual viewport is what is left above the on-screen keyboard;
 * iOS Safari shrinks only that, not the layout viewport. Its height and offset go into `--vvh`
 * and `--vv-top` on the root, so `Screen` can follow it. While a text field is focused and the
 * visual viewport is clearly shorter than the full height seen at this width, the root gets
 * `data-keyboard="open"`: screens switch to their compact layout and hide secondary chrome.
 */
import { useEffect } from 'react';

/** Shorter than this (px) under the full height, with a field focused: a keyboard is up. */
export const KEYBOARD_MIN = 150;

/** What the tracker reads from `window.visualViewport`. */
export interface ViewportLike extends EventTarget {
  readonly width: number;
  readonly height: number;
  readonly offsetTop: number;
}

const EDITABLE =
  'input:not([type="checkbox"],[type="radio"],[type="button"],[type="submit"],[type="range"]),' +
  'textarea,[contenteditable="true"],[contenteditable=""]';

/** True for an element that brings up the on-screen keyboard. */
export function isEditable(element: EventTarget | null | undefined): boolean {
  return element instanceof Element && element.matches(EDITABLE);
}

/** The keyboard is open when a field is focused and the viewport lost `KEYBOARD_MIN` px. */
export function keyboardOpen(height: number, fullHeight: number, editing: boolean): boolean {
  return editing && fullHeight - height > KEYBOARD_MIN;
}

/**
 * Only while a field is focused can a keyboard be up, so only then does the frame follow the
 * visual viewport. Otherwise it keeps the CSS default (100dvh, no offset): following every
 * viewport scroll and resize, one frame late, made the screen shake under a scroll (U13).
 */
function follow(root: HTMLElement, view: ViewportLike, editing: boolean): void {
  if (!editing) {
    root.style.removeProperty('--vvh');
    root.style.removeProperty('--vv-top');
    return;
  }
  root.style.setProperty('--vvh', `${view.height}px`);
  root.style.setProperty('--vv-top', `${view.offsetTop}px`);
}

/** Follows `view` into CSS variables and `data-keyboard` on `root`; returns the remover. */
export function trackViewport(view: ViewportLike, root: HTMLElement, doc: Document): () => void {
  let width = view.width;
  let full = view.height;
  const update = (editing = isEditable(doc.activeElement)) => {
    if (view.width !== width) [width, full] = [view.width, view.height];
    full = Math.max(full, view.height);
    follow(root, view, editing);
    if (keyboardOpen(view.height, full, editing)) root.dataset.keyboard = 'open';
    else delete root.dataset.keyboard;
  };
  const onView = () => update();
  const onFocus = (event: FocusEvent) => update(isEditable(event.target));
  const onBlur = (event: FocusEvent) => update(isEditable(event.relatedTarget));
  view.addEventListener('resize', onView);
  view.addEventListener('scroll', onView);
  doc.addEventListener('focusin', onFocus);
  doc.addEventListener('focusout', onBlur);
  update();
  return () => {
    view.removeEventListener('resize', onView);
    view.removeEventListener('scroll', onView);
    doc.removeEventListener('focusin', onFocus);
    doc.removeEventListener('focusout', onBlur);
    root.style.removeProperty('--vvh');
    root.style.removeProperty('--vv-top');
    delete root.dataset.keyboard;
  };
}

let users = 0;
let stop: (() => void) | undefined;

/** Tracks the visual viewport while any screen is mounted (one listener set for the app). */
export function useVisualViewport(): void {
  useEffect(() => {
    const view = window.visualViewport;
    if (!view) return;
    users += 1;
    stop ??= trackViewport(view, document.documentElement, document);
    return () => {
      users -= 1;
      if (users > 0) return;
      stop?.();
      stop = undefined;
    };
  }, []);
}
