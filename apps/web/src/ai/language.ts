/**
 * The explanation language (N10): named in both the system instruction and the request text,
 * and checked afterwards with a script heuristic, since a Flash-Lite model was seen answering in
 * Japanese when asked for French.
 */

/** Tutor prose defaults to English. */
export const DEFAULT_LANGUAGE = 'en';

/** English name of a BCP-47 code, e.g. "fr" → "French"; the code itself when unknown. */
export function languageName(code: string): string {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code);
    return name && name !== code ? name : code;
  } catch {
    return code;
  }
}

/** The system-instruction rule for the explanation language. */
export function languageRule(code: string): string {
  const name = languageName(code);
  return [
    `Write every piece of prose that is not Japanese (explanations, meanings, glosses, notes,`,
    `hooks, button labels, translations) in ${name} (${code}), even when the question is in`,
    'another language. Japanese words, sentences and readings stay in Japanese.',
  ].join(' ');
}

/** The first line of every request text. */
export function languageLine(code: string): string {
  const name = languageName(code);
  return `Explanation language: ${name} (${code}). Write all non-Japanese prose in ${name}.`;
}

/** Languages written in Latin script, whose prose can be checked by script. */
const LATIN = new Set(
  'en fr es de it pt nl ca pl sv da nb no fi cs ro hu tr id ms vi eu gl sk sl hr et lv lt'.split(
    ' ',
  ),
);

const count = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;

/**
 * True when the prose plausibly is in `code`. Latin-script languages need Latin letters to
 * outnumber kana and kanji; other non-Japanese languages need kana to stay under a third of all
 * letters. Japanese, and prose with no letters, always pass.
 */
export function proseInLanguage(prose: readonly string[], code: string): boolean {
  const base = code.toLowerCase().split('-')[0] ?? '';
  if (base === 'ja') return true;
  const text = prose.join(' ');
  const latin = count(text, /\p{Script=Latin}/gu);
  const kana = count(text, /[\p{Script=Hiragana}\p{Script=Katakana}]/gu);
  const han = count(text, /\p{Script=Han}/gu);
  if (LATIN.has(base)) return latin + kana + han === 0 || latin > kana + han;
  const letters = count(text, /\p{L}/gu);
  return letters === 0 || kana * 3 < letters;
}
