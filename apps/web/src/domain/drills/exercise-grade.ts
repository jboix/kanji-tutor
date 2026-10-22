/**
 * Grading the S4 exercises, pure: a choice (meaning, particle, listening), the pieces in an
 * order (building), or a typed form checked against the conjugation engine's answers (pattern,
 * conjugation). A form is right or wrong: a missing っ in 行って is the conjugation, not a slip.
 */
import { toKanaFold } from '../kana.ts';
import type { Grade } from '../types.ts';
import type { ExerciseDrill } from './types.ts';

/** What the learner gave: the index chosen, the particle, the built text or the typed form. */
export type ExerciseAnswer = string;

/** The text an option index stands for, for the review log. */
function optionText(drill: ExerciseDrill, index: number): string {
  if (drill.kind === 'meaning') {
    const option = drill.options[index];
    return (drill.reverse ? option?.written : option?.glosses[0]) ?? '';
  }
  if (drill.kind === 'listening') return drill.options[index]?.translation ?? '';
  return '';
}

/** The right answer as shown after answering. */
export function expectedOf(drill: ExerciseDrill): string {
  if (drill.kind === 'meaning' || drill.kind === 'listening')
    return optionText(drill, drill.answer);
  if (drill.kind === 'particle') return drill.answer;
  if (drill.kind === 'build') return drill.pieces.join('');
  return drill.answer.written;
}

const clean = (text: string) => text.replace(/[\s。．.、,？?！!]/gu, '');

/** Whether a typed form is one of the accepted answers, in kana, romaji or as written. */
export function formMatches(accepted: readonly string[], typed: string): boolean {
  const given = clean(typed);
  if (given === '') return false;
  const kana = toKanaFold(given);
  return accepted.some((a) => clean(a) === given || toKanaFold(clean(a)) === kana);
}

function given(drill: ExerciseDrill, answer: ExerciseAnswer): string {
  if (drill.kind === 'meaning' || drill.kind === 'listening') {
    return optionText(drill, Number(answer));
  }
  return answer;
}

function right(drill: ExerciseDrill, answer: ExerciseAnswer): boolean {
  if (drill.kind === 'meaning' || drill.kind === 'listening')
    return Number(answer) === drill.answer;
  if (drill.kind === 'particle') return answer === drill.answer;
  if (drill.kind === 'build') return clean(answer) === clean(drill.pieces.join(''));
  return formMatches(drill.accepted, answer);
}

/** The grade of an answer to an S4 exercise, or of "I don't know" when `skipped`. */
export function gradeExercise(
  drill: ExerciseDrill,
  answer: ExerciseAnswer,
  skipped = false,
): Grade {
  const expected = expectedOf(drill);
  if (skipped) return { verdict: 'wrong', expected, given: '', skipped: true };
  const ok = right(drill, answer);
  return { verdict: ok ? 'correct' : 'wrong', expected, given: given(drill, answer) };
}
