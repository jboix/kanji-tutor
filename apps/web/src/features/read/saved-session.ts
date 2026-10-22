/**
 * The session in progress, kept on the device so leaving and coming back resumes at the same card
 * (R14). Answers are already recorded one by one; this only keeps the position. It lasts the
 * local day, is dropped once the session is finished, and erasing all data clears it.
 */
import type { SessionState } from './session-state.ts';

const STORAGE_KEY = 'kanji-reader:session';

interface Saved {
  /** Which session: the request that built it (`requestKey`). */
  key: string;
  /** Local date it was built on, `YYYY-MM-DD`. */
  day: string;
  state: SessionState;
}

/** The local calendar day of `now`. */
export function localDay(now: number): string {
  const date = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A stable key for a session request: same focus, unit or mix, same session. */
export function requestKey(request: object): string {
  const entries = Object.entries(request).filter(([, value]) => value !== undefined);
  return JSON.stringify(entries.sort(([a], [b]) => (a < b ? -1 : 1)));
}

function read(storage: Storage): Saved | undefined {
  try {
    const text = storage.getItem(STORAGE_KEY);
    return text ? (JSON.parse(text) as Saved) : undefined;
  } catch {
    return undefined;
  }
}

/** The saved session for this request, if it is from today and not finished. */
export function loadSession(
  key: string,
  now: number,
  storage: Storage = localStorage,
): SessionState | undefined {
  const saved = read(storage);
  if (!saved || saved.key !== key || saved.day !== localDay(now)) return undefined;
  const cards = saved.state.cards;
  return cards && saved.state.index < cards.length ? saved.state : undefined;
}

/** Keeps the session's position; a finished session is dropped instead. */
export function saveSession(
  key: string,
  state: SessionState,
  now: number,
  storage: Storage = localStorage,
): void {
  try {
    if (!state.cards) return;
    if (state.index >= state.cards.length) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, JSON.stringify({ key, day: localDay(now), state }));
  } catch {
    // Storage full or blocked: the session still works, it just won't resume.
  }
}
