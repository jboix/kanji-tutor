/**
 * Records drill answers (R8) as `Review`s with mode 'drill'. Reading a word in a "many readings"
 * drill goes through the same level and FSRS update as a session answer. A cloze choice is the
 * grammar point's review: it updates that item's FSRS card (right → Good, wrong → Again) but not
 * its level. Choosing a kanji and guessing a family member's on'yomi are only logged.
 */
import {
  type ClozeDrill,
  type Drill,
  type ExerciseDrill,
  type FamilyDrill,
  gradeExercise,
  type LookalikeDrill,
  type ReadingItem,
} from '../drills/index.ts';
import { gradeReading, skipGrade } from '../grading.ts';
import type { Repos } from '../repos.ts';
import { reviewCard } from '../scheduler.ts';
import type { Grade, ItemId, Review } from '../types.ts';
import { saveGradedReading } from './answer.ts';

interface Timing {
  durationMs: number;
  now: number;
  /** "I don't know" (L4): the answer is shown and graded as a skip (Again, no error type). */
  skipped?: boolean | undefined;
}

function reviewOf(itemId: ItemId, grade: Grade, answer: string, timing: Timing): Review {
  const review: Review = {
    at: timing.now,
    itemId,
    answer,
    expected: grade.expected,
    verdict: grade.verdict,
    durationMs: timing.durationMs,
    mode: 'drill',
  };
  if (grade.errorType) review.errorType = grade.errorType;
  if (grade.skipped) review.skipped = true;
  return review;
}

export interface DrillChoiceInput extends Timing {
  drill: LookalikeDrill | ClozeDrill;
  /** The kanji chosen (lookalike) or the grammar id chosen (cloze). */
  choice: string;
}

function expectedOf(drill: LookalikeDrill | ClozeDrill, choice: string): [string, string] {
  if (drill.kind === 'lookalike') return [drill.answer, choice];
  const pattern = (id: string) => drill.choices.find((c) => c.grammarId === id)?.pattern ?? id;
  return [pattern(drill.grammarId), pattern(choice)];
}

function choiceGrade(drill: LookalikeDrill | ClozeDrill, input: DrillChoiceInput): Grade {
  const { choice } = input;
  const [expected, given] = expectedOf(drill, choice);
  if (input.skipped) return { verdict: 'wrong', expected, given: '', skipped: true };
  const right = drill.kind === 'lookalike' ? choice === drill.answer : choice === drill.grammarId;
  const grade: Grade = { verdict: right ? 'correct' : 'wrong', expected, given };
  if (!right && drill.kind === 'lookalike') grade.errorType = 'wrong-kanji';
  return grade;
}

/** A cloze answer reviews its grammar item: FSRS Good when right, Again when wrong (K4). */
async function reviewGrammar(repos: Repos, itemId: ItemId, right: boolean, now: number) {
  const item = await repos.items.get(itemId);
  if (!item?.card) return;
  await repos.items.put({
    ...item,
    card: reviewCard(item.card, right ? 3 : 1, now),
    updatedAt: now,
  });
}

/**
 * Grades and logs a lookalike or cloze choice. A wrong kanji is `wrong-kanji`, stored with the
 * kanji meant as `expected` and the one chosen as `answer` (待, 持), so Today and later drills
 * see the swap. A wrong pattern has no error type: it is not a reading slip. A cloze answer also
 * reschedules the grammar item's FSRS card, so due grammar points come back through cloze.
 */
export async function recordDrillChoice(repos: Repos, input: DrillChoiceInput): Promise<Grade> {
  const { drill } = input;
  const grade = choiceGrade(drill, input);
  const review = reviewOf(drill.itemId, grade, grade.given, input);
  review.sentenceId = drill.sentence.id;
  await repos.reviews.add(review);
  const right = grade.verdict === 'correct';
  if (drill.kind === 'cloze') await reviewGrammar(repos, drill.itemId, right, input.now);
  return grade;
}

/**
 * Grades one word of a "many readings" drill (R5 rules) and applies it like a session answer:
 * level, FSRS card and derived kanji readings, never as a new context.
 */
export async function recordDrillReading(
  repos: Repos,
  input: Timing & { item: ReadingItem; answer: string },
): Promise<Grade> {
  const { readings } = input.item;
  const result = input.skipped ? skipGrade(readings) : gradeReading(readings, input.answer);
  await saveGradedReading(repos, {
    wordId: input.item.wordId,
    result,
    answer: input.answer,
    mode: 'drill',
    durationMs: input.durationMs,
    now: input.now,
  });
  return result;
}

/** Grades the on'yomi guessed for a family member and logs it against that kanji reading. */
export async function recordFamilyGuess(
  repos: Repos,
  input: Timing & { drill: FamilyDrill; answer: string },
): Promise<Grade> {
  const { accepted } = input.drill;
  const grade = input.skipped ? skipGrade(accepted) : gradeReading(accepted, input.answer);
  await repos.reviews.add(reviewOf(input.drill.itemId, grade, input.answer, input));
  return grade;
}

/** The S4 exercise kinds, recorded by `recordExercise`. */
const EXERCISE_KINDS: ReadonlySet<Drill['kind']> = new Set([
  'meaning',
  'particle',
  'pattern',
  'conjugation',
  'build',
  'listening',
]);

/** Whether a drill is one of the S4 exercise types. */
export const isExercise = (drill: Drill): drill is ExerciseDrill => EXERCISE_KINDS.has(drill.kind);

/** The sentence an exercise was built on, for the review log. */
function sentenceOf(drill: ExerciseDrill): string | undefined {
  return 'sentence' in drill ? drill.sentence.id : undefined;
}

/**
 * Grades and logs an S4 exercise (meaning, particle, pattern, conjugation, building, listening)
 * against its item, when it has one. A pattern drill is its grammar point's review, as a cloze
 * is: it reschedules the point's FSRS card. The others are only logged, so the unit counts and
 * Today's notes see them; a word's level moves only with its reading.
 */
export async function recordExercise(
  repos: Repos,
  input: Timing & { drill: ExerciseDrill; answer: string },
): Promise<Grade> {
  const { drill } = input;
  const grade = gradeExercise(drill, input.answer, input.skipped === true);
  if (!drill.itemId) return grade;
  const review = reviewOf(drill.itemId, grade, grade.given, input);
  const sentenceId = sentenceOf(drill);
  if (sentenceId) review.sentenceId = sentenceId;
  await repos.reviews.add(review);
  if (drill.kind === 'pattern') {
    await reviewGrammar(repos, drill.itemId, grade.verdict === 'correct', input.now);
  }
  return grade;
}

/** One answer to a drill card: the choice made, or the reading typed for `step`. */
export interface DrillAnswerInput extends Timing {
  drill: Drill;
  /** Word index in a "many readings" drill; 0 otherwise. */
  step: number;
  /** The kanji or grammar id chosen, or the kana typed. */
  answer: string;
}

/** Records any drill answer with the right rule for its kind (see the functions above). */
export async function recordDrillAnswer(repos: Repos, input: DrillAnswerInput): Promise<Grade> {
  const { drill, answer } = input;
  const timing = { durationMs: input.durationMs, now: input.now, skipped: input.skipped };
  if (isExercise(drill)) return recordExercise(repos, { drill, answer, ...timing });
  if (drill.kind === 'lookalike' || drill.kind === 'cloze') {
    return recordDrillChoice(repos, { drill, choice: answer, ...timing });
  }
  if (drill.kind === 'family') return recordFamilyGuess(repos, { drill, answer, ...timing });
  const item = drill.items[input.step];
  if (!item) throw new Error(`No word ${input.step} in this drill.`);
  return recordDrillReading(repos, { item, answer, ...timing });
}
