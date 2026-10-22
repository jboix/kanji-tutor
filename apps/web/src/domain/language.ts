/**
 * Which language the interface and the tutor use (N7b, N10, D52), pure: the stored choice, else
 * the browser's first offered language, else English. The interface and the tutor share this rule,
 * so a French browser gets French prose as well as a French interface (issue 43).
 */

/** Languages with an interface catalogue and tutor prose. */
export const LANGUAGE_CODES = ['en', 'fr', 'es'] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

const isOffered = (code: string): code is LanguageCode =>
  (LANGUAGE_CODES as readonly string[]).includes(code);

/** The first offered language among `wanted` (BCP-47, e.g. "fr-CA"), else English. */
export function pickLanguage(wanted: readonly string[]): LanguageCode {
  for (const tag of wanted) {
    const code = tag.trim().toLowerCase().split('-')[0] ?? '';
    if (isOffered(code)) return code;
  }
  return 'en';
}

/** The browser's preferred languages, or none outside a browser. */
export function browserLanguages(): readonly string[] {
  return globalThis.navigator?.languages ?? [];
}

/** The stored language, else the browser's when offered, else English. */
export function resolveLanguage(
  stored: string | undefined,
  browser: readonly string[] = browserLanguages(),
): LanguageCode {
  return pickLanguage(stored?.trim() ? [stored] : browser);
}
