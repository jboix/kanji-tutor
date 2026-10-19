/** Dates, numbers and costs in the learner's language (N7b, D52). */
import type { UiLanguage } from '../languages.ts';
import { LOCALES } from './translate.ts';

/** Formatters for one language; built once per language by the provider. */
export interface Formats {
  /** 1 234 in French, 1,234 in English. */
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** A date or timestamp, e.g. `{ day: 'numeric', month: 'long' }` gives "18 octobre". */
  date: (at: number | Date, options?: Intl.DateTimeFormatOptions) => string;
  /** A cost in US dollars: four decimals under a cent, else two ("0,0004 $" in French). */
  cost: (usd: number) => string;
}

/** The formatters for a language. */
export function createFormats(language: UiLanguage): Formats {
  const locale = LOCALES[language];
  return {
    number: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    date: (at, options) => new Intl.DateTimeFormat(locale, options).format(new Date(at)),
    cost: (usd) => {
      const digits = usd !== 0 && Math.abs(usd) < 0.01 ? 4 : 2;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(usd);
    },
  };
}
