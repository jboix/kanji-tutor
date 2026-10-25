/** Recorded responses for every task, replayed by the mock provider (tests and e2e only). */
import type { TaskName, ToolCall } from '../types.ts';
import analysePage from './analyse-page.json' with { type: 'json' };
import answerQuestion from './answer-question.json' with { type: 'json' };
import assessLevel from './assess-level.json' with { type: 'json' };
import breakdownSentence from './breakdown-sentence.json' with { type: 'json' };
import correctSentence from './correct-sentence.json' with { type: 'json' };
import describeKanji from './describe-kanji.json' with { type: 'json' };
import explainMistake from './explain-mistake.json' with { type: 'json' };
import explainSentence from './explain-sentence.json' with { type: 'json' };
import explainWord from './explain-word.json' with { type: 'json' };
import followUp from './follow-up.json' with { type: 'json' };
import generateSentences from './generate-sentences.json' with { type: 'json' };
import memoryHook from './memory-hook.json' with { type: 'json' };
import paraphraseQuestion from './paraphrase-question.json' with { type: 'json' };
import recognizeHandwriting from './recognize-handwriting.json' with { type: 'json' };
import transcribeReading from './transcribe-reading.json' with { type: 'json' };
import weeklyNotes from './weekly-notes.json' with { type: 'json' };

/** One recorded reply. Without `match` it is the task's default. */
export interface Fixture {
  /** Chosen when the request prompt contains this text (earliest occurrence wins). */
  match?: string;
  inputTokens: number;
  outputTokens: number;
  /**
   * Tool rounds the mock "makes" before answering, when the request carries tools (A10). The
   * loop runs the real handlers on them; tokens are counted on the final answer only.
   */
  toolCalls?: ToolCall[][];
  response: unknown;
}

/** Fixtures per task. */
export const FIXTURES: Readonly<Record<TaskName, { fixtures: readonly Fixture[] }>> = {
  explainMistake,
  explainWord,
  breakdownSentence,
  answerQuestion,
  followUp,
  correctSentence,
  analysePage,
  transcribeReading,
  weeklyNotes,
  generateSentences,
  describeKanji,
  recognizeHandwriting,
  explainSentence,
  memoryHook,
  paraphraseQuestion,
  assessLevel,
};
