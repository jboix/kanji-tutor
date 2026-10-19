import { type Card, createEmptyCard, type Grade as FsrsGrade, fsrs, type State } from 'ts-fsrs';
import type { CardState, Grade } from './types.ts';

/** FSRS rating, as ts-fsrs numbers it. */
export type Rating = 1 | 2 | 3 | 4;

/** Correct answers faster than this are rated Easy. */
export const FAST_ANSWER_MS = 4000;

/** Assumed time per session sentence, answer and feedback included. */
export const SECONDS_PER_SENTENCE = 20;

/** Default FSRS parameters without fuzz, so schedules are deterministic and testable. */
const scheduler = fsrs({ enable_fuzz: false });

function toCardState(card: Card): CardState {
  const state: CardState = {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as CardState['state'],
  };
  if (card.last_review) state.lastReview = card.last_review.getTime();
  return state;
}

function toFsrsCard(card: CardState): Card {
  const fsrsCard: Card = {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
  };
  if (card.lastReview !== undefined) fsrsCard.last_review = new Date(card.lastReview);
  return fsrsCard;
}

/** A fresh FSRS card due now (K4). */
export function newCard(now: number): CardState {
  return toCardState(createEmptyCard(new Date(now)));
}

/**
 * Maps a grade to an FSRS rating: wrong → Again, near-miss → Hard, correct → Good, and correct
 * in under {@link FAST_ANSWER_MS} → Easy. A duration of 0 or less means "not measured" (Good).
 */
export function ratingFor(grade: Grade, durationMs: number): Rating {
  if (grade.verdict === 'wrong') return 1;
  if (grade.verdict === 'near-miss') return 2;
  return durationMs > 0 && durationMs < FAST_ANSWER_MS ? 4 : 3;
}

/** Applies a review to a card with ts-fsrs and returns the next state. */
export function reviewCard(card: CardState, rating: Rating, now: number): CardState {
  const next = scheduler.next(toFsrsCard(card), new Date(now), rating as FsrsGrade);
  return toCardState(next.card);
}

/**
 * Rough session length in minutes for `sentenceCount` sentences (R1): about
 * {@link SECONDS_PER_SENTENCE} seconds each, rounded up, at least 1 for a non-empty session.
 */
export function estimateMinutes(sentenceCount: number): number {
  if (sentenceCount <= 0) return 0;
  return Math.max(1, Math.ceil((sentenceCount * SECONDS_PER_SENTENCE) / 60));
}
