/**
 * The app's last errors, kept in this browser for the diagnostics developer mode copies: what
 * went wrong, where and when, surviving the reload that usually follows. A convenience: storage
 * may be unavailable, and then nothing is kept.
 */

export interface LoggedError {
  at: number;
  /** Where it was caught: "window", "promise" or "screen". */
  where: string;
  message: string;
  /** The first lines of its stack, when it had one. */
  stack?: string;
}

/** Under the app's first name, like its other keys. */
const KEY = 'kanji-reader:errors';

/** The most errors kept, newest last. */
const KEPT = 20;
const STACK_LINES = 6;

function isLogged(value: unknown): value is LoggedError {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<LoggedError>;
  return typeof entry.at === 'number' && typeof entry.message === 'string';
}

export function recentErrors(): LoggedError[] {
  try {
    const value: unknown = JSON.parse(globalThis.localStorage?.getItem(KEY) ?? '[]');
    return Array.isArray(value) ? value.filter(isLogged) : [];
  } catch {
    return [];
  }
}

function describe(error: unknown): Pick<LoggedError, 'message' | 'stack'> {
  if (typeof error !== 'object' || error === null) return { message: String(error) };
  const { message, name, stack } = error as Partial<Error>;
  const text = `${name ?? 'Error'}: ${message ?? String(error)}`;
  const lines = typeof stack === 'string' ? stack.split('\n').slice(0, STACK_LINES) : [];
  return lines.length > 0 ? { message: text, stack: lines.join('\n') } : { message: text };
}

/** Keeps this error among the last ones. */
export function recordError(error: unknown, where: string, now = Date.now()): void {
  try {
    const kept = [...recentErrors(), { at: now, where, ...describe(error) }].slice(-KEPT);
    globalThis.localStorage?.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Storage blocked or full: this error goes unrecorded.
  }
}

/** Records uncaught errors and unhandled rejections from now on. */
export function installErrorLog(target: Window = window): void {
  target.addEventListener('error', (event) => recordError(event.error ?? event.message, 'window'));
  target.addEventListener('unhandledrejection', (event) => recordError(event.reason, 'promise'));
}
