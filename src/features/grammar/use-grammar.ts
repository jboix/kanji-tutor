/** Data for the grammar pages: the learner's state per point and the example sentences. */
import { useEffect, useRef, useState } from 'react';
import { detectEntry, type GrammarEntry } from '../../domain/grammar/index.ts';
import { itemId } from '../../domain/ids.ts';
import { translationIn } from '../../domain/localized.ts';
import type { Repos } from '../../domain/repos.ts';
import { learnerLevelOf } from '../../domain/services/index.ts';
import type { Item, LearnerLevel, Sentence } from '../../domain/types.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';

/** Unseen (untracked or level 0), learning (1–2) or known (3–4), as on the learned screen. */
export type GrammarState = 'unseen' | 'learning' | 'known';

export function stateOfItem(item: Pick<Item, 'level'> | undefined): GrammarState {
  if (!item || item.level === 0) return 'unseen';
  return item.level >= 3 ? 'known' : 'learning';
}

/** Loads a value again whenever `key` changes; undefined while it loads. */
function useLoaded<T>(key: string, load: (repos: Repos) => Promise<T>): T | undefined {
  const { repos } = useServices();
  const loader = useRef(load);
  loader.current = load;
  const [value, setValue] = useState<{ key: string; value: T }>();
  useEffect(() => {
    let live = true;
    void loader.current(repos).then((loaded) => live && setValue({ key, value: loaded }));
    return () => {
      live = false;
    };
  }, [repos, key]);
  return value?.key === key ? value.value : undefined;
}

/** Item states of every tracked grammar point, by grammar id. */
export function useGrammarStates(): Map<string, GrammarState> | undefined {
  return useLoaded('all', async (repos) => {
    const items = await repos.items.byKind('grammar');
    return new Map(items.map((item) => [item.ref, stateOfItem(item)]));
  });
}

export interface PointProgress {
  state: GrammarState;
  /** Epoch ms of the last review, if any. */
  lastReviewed?: number;
}

async function progressOf(repos: Repos, id: string): Promise<PointProgress> {
  const key = itemId('grammar', id);
  const item = await repos.items.get(key);
  const state = stateOfItem(item);
  const last =
    item?.card?.lastReview ?? Math.max(0, ...(await repos.reviews.byItem(key)).map((r) => r.at));
  return last > 0 ? { state, lastReviewed: last } : { state };
}

/** The learner's state for one point and when it was last reviewed. */
export function usePointProgress(id: string): PointProgress | undefined {
  return useLoaded(id, (repos) => progressOf(repos, id));
}

/** One example: the sentence, the grammar span (token indices) and its translation. */
export interface Example {
  sentence: Sentence;
  span: number[];
  translation?: string;
  /** The translation is English because none exists in the learner's language. */
  english: boolean;
}

export interface Examples {
  examples: Example[];
  /** None at the learner's level: these are at the point's own (harder) level. */
  aboveLevel: boolean;
}

function translate(sentence: Sentence, language: string): Pick<Example, 'translation' | 'english'> {
  const { value, fallback } = translationIn(sentence, language);
  return value === undefined ? { english: false } : { translation: value, english: fallback };
}

function exampleOf(entry: GrammarEntry, sentence: Sentence, language: string): Example {
  const match = detectEntry(entry, sentence.tokens);
  const span = match
    ? Array.from({ length: match.end - match.start }, (_, i) => match.start + i)
    : [];
  return { sentence, span, ...translate(sentence, language) };
}

async function query(repos: Repos, entry: GrammarEntry, maxLevel: LearnerLevel, limit: number) {
  const found = await repos.sentences.withGrammar(entry.id, { maxLevel, limit });
  return found.filter((sentence) => sentence.verified);
}

async function examplesOf(
  repos: Repos,
  entry: GrammarEntry,
  limit: number,
  language: string,
): Promise<Examples> {
  const level = learnerLevelOf(await repos.settings.get());
  let found = await query(repos, entry, level, limit);
  const aboveLevel = found.length === 0 && entry.level < level;
  if (aboveLevel) found = await query(repos, entry, entry.level, limit);
  return { examples: found.map((s) => exampleOf(entry, s, language)), aboveLevel };
}

/** Pack sentences that use the point, at or below the learner's level, easiest first. */
export function useExamples(entry: GrammarEntry | undefined, limit = 8): Examples | undefined {
  const { language } = useI18n();
  return useLoaded(`${entry?.id ?? ''}:${limit}:${language}`, async (repos) =>
    entry ? examplesOf(repos, entry, limit, language) : { examples: [], aboveLevel: false },
  );
}
