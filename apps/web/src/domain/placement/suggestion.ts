/**
 * The re-estimate over the `Repos` port (A11): the last 30 days of reviews, each tagged with the
 * JLPT level of its word, kanji or grammar point, and how many reviews the learner has in all.
 */
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { parseItemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import { learnerLevelOf } from '../services/learner-level.ts';
import type { LearnerLevel, Review } from '../types.ts';
import { ESTIMATE_WINDOW_MS, type LevelledReview, levelFromReviews } from './review-estimate.ts';

type Jlpt = LevelledReview['level'];

const GRAMMAR_LEVELS = new Map<string, Jlpt>(GRAMMAR_CATALOGUE.map((e) => [e.id, e.level]));

async function levelsOf(repos: Repos, reviews: readonly Review[]): Promise<Map<string, Jlpt>> {
  const refs = [...new Set(reviews.map((review) => review.itemId))].map(parseItemId);
  const wordIds = refs.filter((r) => r.kind === 'word').map((r) => r.ref);
  const kanjiRefs = refs.filter((r) => r.kind === 'kanjiReading' || r.kind === 'kanji');
  const chars = [...new Set(kanjiRefs.map((r) => r.ref.split(':')[0] ?? ''))];
  const [words, kanji] = await Promise.all([
    repos.dictionary.words(wordIds),
    repos.dictionary.kanjiMany(chars),
  ]);
  const found = new Map<string, Jlpt>();
  for (const word of words) if (word?.jlpt) found.set(`word:${word.id}`, word.jlpt);
  for (const entry of kanji) if (entry?.jlpt) found.set(`kanji:${entry.char}`, entry.jlpt);
  return found;
}

function levelOf(levels: ReadonlyMap<string, Jlpt>, review: Review): Jlpt | undefined {
  const { kind, ref } = parseItemId(review.itemId);
  if (kind === 'grammar') return GRAMMAR_LEVELS.get(ref);
  if (kind === 'kanjiReading') return levels.get(`kanji:${ref.split(':')[0] ?? ''}`);
  return levels.get(review.itemId);
}

export interface LevelSuggestion {
  /** All reviews ever, for "offer the placement under 20 reviews". */
  reviews: number;
  current: LearnerLevel;
  /** What the last 30 days suggest, when it differs from the current level. */
  suggested?: LearnerLevel;
}

/** The learner's review count and, when the reviews point elsewhere, a suggested level. */
export async function levelSuggestion(repos: Repos, now: number): Promise<LevelSuggestion> {
  const [all, settings] = await Promise.all([repos.reviews.all(), repos.settings.get()]);
  const current = learnerLevelOf(settings);
  const recent = all.filter((review) => review.at >= now - ESTIMATE_WINDOW_MS);
  const levels = await levelsOf(repos, recent);
  const tagged = recent.flatMap((review) => {
    const level = levelOf(levels, review);
    const correct = review.verdict === 'correct' && !review.skipped;
    return level ? [{ level, correct }] : [];
  });
  const suggested = levelFromReviews(tagged);
  const result: LevelSuggestion = { reviews: all.length, current };
  if (suggested !== undefined && suggested !== current) result.suggested = suggested;
  return result;
}
