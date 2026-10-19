/**
 * Pack text in the learner's language (N9): French or Spanish glosses and translations from an
 * installed language pack, else the English base text, flagged so the UI can mark it.
 */
import type { Sentence, Word } from './types.ts';

/** A value in the wanted language, or the English one with `fallback` set. */
export interface Localized<T> {
  value: T;
  /** True when the English base text stands in for a missing translation. */
  fallback: boolean;
}

const baseOf = (language: string) => language.toLowerCase().split('-')[0] ?? language;

/** The word's glosses in `language` when the pack has them, else the English ones, marked. */
export function glossesIn(
  word: Pick<Word, 'glosses' | 'glossesByLang'>,
  language: string,
): Localized<readonly string[]> {
  const base = baseOf(language);
  if (base === 'en') return { value: word.glosses, fallback: false };
  const own = word.glossesByLang?.[language] ?? word.glossesByLang?.[base];
  if (own && own.length > 0) return { value: own, fallback: false };
  return { value: word.glosses, fallback: word.glosses.length > 0 };
}

/** The sentence's translation in `language` when the pack has one, else the English one, marked. */
export function translationIn(
  sentence: Pick<Sentence, 'translation'> & { translations?: Readonly<Record<string, string>> },
  language: string,
): Localized<string | undefined> {
  const base = baseOf(language);
  if (base === 'en') return { value: sentence.translation, fallback: false };
  const own = sentence.translations?.[language] ?? sentence.translations?.[base];
  if (own) return { value: own, fallback: false };
  return { value: sentence.translation, fallback: sentence.translation !== undefined };
}

/**
 * A question's translation in `language` (N9, issue 44): its source sentence's, from the language
 * pack, when the question was built from that sentence; else its own English one, marked.
 */
export function questionTranslationIn(
  question: { translation?: string; sentenceId?: string },
  sentence: Pick<Sentence, 'id' | 'translation' | 'translations'> | undefined,
  language: string,
): Localized<string | undefined> {
  if (sentence && sentence.id === question.sentenceId) {
    const own = translationIn(sentence, language);
    if (own.value) return own;
  }
  const english = question.translation;
  return { value: english, fallback: english !== undefined && baseOf(language) !== 'en' };
}

/**
 * The meaning a blank question (J3, J4) shows before it is answered: its English translation
 * with the blank's meaning masked (D94), marked English in another language, or none.
 */
export function questionHintIn(
  question: { hint?: string },
  language: string,
): Localized<string | undefined> {
  const hint = question.hint;
  return { value: hint, fallback: hint !== undefined && baseOf(language) !== 'en' };
}
