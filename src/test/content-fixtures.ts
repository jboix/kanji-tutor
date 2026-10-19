/** Content lookups for component tests (N9): the real texts, minus ids a test leaves out. */
import { type ContentLookup, contentLookup } from '../domain/content-language.ts';
import type { ById } from '../domain/content-types.ts';
import { ES_GRAMMAR, ES_PARTICLES } from '../domain/grammar/es/index.ts';
import { FR_GRAMMAR, FR_PARTICLES } from '../domain/grammar/fr/index.ts';
import { ES_UNITS } from '../domain/themes/es/index.ts';
import { FR_UNITS } from '../domain/themes/fr/index.ts';

const TEXTS = {
  fr: { grammar: FR_GRAMMAR, functionWords: FR_PARTICLES, units: FR_UNITS },
  es: { grammar: ES_GRAMMAR, functionWords: ES_PARTICLES, units: ES_UNITS },
};

function without<T>(texts: ById<T>, missing: readonly string[]): ById<T> {
  return Object.fromEntries(Object.entries(texts).filter(([id]) => !missing.includes(id)));
}

/** The French or Spanish lookup with the `missing` ids removed, to show the English fallback. */
export function lookupWithout(
  language: 'fr' | 'es',
  missing: readonly string[] = [],
): ContentLookup {
  const texts = TEXTS[language];
  return contentLookup(language, {
    grammar: without(texts.grammar, missing),
    functionWords: without(texts.functionWords, missing),
    units: without(texts.units, missing),
  });
}

export { ES_GRAMMAR, ES_PARTICLES, ES_UNITS, FR_GRAMMAR, FR_PARTICLES, FR_UNITS };
