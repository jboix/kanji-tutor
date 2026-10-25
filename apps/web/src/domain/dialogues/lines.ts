/** Reading a dialogue's lines, pure: where a focus stands, a line with its focus blanked, texts. */

import { baseLanguage, type Localized } from '../content-language.ts';
import { PATTERN_BLANK } from '../drills/blank.ts';
import type { Dialogue, DialogueLine, DialogueText } from './types.ts';

/** A span of a line's text, `to` exclusive. */
interface FocusRange {
  from: number;
  to: number;
}

/** Where a line's focus stands in its text; undefined without one, or when it is not in it. */
export function focusRange(line: Pick<DialogueLine, 'ja' | 'focus'>): FocusRange | undefined {
  if (!line.focus) return undefined;
  const from = line.ja.indexOf(line.focus);
  return from < 0 ? undefined : { from, to: from + line.focus.length };
}

/** A line's text with its focus replaced by `fill` (the blank by default). */
export function blankedText(line: DialogueLine, fill = PATTERN_BLANK): string {
  const range = focusRange(line);
  if (!range) return line.ja;
  return `${line.ja.slice(0, range.from)}${fill}${line.ja.slice(range.to)}`;
}

/** A text in the language ("fr-CA" → French); English, marked, for a language with none. */
export function dialogueText(text: DialogueText, language: string): Localized<string> {
  const base = baseLanguage(language);
  if (base === 'fr' || base === 'es') return { value: text[base], english: false };
  return { value: text.en, english: base !== 'en' };
}

/**
 * The lines as spoken, in order. With `hideBlank`, the blanked line's focus is left out (a
 * pause), so listening before the answer does not give it away.
 */
export function spokenLines(dialogue: Dialogue, hideBlank = false): string[] {
  return dialogue.lines.map((line, i) =>
    hideBlank && i === dialogue.blank.line ? blankedText(line, '、') : line.ja,
  );
}
