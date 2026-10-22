/** Message lookup, interpolation and plurals (N7b, D52). Pure: no React. */
import type { UiLanguage } from '../languages.ts';
import type { MessageKey, Messages, ParamValue, PluralMessage, Translate } from './types.ts';

/** The locale used for numbers, dates and plural rules in each language. */
export const LOCALES: Readonly<Record<UiLanguage, string>> = {
  en: 'en-GB',
  fr: 'fr-FR',
  es: 'es-ES',
};

type Lookup = Record<string, Record<string, string | PluralMessage | undefined> | undefined>;

function lookup(messages: Messages, key: string): string | PluralMessage | undefined {
  const dot = key.indexOf('.');
  return (messages as unknown as Lookup)[key.slice(0, dot)]?.[key.slice(dot + 1)];
}

/** Fills `{name}` holes; numbers are formatted for the locale. Unknown holes stay as they are. */
export function interpolate(
  text: string,
  params: Readonly<Record<string, ParamValue>>,
  numbers: Intl.NumberFormat,
): string {
  return text.replace(/\{(\w+)\}/g, (hole, name: string) => {
    const value = params[name];
    if (value === undefined) return hole;
    return typeof value === 'number' ? numbers.format(value) : value;
  });
}

function pluralForm(message: PluralMessage, n: number, rules: Intl.PluralRules): string {
  const exact = n === 0 ? message.zero : undefined;
  return exact ?? message[rules.select(n)] ?? message.other;
}

/**
 * A translator for one language. A key missing from `messages` (possible only at runtime, for a
 * partial catalogue) falls back to English, and an unknown key shows as itself.
 */
export function createTranslator(
  language: UiLanguage,
  messages: Messages,
  english: Messages,
): Translate {
  const rules = new Intl.PluralRules(LOCALES[language]);
  const numbers = new Intl.NumberFormat(LOCALES[language]);
  return ((key: MessageKey, params: Record<string, ParamValue> = {}) => {
    const message = lookup(messages, key) ?? lookup(english, key);
    if (message === undefined) return key;
    const text =
      typeof message === 'string' ? message : pluralForm(message, Number(params.n ?? 0), rules);
    return interpolate(text, params, numbers);
  }) as Translate;
}
