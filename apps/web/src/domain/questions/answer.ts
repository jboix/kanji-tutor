/**
 * Records question answers (J1–J5, T6) through the drill review path: a `Review` with mode
 * 'drill' and the question's kind. The tested item's FSRS card is rated Good when right and
 * Again when wrong or skipped (like a cloze drill), without changing its level.
 */
import type { Repos } from '../repos.ts';
import { reviewCard } from '../scheduler.ts';
import type { Grade, Review } from '../types.ts';
import type { Question } from './types.ts';

export interface QuestionAnswerInput {
  question: Question;
  /** Index of the option chosen (for ★ order: the piece put in the ★ slot). Ignored on a skip. */
  choice: number;
  /** "I don't know" (L4): the answer is shown, graded as a skip (Again, no error type). */
  skipped?: boolean | undefined;
  durationMs: number;
  now: number;
}

/**
 * The grade of a choice: `correct` or `wrong`, with the chosen near-miss's slip as the error
 * type (J1) or `wrong-kanji` for a lookalike spelling (J2). A skip has no error type.
 */
export function gradeQuestion(question: Question, choice: number, skipped = false): Grade {
  const expected = question.options[question.answer]?.text ?? '';
  if (skipped) return { verdict: 'wrong', expected, given: '', skipped: true };
  const chosen = question.options[choice];
  const given = chosen?.text ?? '';
  if (choice === question.answer) return { verdict: 'correct', expected, given };
  const grade: Grade = { verdict: 'wrong', expected, given };
  if (chosen?.swap) grade.errorType = 'wrong-kanji';
  else if (chosen?.slip) grade.errorType = chosen.slip;
  return grade;
}

function reviewOf(input: QuestionAnswerInput, grade: Grade): Review | undefined {
  const { question } = input;
  if (!question.itemId) return undefined;
  const swap = input.skipped ? undefined : question.options[input.choice]?.swap;
  const review: Review = {
    at: input.now,
    itemId: question.itemId,
    // A lookalike swap is stored as the two kanji (待, 持), so "still swapping" sees it.
    answer: swap ? swap[1] : grade.given,
    expected: swap ? swap[0] : grade.expected,
    verdict: grade.verdict,
    durationMs: input.durationMs,
    mode: 'drill',
    questionKind: question.kind,
  };
  if (question.sentenceId) review.sentenceId = question.sentenceId;
  if (grade.errorType) review.errorType = grade.errorType;
  if (grade.skipped) review.skipped = true;
  return review;
}

/**
 * Grades and logs a question answer, and reschedules the tested item's FSRS card (Good or
 * Again) when it has one. A question without an item (a passage with none) is only graded.
 */
export async function recordQuestionAnswer(
  repos: Repos,
  input: QuestionAnswerInput,
): Promise<Grade> {
  const grade = gradeQuestion(input.question, input.choice, input.skipped === true);
  const review = reviewOf(input, grade);
  if (!review) return grade;
  await repos.reviews.add(review);
  const item = await repos.items.get(review.itemId);
  if (item?.card) {
    const rating = grade.verdict === 'correct' ? 3 : 1;
    await repos.items.put({
      ...item,
      card: reviewCard(item.card, rating, input.now),
      updatedAt: input.now,
    });
  }
  return grade;
}
