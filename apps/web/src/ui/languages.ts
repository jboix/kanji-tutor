import { resolveLanguage } from '../domain/language.ts';

/** Languages of the interface and the tutor (N7b). */
export const UI_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
] as const;

export type UiLanguage = (typeof UI_LANGUAGES)[number]['value'];

/** The stored language, else the browser's when offered, else English (N7b). */
export function languageOf(stored: string | undefined, browser = navigator.languages): UiLanguage {
  return resolveLanguage(stored, browser ?? []);
}

/** "Français" for "fr". */
export function languageName(code: string): string {
  return UI_LANGUAGES.find((language) => language.value === code)?.label ?? code;
}
