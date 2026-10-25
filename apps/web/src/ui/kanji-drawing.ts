/**
 * Settings → Sessions → Write the kanji: Draw (the default) or Type. Followed by every settings
 * read and write, so a session knows at once whether to offer the drawing pad.
 */
let typed = false;

/** Type: writing exercises ask for the word's reading in kana, never a drawing. */
export function typeKanji(value: boolean): void {
  typed = value;
}

/** True when the learner chose to type writing exercises instead of drawing them. */
export function kanjiTyped(): boolean {
  return typed;
}
