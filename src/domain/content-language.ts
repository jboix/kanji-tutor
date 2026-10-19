/**
 * The app's own content in the learner's language (N9, D53). French and Spanish texts are loaded
 * on demand, one chunk per language, so they stay out of the app shell; English is the entries
 * themselves. A missing text falls back to English, and the result says so, for the UI to mark.
 */
import type {
  ContentTranslations,
  FunctionWordText,
  GrammarText,
  UnitText,
} from './content-types.ts';
import type { FunctionWord, GrammarEntry } from './grammar/types.ts';
import type { Unit } from './themes/types.ts';

/** Languages with content written for the app, besides English. */
export const CONTENT_LANGUAGES = ['fr', 'es'] as const;

export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

/** Lookup maps for one language, by entry id. Empty for English. */
export interface ContentLookup {
  /** Base language code, e.g. "fr" for "fr-CA". */
  language: string;
  grammar: ReadonlyMap<string, GrammarText>;
  functionWords: ReadonlyMap<string, FunctionWordText>;
  units: ReadonlyMap<string, UnitText>;
}

/** A value in the learner's language, or in English with `english: true` when none exists. */
export interface Localized<T> {
  value: T;
  english: boolean;
}

const SOURCES: Readonly<Record<ContentLanguage, () => Promise<ContentTranslations>>> = {
  fr: async () => {
    const [grammar, themes] = await Promise.all([
      import('./grammar/fr/index.ts'),
      import('./themes/fr/index.ts'),
    ]);
    return {
      grammar: grammar.FR_GRAMMAR,
      functionWords: grammar.FR_PARTICLES,
      units: themes.FR_UNITS,
    };
  },
  es: async () => {
    const [grammar, themes] = await Promise.all([
      import('./grammar/es/index.ts'),
      import('./themes/es/index.ts'),
    ]);
    return {
      grammar: grammar.ES_GRAMMAR,
      functionWords: grammar.ES_PARTICLES,
      units: themes.ES_UNITS,
    };
  },
};

/** "fr-CA" → "fr"; "" → "en". */
export function baseLanguage(language: string): string {
  return language.trim().toLowerCase().split('-')[0] || 'en';
}

const isContentLanguage = (code: string): code is ContentLanguage =>
  (CONTENT_LANGUAGES as readonly string[]).includes(code);

/** Lookup maps over one language's translations (a fixture in tests). */
export function contentLookup(language: string, texts?: ContentTranslations): ContentLookup {
  return {
    language: baseLanguage(language),
    grammar: new Map(Object.entries(texts?.grammar ?? {})),
    functionWords: new Map(Object.entries(texts?.functionWords ?? {})),
    units: new Map(Object.entries(texts?.units ?? {})),
  };
}

/** English: the entries as written, never marked. */
export const ENGLISH_CONTENT: ContentLookup = contentLookup('en');

const loaded = new Map<string, Promise<ContentLookup>>();

/**
 * The lookup maps for `language` (BCP-47), loading its chunk once. English, and a language with
 * no content yet, resolve to empty maps: everything then shows in English.
 */
export function loadContentLanguage(language: string): Promise<ContentLookup> {
  const base = baseLanguage(language);
  const cached = loaded.get(base);
  if (cached) return cached;
  const load = isContentLanguage(base) ? SOURCES[base]() : Promise.resolve(undefined);
  const lookup = load.then((texts) => contentLookup(base, texts));
  loaded.set(base, lookup);
  lookup.catch(() => loaded.delete(base));
  return lookup;
}

function localized<T>(lookup: ContentLookup, value: T, found: boolean): Localized<T> {
  return { value, english: !found && lookup.language !== 'en' };
}

/** A catalogue point with its meaning, explanation and formation in the lookup's language. */
export function localGrammar(lookup: ContentLookup, entry: GrammarEntry): Localized<GrammarEntry> {
  const text = lookup.grammar.get(entry.id);
  if (!text) return localized(lookup, entry, false);
  const { meaning, explanation, formation = entry.formation } = text;
  return localized(lookup, { ...entry, meaning, explanation, formation }, true);
}

/** A particle or function word with its meaning, explanation and uses translated. */
export function localFunctionWord(
  lookup: ContentLookup,
  word: FunctionWord,
): Localized<FunctionWord> {
  const text = lookup.functionWords.get(word.id);
  if (!text) return localized(lookup, word, false);
  const uses = word.uses.map((use, i) => ({ ...use, ...text.uses[i] }));
  return localized(
    lookup,
    { ...word, meaning: text.meaning, explanation: text.explanation, uses },
    true,
  );
}

/** Either kind of grammar page subject, translated. */
export function localPoint<T extends GrammarEntry | FunctionWord>(
  lookup: ContentLookup,
  point: T,
): Localized<T> {
  return (
    'uses' in point ? localFunctionWord(lookup, point) : localGrammar(lookup, point as GrammarEntry)
  ) as Localized<T>;
}

/** A unit with its theme, summary, passage translations and question explanations translated. */
export function localUnit(lookup: ContentLookup, unit: Unit): Localized<Unit> {
  const text = lookup.units.get(unit.id);
  if (!text) return localized(lookup, unit, false);
  const sentences = unit.passage.sentences.map((s, i) => ({ ...s, en: text.sentences[i] ?? s.en }));
  const questions = unit.questions.map((q, i) => ({
    ...q,
    explanation: text.questions[i] ?? q.explanation,
  }));
  const { theme, summary } = text;
  return localized(lookup, { ...unit, theme, summary, passage: { sentences }, questions }, true);
}
