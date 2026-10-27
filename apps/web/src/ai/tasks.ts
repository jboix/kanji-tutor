/**
 * The typed AI tasks (SPEC "AI layer"): prompt + schema + verification, run by `runTask`. Teacher
 * tasks run on the teacher model with the learner tools (A10, A12); the rest on the fast model.
 */
import type { z } from 'zod';
import { analysePagePrompt } from './prompts/analyse-page.ts';
import { answerQuestionPrompt } from './prompts/answer-question.ts';
import { assessLevelPrompt } from './prompts/assess-level.ts';
import { breakdownSentencePrompt } from './prompts/breakdown-sentence.ts';
import { correctSentencePrompt } from './prompts/correct-sentence.ts';
import { describeKanjiPrompt } from './prompts/describe-kanji.ts';
import { explainMistakePrompt, isNamedSlip } from './prompts/explain-mistake.ts';
import { explainSentencePrompt } from './prompts/explain-sentence.ts';
import { explainWordPrompt } from './prompts/explain-word.ts';
import { followUpPrompt } from './prompts/follow-up.ts';
import { generateSentencesPrompt } from './prompts/generate-sentences.ts';
import { kanjiStoryPrompt } from './prompts/kanji-story.ts';
import { memoryHookPrompt } from './prompts/memory-hook.ts';
import { paraphraseQuestionPrompt } from './prompts/paraphrase-question.ts';
import { readSignPrompt } from './prompts/read-sign.ts';
import { recognizeHandwritingPrompt } from './prompts/recognize-handwriting.ts';
import { transcribeReadingPrompt } from './prompts/transcribe-reading.ts';
import { weeklyNotesPrompt } from './prompts/weekly-notes.ts';
import { peekTask, runTask } from './run.ts';
import { finalizePageAnalysis, pageAnalysisSchema } from './schemas/analyse-page.ts';
import { answerSchema, finalizeAnswer } from './schemas/answer-question.ts';
import { assessLevelSchema, finalizeAssessment } from './schemas/assess-level.ts';
import { breakdownSchema, finalizeBreakdown } from './schemas/breakdown-sentence.ts';
import { correctionSchema, finalizeCorrection } from './schemas/correct-sentence.ts';
import { finalizeKanjiCandidates, kanjiCandidatesSchema } from './schemas/describe-kanji.ts';
import { explainMistakeSchema, finalizeMistake } from './schemas/explain-mistake.ts';
import { explainSentenceSchema, finalizeSentenceExplanation } from './schemas/explain-sentence.ts';
import { explainWordSchema, finalizeWord } from './schemas/explain-word.ts';
import { finalizeFollowUp, followUpSchema } from './schemas/follow-up.ts';
import { finalizeSentences, generatedSentencesSchema } from './schemas/generate-sentences.ts';
import { finalizeKanjiStory, kanjiStorySchema } from './schemas/kanji-story.ts';
import { finalizeMemoryHook, memoryHookSchema } from './schemas/memory-hook.ts';
import { finalizeParaphrase, paraphraseSchema } from './schemas/paraphrase-question.ts';
import { finalizeSignReading, readSignSchema } from './schemas/read-sign.ts';
import { finalizeHandwriting, handwritingSchema } from './schemas/recognize-handwriting.ts';
import { finalizeTranscription, transcriptionSchema } from './schemas/transcribe-reading.ts';
import { finalizeWeeklyNotes, weeklyNotesSchema } from './schemas/weekly-notes.ts';
import type { TaskDef } from './task-def.ts';
import type {
  BreakdownInput,
  ExplainMistakeInput,
  ExplainWordInput,
  Peek,
  PeekableTask,
  Task,
  TaskName,
} from './types.ts';

/** A task, plus `peek` for its cached answer only (A15). */
function task<T extends TaskName, S extends z.ZodType>(def: TaskDef<T, S>): PeekableTask<T> {
  const run: Task<T> = (input, context) => runTask(def, input, context);
  const peek: Peek<T> = (input, context) => peekTask(def, input, context);
  return Object.assign(run, { peek });
}

/**
 * Cache keys on the smallest deciding input (A15). A mistake: the word, the expected reading,
 * the error type and the confused kanji; the raw answer and the sentence only for `other`.
 */
export function mistakeKey(input: ExplainMistakeInput) {
  const { target, errorType, confused } = input;
  const base = { surface: target.surface, expected: target.expected, errorType, confused };
  return isNamedSlip(input) ? base : { ...base, answer: input.answer, sentence: input.sentence };
}

/** A word: its JMdict id, else its written form; never the sentence it was tapped in. */
export function wordKey(input: ExplainWordInput) {
  return input.wordId ? { wordId: input.wordId } : { form: input.word?.form ?? input.surface };
}

/** A breakdown: the sentence alone, whichever word was tapped. */
export function breakdownKey(input: BreakdownInput) {
  return { sentence: input.sentence.text, translation: input.sentence.translation };
}

/** A1: explain a wrong reading. */
export const explainMistake = task({
  name: 'explainMistake',
  tier: 'teacher',
  immersive: true,
  cacheInput: mistakeKey,
  prose: (raw) => [raw.explanation, raw.hook ?? '', raw.confusedWith?.meaning ?? ''],
  prompt: explainMistakePrompt,
  schema: explainMistakeSchema,
  finalize: finalizeMistake,
});

/** A2: tap a word. */
export const explainWord = task({
  name: 'explainWord',
  tier: 'teacher',
  immersive: true,
  cacheInput: wordKey,
  prose: (raw) => [raw.meaning, raw.nuance, raw.hook ?? '', raw.contrast?.meaning ?? ''],
  prompt: explainWordPrompt,
  schema: explainWordSchema,
  finalize: finalizeWord,
});

/** A2: chunk-by-chunk sentence breakdown. */
export const breakdownSentence = task({
  name: 'breakdownSentence',
  tier: 'fast',
  cacheInput: breakdownKey,
  prose: (raw) => [raw.translation, ...raw.chunks.map((chunk) => chunk.gloss)],
  prompt: breakdownSentencePrompt,
  schema: breakdownSchema,
  finalize: finalizeBreakdown,
});

/** A4: scoped free question. */
export const answerQuestion = task({
  name: 'answerQuestion',
  tier: 'teacher',
  immersive: true,
  prose: (raw) => [raw.answer],
  prompt: answerQuestionPrompt,
  schema: answerSchema,
  finalize: finalizeAnswer,
});

/** A3: follow-up chips. */
export const followUp = task({
  name: 'followUp',
  tier: 'teacher',
  immersive: true,
  prose: (raw) => [raw.text, raw.example?.translation ?? ''],
  prompt: followUpPrompt,
  schema: followUpSchema,
  finalize: finalizeFollowUp,
});

/** A6: red-pen corrections. */
export const correctSentence = task({
  name: 'correctSentence',
  tier: 'teacher',
  immersive: true,
  prose: (raw) => [raw.works, raw.next, ...raw.marks.map((mark) => mark.note)],
  prompt: correctSentencePrompt,
  schema: correctionSchema,
  finalize: finalizeCorrection,
});

/** Scanned lessons: one photographed page, what it is and what it teaches; readings verified. */
export const analysePage = task({
  name: 'analysePage',
  tier: 'fast',
  prose: (raw) => [
    raw.title,
    ...raw.words.map((word) => word.meaning),
    ...raw.questions.map((question) => question.explanation),
  ],
  prompt: analysePagePrompt,
  schema: pageAnalysisSchema,
  media: (input) => [input.image],
  finalize: finalizePageAnalysis,
});

/** In the wild: a photo of a sign or a menu, kanji by kanji with boxes; readings verified. */
export const readSign = task({
  name: 'readSign',
  tier: 'fast',
  prose: (raw) => [raw.place, ...raw.words.map((word) => word.meaning)],
  prompt: readSignPrompt,
  schema: readSignSchema,
  media: (input) => [input.image],
  finalize: finalizeSignReading,
});

/** I2: spoken reading as hiragana, exactly as pronounced. */
export const transcribeReading = task({
  name: 'transcribeReading',
  tier: 'fast',
  thinking: 'minimal',
  prompt: transcribeReadingPrompt,
  schema: transcriptionSchema,
  media: (input) => [input.audio],
  finalize: finalizeTranscription,
});

/** A7: weekly letter and plan. */
export const weeklyNotes = task({
  name: 'weeklyNotes',
  tier: 'fast',
  prose: (raw) => [...raw.letter, ...raw.plan.map((line) => line.what)],
  prompt: weeklyNotesPrompt,
  schema: weeklyNotesSchema,
  finalize: finalizeWeeklyNotes,
});

/** R6: AI sentences; failed readings drop their sentence. */
export const generateSentences = task({
  name: 'generateSentences',
  tier: 'fast',
  prose: (raw) => raw.sentences.map((sentence) => sentence.translation),
  prompt: generateSentencesPrompt,
  schema: generatedSentencesSchema,
  finalize: finalizeSentences,
});

/** I5: kanji from a description. */
export const describeKanji = task({
  name: 'describeKanji',
  tier: 'fast',
  prose: (raw) => raw.candidates.map((candidate) => candidate.reason),
  prompt: describeKanjiPrompt,
  schema: kanjiCandidatesSchema,
  finalize: finalizeKanjiCandidates,
});

/** I4: handwriting fallback. */
export const recognizeHandwriting = task({
  name: 'recognizeHandwriting',
  tier: 'fast',
  thinking: 'minimal',
  prompt: recognizeHandwritingPrompt,
  schema: handwritingSchema,
  media: (input) => [input.image],
  finalize: finalizeHandwriting,
});

/** L3: the meaning and grammar of a sentence before answering, hidden readings redacted. */
export const explainSentence = task({
  name: 'explainSentence',
  tier: 'teacher',
  immersive: true,
  hidden: (input) => input.hidden,
  prose: (raw) => [raw.meaning, ...raw.grammar.map((g) => g.note)],
  prompt: explainSentencePrompt,
  schema: explainSentenceSchema,
  finalize: finalizeSentenceExplanation,
});

/** L1, A5: a memory hook for a new word, from what the learner knows. */
export const memoryHook = task({
  name: 'memoryHook',
  tier: 'teacher',
  immersive: true,
  prose: (raw) => [raw.hook],
  prompt: memoryHookPrompt,
  schema: memoryHookSchema,
  finalize: finalizeMemoryHook,
});

/** A kanji's story from the tutor, from its parts, with a short story in known kanji. */
export const kanjiStory = task({
  name: 'kanjiStory',
  tier: 'teacher',
  prose: (raw) => [raw.line, raw.story.translation],
  prompt: kanjiStoryPrompt,
  schema: kanjiStorySchema,
  finalize: finalizeKanjiStory,
});

/** J6: a 言い換え類義 question; offer it only with a key, and only when `verified`. */
export const paraphraseQuestion = task({
  name: 'paraphraseQuestion',
  tier: 'teacher',
  prose: (raw) => raw.options.map((option) => option.why),
  prompt: paraphraseQuestionPrompt,
  schema: paraphraseSchema,
  finalize: finalizeParaphrase,
});

/** A11: a level and notes from the placement answers, with the tools; not immersive. */
export const assessLevel = task({
  name: 'assessLevel',
  tier: 'teacher',
  prose: (raw) => [raw.notes, ...raw.strengths, ...raw.gaps],
  prompt: assessLevelPrompt,
  schema: assessLevelSchema,
  finalize: finalizeAssessment,
});
