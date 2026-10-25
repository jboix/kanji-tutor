/**
 * The learner's own sentences (Use it, AI) that the next session serves first (R6). Such a
 * sentence gets priority while it passes i+1, every unknown word in it is a tracked word added in the last 7 days
 * (level ≤ 2) or due, and it has not been shown in the last 7 days. Being unshown, it is exempt
 * from the two-day avoid rule.
 */
import type { Repos } from '../repos.ts';
import { isIPlusOne, unknownTokens } from '../selector.ts';
import type { WordLevels } from '../session-types.ts';
import type { Item, Sentence, SentenceSource } from '../types.ts';
import { DAY_MS } from './items.ts';
import { trustedSentences } from './sentence-trust.ts';

/** How long a new own sentence keeps priority, and how far back "shown" is checked. */
export const OWN_WINDOW_MS = 7 * DAY_MS;

/**
 * Lines of a scanned lesson (source `capture`) are not among them: a scan is practised on its own,
 * and nothing in it is served in the daily sessions.
 */
const OWN_SOURCES: readonly SentenceSource[] = ['compose', 'ai'];

/** What the priority check reads: tracked word items by JMdict id and their levels. */
export interface OwnContext {
  items: ReadonlyMap<string, Item>;
  levels: WordLevels;
  now: number;
}

/** Own sentences to serve first, and the word items they target. */
export interface OwnPriority {
  sentences: Sentence[];
  items: Item[];
}

/** New this week (level ≤ 2, added in the window) or due now. */
function waiting(item: Item, now: number): boolean {
  const isNew = item.level <= 2 && item.source.addedAt >= now - OWN_WINDOW_MS;
  return isNew || (item.card?.due ?? Number.POSITIVE_INFINITY) <= now;
}

/** The items of the sentence's unknown words when it qualifies, else undefined. */
function waitingItems(sentence: Sentence, ctx: OwnContext): Item[] | undefined {
  if (!sentence.verified || !isIPlusOne(sentence, ctx.levels)) return undefined;
  const unknown = unknownTokens(sentence, ctx.levels);
  const found = unknown.flatMap((i) => {
    const item = ctx.items.get(sentence.tokens[i]?.wordId ?? '');
    return item && waiting(item, ctx.now) ? [item] : [];
  });
  return found.length === unknown.length ? found : undefined;
}

async function shownSince(repos: Repos, at: number): Promise<Set<string>> {
  const reviews = await repos.reviews.since(at);
  return new Set(reviews.flatMap((review) => review.sentenceId ?? []));
}

/** The given sentences that get priority in the next session, with their items. */
export async function prioritised(
  repos: Repos,
  sentences: readonly Sentence[],
  ctx: OwnContext,
): Promise<OwnPriority> {
  const shown = await shownSince(repos, ctx.now - OWN_WINDOW_MS);
  const fits = sentences.filter((s) => !shown.has(s.id) && waitingItems(s, ctx) !== undefined);
  const trusted = await trustedSentences(repos, fits, ctx.levels);
  const items = new Map(trusted.flatMap((s) => waitingItems(s, ctx) ?? []).map((i) => [i.id, i]));
  return { sentences: trusted, items: [...items.values()] };
}

/** Every own sentence (compose, AI) the next session should serve first. */
export async function ownPriority(repos: Repos, ctx: OwnContext): Promise<OwnPriority> {
  const lists = await Promise.all(OWN_SOURCES.map((source) => repos.sentences.bySource(source)));
  return prioritised(repos, lists.flat(), ctx);
}
