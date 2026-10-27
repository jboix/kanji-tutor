/**
 * Strips the ［新］ marks older tutor instructions asked for after a new item. Nothing on screen
 * explains them, so they read as noise; cached replies still carry them.
 */

const MARK = /\s*[［[【]\s*新\s*[］\]】]/gu;

/** The reply with every ［新］ mark taken out of its strings, at any depth. */
export function withoutNewMarks<T>(value: T): T {
  if (typeof value === 'string') return value.replace(MARK, '') as T;
  if (Array.isArray(value)) return value.map(withoutNewMarks) as T;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => [key, withoutNewMarks(item)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}
