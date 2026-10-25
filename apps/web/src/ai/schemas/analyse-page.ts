import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { AnalysedQuestion, CheckedReading, PageAnalysis } from '../types.ts';
import { checkReading } from '../verify.ts';
import { readingClaims } from './shared.ts';

/** The page kinds, as `PageKind` in the domain names them. */
const PAGE_KINDS = ['kanji-list', 'word-list', 'grammar', 'reading', 'handout', 'mixed'] as const;
/** The question types, as `QuestionType` in the domain names them. */
const QUESTION_TYPES = [
  'choose-form',
  'particle',
  'reading',
  'write-kanji',
  'reorder',
  'free',
] as const;

const question = z.object({
  number: z.string().exactOptional().describe('The question number as printed, e.g. "4".'),
  type: z
    .enum(QUESTION_TYPES)
    .describe(
      'choose-form: pick or write the right form; particle: fill a particle; reading: write the reading of a word; write-kanji: write a word in kanji; reorder: put pieces in order; free: anything else.',
    ),
  instruction: z.string().exactOptional().describe('The instruction as printed, if any.'),
  stem: z.string().describe('The question exactly as printed, each blank written ＿＿.'),
  target: z
    .string()
    .exactOptional()
    .describe('For reading and write-kanji questions: the word asked about, as printed.'),
  choices: z.array(z.string()).describe('The printed choices in order; empty when none.'),
  answer: z
    .string()
    .describe(
      'Your answer: the text that fills the blank, the reading in hiragana, the word in kanji, or the reordered sentence.',
    ),
  explanation: z.string().describe('One sentence on why, in the explanation language.'),
});

/** Raw `analysePage` reply: what one photographed page is about and what it teaches. */
export const pageAnalysisSchema = z.object({
  kind: z
    .enum(PAGE_KINDS)
    .describe(
      'kanji-list: kanji with readings; word-list: vocabulary; grammar: a grammar explanation with examples; reading: a passage; handout: exercises to answer; mixed: several of these.',
    ),
  title: z
    .string()
    .describe('A short title for what the page teaches, in the explanation language.'),
  lines: z
    .array(
      z.object({
        text: z.string().describe('One printed Japanese line, exactly as printed.'),
        unsure: z.boolean().describe('True when part of the line is hard to make out.'),
      }),
    )
    .describe('Every printed Japanese line, in reading order.'),
  kanji: z
    .array(z.object({ char: z.string(), meaning: z.string() }))
    .describe('Kanji the page teaches or lists, one character each.'),
  words: z
    .array(z.object({ written: z.string(), reading: z.string(), meaning: z.string() }))
    .describe('Words the page teaches or lists, as printed, with the reading in hiragana.'),
  grammar: z
    .array(z.object({ pattern: z.string(), meaning: z.string() }))
    .describe('Grammar patterns the page teaches, as printed, e.g. 〜そうだ.'),
  questions: z.array(question).describe('For an exercise handout: every question, answered.'),
  readings: readingClaims,
});

type Raw = z.output<typeof pageAnalysisSchema>;
type RawQuestion = Raw['questions'][number];

const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** The claim an answer makes when it is a reading (or the kanji of a reading). */
function answerClaim(q: RawQuestion) {
  if (q.target === undefined) return undefined;
  if (q.type === 'reading') return { surface: q.target, reading: q.answer };
  if (q.type === 'write-kanji') return { surface: q.answer, reading: q.target };
  return undefined;
}

async function finalizeQuestion(
  lang: Verifier,
  q: RawQuestion,
  readings: readonly CheckedReading[],
): Promise<AnalysedQuestion> {
  const claim = answerClaim(q);
  const answerVerified = claim ? (await checkReading(lang, claim)).verified : true;
  const own = readings.filter((r) => r.surface !== '' && q.explanation.includes(r.surface));
  return { ...q, answerVerified, readings: own };
}

/**
 * Keeps the Japanese lines and checks every reading (A8): each word's, each reading answer's,
 * and those the explanations give, so an unverified one is marked wherever it shows.
 */
export async function finalizePageAnalysis(
  raw: Raw,
  _input: unknown,
  lang: Verifier,
): Promise<PageAnalysis> {
  const lines = raw.lines
    .map((line) => ({ text: line.text.trim(), unsure: line.unsure }))
    .filter((line) => JAPANESE.test(line.text));
  const words = await Promise.all(
    raw.words.map(async (w) => ({
      written: w.written.trim(),
      meaning: w.meaning,
      reading: await checkReading(lang, { surface: w.written, reading: w.reading }),
    })),
  );
  const readings = await checkWithProse(lang, raw.readings, raw.questions);
  const questions = await Promise.all(
    raw.questions.map((q) => finalizeQuestion(lang, q, readings)),
  );
  return { ...raw, lines, words, questions, readings };
}
