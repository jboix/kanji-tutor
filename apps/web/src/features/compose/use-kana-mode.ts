/**
 * The sentence field's typing mode (C6), kept for the app session. A Japanese
 * keyboard typing in the field switches ours off (`native`), so its own conversion is never
 * hindered; a press on the switch turns ours back on, and that choice then holds for the session.
 */
import { useCallback, useState } from 'react';
import type { KanaMode, TypingMode } from '../../ui/use-japanese-typing.ts';

const KEY = 'kanji-tutor:compose-typing';

interface Saved {
  mode: TypingMode;
  /** The learner chose the mode by hand: a Japanese keyboard no longer changes it. */
  chosen: boolean;
}

const MODES: readonly TypingMode[] = ['hiragana', 'katakana', 'off', 'native'];
const START: Saved = { mode: 'hiragana', chosen: false };

/** The saved mode, or the start: あ (sessionStorage can be missing or blocked). */
export function loadMode(): Saved {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
    const mode = saved?.mode;
    return mode && MODES.includes(mode) ? { mode, chosen: saved.chosen === true } : START;
  } catch {
    return START;
  }
}

function store(saved: Saved) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Not kept past this screen: the mode still works.
  }
}

/** The mode, the switch's `choose`, and `native` for the typing hook to call. */
export function useKanaMode() {
  const [saved, setSaved] = useState(loadMode);
  const save = useCallback((next: Saved) => {
    store(next);
    setSaved(next);
  }, []);
  const choose = useCallback((mode: KanaMode) => save({ mode, chosen: true }), [save]);
  const native = useCallback(() => {
    setSaved((now) => {
      if (now.chosen || now.mode === 'native') return now;
      const next: Saved = { mode: 'native', chosen: false };
      store(next);
      return next;
    });
  }, []);
  return { mode: saved.mode, choose, native };
}
