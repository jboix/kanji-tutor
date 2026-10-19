/**
 * The unsent sentence, kept per grammar point in this browser so a failed check or leaving the
 * screen never loses it. A convenience: storage may be unavailable, and then it is skipped.
 */
const key = (grammarId: string) => `kanji-reader:compose-draft:${grammarId}`;

export function loadDraft(grammarId: string): string {
  try {
    return globalThis.localStorage?.getItem(key(grammarId)) ?? '';
  } catch {
    return '';
  }
}

export function saveDraft(grammarId: string, text: string): void {
  try {
    if (text.trim() === '') globalThis.localStorage?.removeItem(key(grammarId));
    else globalThis.localStorage?.setItem(key(grammarId), text);
  } catch {
    // Storage blocked (private mode): the draft lives in memory only.
  }
}
