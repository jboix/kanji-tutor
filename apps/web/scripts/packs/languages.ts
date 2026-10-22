/**
 * Language packs (N9): JMdict glosses and Tatoeba translations in French and Spanish for the
 * words and sentences of the base pack. A word or sentence with nothing in that language is left
 * out, and the app falls back to English and marks it.
 */
import type { PackLanguage } from '../../src/domain/repos.ts';
import type { Sentence, Word } from '../../src/domain/types.ts';
import type { SourcePath } from './corpus.ts';
import { readBz2Text, readTgzJson } from './fetch.ts';
import { type JmDict, senseGlosses } from './jmdict.ts';
import { SOURCES, type Source } from './sources.ts';
import { translationsFor } from './tatoeba.ts';

/** One word's glosses in the pack language. */
export interface GlossRecord {
  id: string;
  glosses: string[];
}

/** One sentence's translation in the pack language. */
export interface TranslationRecord {
  id: string;
  text: string;
}

export interface LanguagePack {
  language: PackLanguage;
  glosses: GlossRecord[];
  translations: TranslationRecord[];
}

interface LanguageSources {
  /** JMdict language tag of the glosses. */
  jmdictLang: string;
  jmdict: Source;
  sentences: Source;
  links: Source;
}

export const LANGUAGE_SOURCES: Record<PackLanguage, LanguageSources> = {
  fr: {
    jmdictLang: 'fre',
    jmdict: SOURCES.jmdictFre,
    sentences: SOURCES.fraSentences,
    links: SOURCES.fraLinks,
  },
  es: {
    jmdictLang: 'spa',
    jmdict: SOURCES.jmdictSpa,
    sentences: SOURCES.spaSentences,
    links: SOURCES.spaLinks,
  },
};

/** Glosses for the pack words that the language's JMdict build has, in pack order. */
export function glossRecords(dict: JmDict, lang: string, words: readonly Word[]): GlossRecord[] {
  const byId = new Map(dict.words.map((w) => [w.id, w]));
  return words.flatMap((w) => {
    const entry = byId.get(w.id);
    const glosses = entry ? senseGlosses(entry, lang) : [];
    return glosses.length > 0 ? [{ id: w.id, glosses }] : [];
  });
}

/** Translations for the Tatoeba sentences of the pack, in pack order. */
export function translationRecords(
  sentences: readonly Sentence[],
  found: Map<string, string>,
): TranslationRecord[] {
  return sentences.flatMap((s) => {
    const text = s.source === 'tatoeba' && s.sourceRef ? found.get(s.sourceRef) : undefined;
    return text ? [{ id: s.id, text }] : [];
  });
}

/** Builds one language pack from its pinned sources. */
export async function buildLanguagePack(
  language: PackLanguage,
  path: SourcePath,
  pack: { words: readonly Word[]; sentences: readonly Sentence[] },
): Promise<LanguagePack> {
  const src = LANGUAGE_SOURCES[language];
  const dict = readTgzJson<JmDict>(await path(src.jmdict));
  const refs = new Set(pack.sentences.flatMap((s) => (s.sourceRef ? [s.sourceRef] : [])));
  const found = translationsFor(
    refs,
    readBz2Text(await path(src.sentences)),
    readBz2Text(await path(src.links)),
  );
  return {
    language,
    glosses: glossRecords(dict, src.jmdictLang, pack.words),
    translations: translationRecords(pack.sentences, found),
  };
}
