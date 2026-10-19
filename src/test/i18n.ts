/** Translators for tests of plain functions that take `t`. */
import { ENGLISH } from '../ui/i18n/load.ts';
import { es } from '../ui/i18n/messages/es/index.ts';
import { fr } from '../ui/i18n/messages/fr/index.ts';
import { createTranslator } from '../ui/i18n/translate.ts';
import type { Translate } from '../ui/i18n/types.ts';
import type { UiLanguage } from '../ui/languages.ts';

const CATALOGUES = { en: ENGLISH, fr, es } as const;

/** `t` for a language, synchronously (English by default). */
export function translator(language: UiLanguage = 'en'): Translate {
  return createTranslator(language, CATALOGUES[language], ENGLISH);
}
