import type { LearnerProfile } from '../ai/types.ts';
import type { Repos } from '../domain/repos.ts';
import type { ErrorType, Settings } from '../domain/types.ts';

const SAMPLE = 40;
const WEEK_MS = 7 * 86_400_000;

/** Compact profile sent with AI calls: a sample of well-known words and recent error types. */
export async function learnerProfile(repos: Repos, settings: Settings): Promise<LearnerProfile> {
  const words = (await repos.items.byKind('word')).filter((item) => item.level >= 3);
  const sample = words.slice(-SAMPLE).map((item) => item.ref);
  const known = (await repos.dictionary.words(sample)).flatMap((word) =>
    word ? [word.forms[0] ?? word.readings[0] ?? ''] : [],
  );
  const reviews = await repos.reviews.since(Date.now() - WEEK_MS);
  const recentErrors = reviews.flatMap((review): ErrorType[] =>
    review.errorType && review.verdict !== 'correct' ? [review.errorType] : [],
  );
  const lesson = settings.currentLesson ? { currentLesson: settings.currentLesson } : {};
  return { knownWords: known.filter(Boolean), recentErrors: recentErrors.slice(-20), ...lesson };
}
