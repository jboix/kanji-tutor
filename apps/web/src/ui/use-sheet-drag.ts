/**
 * Drag a bottom sheet down to dismiss it (U10): from the handle, or from the content while it is
 * scrolled to the top. Pointer events, with the touch's own scroll held back while dragging down
 * so iOS Safari does not pan the page instead. Past 30% of the sheet's height, or on a quick
 * flick, the sheet leaves; short of that it springs back. Reduced motion skips the animations.
 */
import { type RefObject, useEffect, useRef } from 'react';

/** Share of the sheet's height a drag must pass to dismiss it. */
export const DISMISS_SHARE = 0.3;
/** Downward speed (px per ms) that dismisses on release, however short the drag. */
export const FLICK_SPEED = 0.5;
/** A flick still has to move this far, so a tap with a jitter does not close the sheet. */
const FLICK_MIN = 12;
/** How far the finger moves before a press becomes a drag (a tap stays a tap). */
const SLOP = 8;
/** A release this long after the last move is not a flick. */
const STILL_MS = 100;
const LEAVE_MS = 180;

export interface DragEnd {
  /** Downward distance in px (negative: up). */
  distance: number;
  /** The sheet's height in px. */
  height: number;
  /** Downward speed at release, in px per ms. */
  velocity: number;
}

/** Whether a released drag dismisses the sheet (U10). */
export function shouldDismiss({ distance, height, velocity }: DragEnd): boolean {
  if (distance <= 0) return false;
  return distance >= height * DISMISS_SHARE || (velocity >= FLICK_SPEED && distance >= FLICK_MIN);
}

interface Drag {
  id: number;
  startY: number;
  /** Where the finger is now. */
  y: number;
  lastY: number;
  lastT: number;
  velocity: number;
  active: boolean;
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function canStart(sheet: HTMLElement, event: PointerEvent): boolean {
  if (!event.isPrimary || event.button !== 0) return false;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return false;
  return target?.closest('[data-sheet-handle]') !== null || sheet.scrollTop <= 0;
}

/** Leaves downwards and closes, or springs back to its place. */
function settle(sheet: HTMLElement, dismiss: boolean, onClose: () => void): void {
  const still = reduced();
  if (dismiss && still) {
    onClose();
    return;
  }
  if (dismiss) {
    sheet.style.transition = `transform ${LEAVE_MS}ms ease-in`;
    sheet.style.transform = 'translateY(100%)';
    window.setTimeout(onClose, LEAVE_MS);
    return;
  }
  sheet.style.transition = still ? 'none' : 'transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1.15)';
  sheet.style.transform = '';
}

/** Turns a press into a drag once it has moved down past the slop; false to drop it. */
function begin(sheet: HTMLElement, drag: Drag, event: PointerEvent): boolean {
  const dy = event.clientY - drag.startY;
  if (dy < -SLOP / 2) return false;
  if (dy < SLOP) return true;
  drag.active = true;
  sheet.setPointerCapture?.(event.pointerId);
  sheet.style.transition = 'none';
  return true;
}

function follow(sheet: HTMLElement, drag: Drag, event: PointerEvent): void {
  const now = event.timeStamp;
  const elapsed = Math.max(1, now - drag.lastT);
  drag.velocity = (event.clientY - drag.lastY) / elapsed;
  drag.lastY = event.clientY;
  drag.lastT = now;
  sheet.style.transform = `translateY(${Math.max(0, event.clientY - drag.startY)}px)`;
}

function release(sheet: HTMLElement, drag: Drag, event: PointerEvent, onClose: () => void) {
  if (!drag.active) return;
  const velocity = event.timeStamp - drag.lastT > STILL_MS ? 0 : drag.velocity;
  const distance = event.clientY - drag.startY;
  settle(sheet, shouldDismiss({ distance, height: sheet.offsetHeight, velocity }), onClose);
}

function listeners(sheet: HTMLElement, close: () => void) {
  let drag: Drag | undefined;
  const down = (event: PointerEvent) => {
    if (!canStart(sheet, event)) return;
    const { pointerId: id, clientY: y, timeStamp: t } = event;
    drag = { id, startY: y, y, lastY: y, lastT: t, velocity: 0, active: false };
  };
  const move = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    drag.y = event.clientY;
    if (!drag.active && !begin(sheet, drag, event)) drag = undefined;
    else if (drag.active) follow(sheet, drag, event);
  };
  const up = (event: PointerEvent) => {
    if (drag?.id === event.pointerId) release(sheet, drag, event, close);
    drag = undefined;
  };
  // While a press pulls down, the touch must not scroll or bounce the page (iOS Safari).
  const touch = (event: TouchEvent) => {
    if (drag && drag.y > drag.startY && event.cancelable) event.preventDefault();
  };
  return { down, move, up, touch };
}

/** Makes `ref`'s sheet follow a downward drag and call `onClose` past the threshold (U10). */
export function useSheetDrag(ref: RefObject<HTMLElement | null>, onClose: () => void): void {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;
    const on = listeners(sheet, () => close.current());
    sheet.addEventListener('pointerdown', on.down);
    sheet.addEventListener('pointermove', on.move);
    sheet.addEventListener('pointerup', on.up);
    sheet.addEventListener('pointercancel', on.up);
    sheet.addEventListener('touchmove', on.touch, { passive: false });
    return () => {
      sheet.removeEventListener('pointerdown', on.down);
      sheet.removeEventListener('pointermove', on.move);
      sheet.removeEventListener('pointerup', on.up);
      sheet.removeEventListener('pointercancel', on.up);
      sheet.removeEventListener('touchmove', on.touch);
    };
  }, [ref]);
}
