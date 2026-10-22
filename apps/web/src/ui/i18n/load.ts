/**
 * Loading a language's messages. English is in the app shell; French and Spanish are their
 * own chunks, fetched only when chosen.
 */
import type { UiLanguage } from '../languages.ts';
import { en } from './messages/en/index.ts';
import type { Messages } from './types.ts';

export const ENGLISH: Messages = en;

/** The catalogue of a language, loading its chunk the first time. */
export async function loadMessages(language: UiLanguage): Promise<Messages> {
  if (language === 'fr') return (await import('./messages/fr/index.ts')).fr;
  if (language === 'es') return (await import('./messages/es/index.ts')).es;
  return ENGLISH;
}
