import { gradeReading, skipGrade } from '../grading.ts';
import { nextLevel } from '../knowledge.ts';
import type { Repos } from '../repos.ts';
import { newCard, ratingFor, reviewCard } from '../scheduler.ts';
import type { SessionCard, Target } from '../session-types.ts';
import type { AnswerMode, Grade, Item, Review, Word } from '../types.ts';
import { confusablesFor } from './confusables.ts';
import { ensureItem } from './items.ts';
import { refreshKanjiReadings } from './kanji-readings.ts';

export interface RecordAnswerInput {
  card: SessionCard;
  target: Target;
  /** What the learner typed (kana or romaji) or said (kana as pronounced). */
  answer: string;
  mode: AnswerMode;
  durationMs: number;
  now: number;
  /** "I don't know" (L4): show the answer and grade it as a skip (Again). */
  skipped?: boolean;
}

/** Grades with lookalike readings only when the plain grade is wrong (keeps right answers cheap). */
async function grade(repos: Repos, word: Word | undefined, input: RecordAnswerInput) {
  const { readings, variants = [] } = input.target;
  const plain = gradeReading(readings, input.answer, [], variants);
  if (plain.verdict !== 'wrong' || !word) return plain;
  const confusable = (await confusablesFor(repos, word, readings)).flatMap((c) => c.readings);
  return confusable.length > 0 ? gradeReading(readings, input.answer, confusable) : plain;
}

/**
 * First correct answer for this word in this sentence: a new context (K2 level 4). Drill
 * answers never count: choosing a kanji in a sentence is not reading the word there.
 */
async function isNewContext(repos: Repos, item: Item, sentenceId: string): Promise<boolean> {
  const reviews = await repos.reviews.byItem(item.id);
  return !reviews.some(
    (r) => r.sentenceId === sentenceId && r.verdict === 'correct' && r.mode !== 'drill',
  );
}

/** A graded reading of one word, to apply to its item and log as a `Review`. */
export interface GradedReading {
  wordId: string;
  result: Grade;
  answer: string;
  mode: AnswerMode;
  durationMs: number;
  now: number;
  /** The sentence it was read in; a drill word read alone has none (never a new context). */
  sentenceId?: string;
}

function reviewOf(item: Item, input: GradedReading): Review {
  const { result } = input;
  const review: Review = {
    at: input.now,
    itemId: item.id,
    answer: input.answer,
    expected: result.expected,
    verdict: result.verdict,
    durationMs: input.durationMs,
    mode: input.mode,
  };
  if (input.sentenceId !== undefined) review.sentenceId = input.sentenceId;
  if (result.errorType) review.errorType = result.errorType;
  if (result.skipped) review.skipped = true;
  if (result.variantOf) review.variantOf = result.variantOf;
  return review;
}

/**
 * Applies a graded reading (K2–K4): reviews the FSRS card with `ratingFor`, moves the level with
 * `nextLevel`, saves the item and a `Review`, and recomputes the derived readings of the word's
 * kanji. Creates the item when the word was new to the learner (a word met in a session).
 */
export async function saveGradedReading(repos: Repos, input: GradedReading): Promise<void> {
  const { now, result } = input;
  const word = await repos.dictionary.word(input.wordId);
  const { item } = await ensureItem(repos, { wordId: input.wordId, kind: 'session', now });
  const newContext =
    input.sentenceId !== undefined && (await isNewContext(repos, item, input.sentenceId));
  const next: Item = {
    ...item,
    level: nextLevel(item, result, { newContext }),
    card: reviewCard(item.card ?? newCard(now), ratingFor(result, input.durationMs), now),
    updatedAt: now,
  };
  await repos.items.put(next);
  await repos.reviews.add(reviewOf(item, input));
  if (word) await refreshKanjiReadings(repos, word);
}

/**
 * Grades one answer and records it (R3, R5, K2–K4): lookalike readings count as `wrong-kanji`,
 * then {@link saveGradedReading} updates the level, the FSRS card and the derived readings (a
 * new context is the first correct answer for the word in this sentence). A skip (L4) is graded
 * with {@link skipGrade}: Again, level as for a miss, and a review flagged `skipped`.
 */
export async function recordAnswer(repos: Repos, input: RecordAnswerInput): Promise<Grade> {
  const { target } = input;
  const word = await repos.dictionary.word(target.wordId);
  const result = input.skipped ? skipGrade(target.readings) : await grade(repos, word, input);
  await saveGradedReading(repos, {
    wordId: target.wordId,
    result,
    answer: input.answer,
    mode: input.mode,
    durationMs: input.durationMs,
    now: input.now,
    sentenceId: input.card.sentence.id,
  });
  return result;
}
