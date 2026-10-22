import { type RefObject, useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/** Keeps Tab inside `root`; returns the focus target for Shift+Tab / Tab at the edges. */
function wrapTarget(root: HTMLElement, event: KeyboardEvent): HTMLElement | undefined {
  const items = focusables(root);
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === root)) return last;
  if (!event.shiftKey && active === last) return first;
  return undefined;
}

function trapTab(root: HTMLElement, event: KeyboardEvent): void {
  const target = wrapTarget(root, event);
  if (!target) return;
  event.preventDefault();
  target.focus();
}

/**
 * While active: focuses the first focusable element in `root`, traps Tab inside it, calls
 * `onEscape` on Escape, and gives focus back to what had it before on deactivation.
 */
export function useFocusTrap(
  root: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void,
): void {
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });
  useEffect(() => {
    const node = root.current;
    if (!active || !node) return;
    const previous = document.activeElement as HTMLElement | null;
    (focusables(node)[0] ?? node).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escapeRef.current();
      if (event.key === 'Tab') trapTab(node, event);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [root, active]);
}
