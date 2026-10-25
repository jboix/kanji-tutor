import { useEffect, useRef } from 'react';

/** Elements that answer Enter themselves: a field, a button, a link. */
const OWN_ENTER = 'input, textarea, select, button, a[href], [contenteditable="true"]';

/** Whether Enter belongs to something else: a focused control, or an open sheet or dialog. */
function taken(event: KeyboardEvent): boolean {
  const target = event.target instanceof Element ? event.target : null;
  return (
    target?.closest(OWN_ENTER) != null || document.querySelector('[aria-modal="true"]') != null
  );
}

/**
 * Enter moves on when nothing else takes it (keyboard flow): "Got it" on an introduction, the
 * main action at the end of a session. A held key and an IME composition do not count, and
 * `action` undefined listens to nothing (a button still busy).
 */
export function useEnterKey(action: (() => void) | undefined): void {
  const latest = useRef(action);
  useEffect(() => {
    latest.current = action;
  }, [action]);
  const on = action !== undefined;
  useEffect(() => {
    if (!on) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.isComposing || event.defaultPrevented) {
        return;
      }
      if (taken(event)) return;
      event.preventDefault();
      latest.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [on]);
}
