/**
 * 読解 (T6): adapts a unit passage and its questions (written with the passage by the themes
 * pipeline) to the question shape. Unsound questions are dropped, never shown.
 */
import type { ItemId } from '../types.ts';
import { OPTION_COUNT, optionKey } from './options.ts';
import {
  type ComprehensionQuestion,
  type ComprehensionSet,
  type ComprehensionType,
  note,
  type PassageLine,
  SECTION,
} from './types.ts';

/** One authored question on a passage, as the themes pipeline writes it. */
export interface PassageQuestionData {
  kind: ComprehensionType;
  prompt: string;
  options: readonly string[];
  /** The right option: its index, or its text. */
  answer: number | string;
  /** Index of the sentence that proves the answer. */
  evidence: number;
  explanation: string;
}

/** A unit passage with its questions. */
export interface PassageData {
  id: string;
  sentences: readonly PassageLine[];
  questions: readonly PassageQuestionData[];
  /** The item the passage reviews, when it has one (a unit's grammar or word). */
  itemId?: ItemId;
}

function answerIndex(data: PassageQuestionData): number {
  return typeof data.answer === 'number' ? data.answer : data.options.indexOf(data.answer);
}

/** Four distinct options, a right one among them and a line of the passage as evidence. */
function sound(data: PassageQuestionData, lines: number): boolean {
  const answer = answerIndex(data);
  const keys = new Set(data.options.map(optionKey));
  return (
    data.options.length === OPTION_COUNT &&
    keys.size === OPTION_COUNT &&
    !keys.has('') &&
    answer >= 0 &&
    answer < OPTION_COUNT &&
    Number.isInteger(data.evidence) &&
    data.evidence >= 0 &&
    data.evidence < lines
  );
}

function questionOf(passage: PassageData, data: PassageQuestionData, i: number) {
  const answer = answerIndex(data);
  const line = data.evidence + 1;
  const question: ComprehensionQuestion = {
    id: `q:comprehension:${passage.id}:${i}`,
    kind: 'comprehension',
    section: SECTION.comprehension,
    type: data.kind,
    question: data.prompt,
    evidence: data.evidence,
    options: data.options.map((text, j) => ({
      text,
      note: j === answer ? data.explanation : note('line-not', { line }),
    })),
    answer,
  };
  if (passage.itemId) question.itemId = passage.itemId;
  return question;
}

/**
 * The passage as a comprehension set: its sound questions in the authored order (at most
 * four), or undefined when fewer than one survives or the passage is empty.
 */
export function comprehensionSet(passage: PassageData): ComprehensionSet | undefined {
  const lines = passage.sentences.length;
  const questions = passage.questions
    .map((data, i) => (sound(data, lines) ? questionOf(passage, data, i) : undefined))
    .filter((q) => q !== undefined)
    .slice(0, OPTION_COUNT);
  if (lines === 0 || questions.length === 0) return undefined;
  return { id: passage.id, sentences: [...passage.sentences], questions };
}
