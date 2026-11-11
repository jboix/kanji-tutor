import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { AnalysedQuestion, CheckedReading, PageAnalysis, PageBlock } from '../types.ts';
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

/** The kinds of block a page is made of, as `BlockKind` in the domain names them. */
const BLOCK_KINDS = ['heading', 'instruction', 'exercise', 'unsupported', 'text', 'list'] as const;

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

const block = z.object({
  kind: z
    .enum(BLOCK_KINDS)
    .describe(
      'heading: a title. instruction: lines that only tell the learner what to do in an exercise, e.g. 正しいものを選びなさい. exercise: questions you give in `questions`. unsupported: an exercise that fits none of the question types, because it needs a picture, a table, sound or lines to draw. list: rows of kanji or words. text: anything else, a passage, an explanation, example sentences.',
    ),
  lines: z
    .array(
      z.object({
        text: z.string().describe('One printed line, exactly as printed.'),
        unsure: z.boolean().describe('True when part of the line is hard to make out.'),
      }),
    )
    .describe('The printed lines of the block, in reading order.'),
  questions: z
    .array(question)
    .describe('For an exercise block: each of its questions, answered. Empty for any other kind.'),
  reason: z
    .string()
    .exactOptional()
    .describe(
      'For an unsupported block: one short sentence in the explanation language on why it cannot be asked as a question, with no readings in it.',
    ),
});

/** Raw `analysePage` reply: what one photographed page is about, block by block, and what it teaches. */
export const pageAnalysisSchema = z.object({
  kind: z
    .enum(PAGE_KINDS)
    .describe(
      'kanji-list: kanji with readings; word-list: vocabulary; grammar: a grammar explanation with examples; reading: a passage; handout: exercises to answer; mixed: several of these.',
    ),
  title: z
    .string()
    .describe('A short title for what the page teaches, in the explanation language.'),
  blocks: z
    .array(block)
    .describe('The page from top to bottom as blocks, in reading order; nothing printed left out.'),
  kanji: z
    .array(z.object({ char: z.string(), meaning: z.string() }))
    .describe('Kanji the page teaches or lists, one character each.'),
  words: z
    .array(z.object({ written: z.string(), reading: z.string(), meaning: z.string() }))
    .describe('Words the page teaches or lists, as printed, with the reading in hiragana.'),
  grammar: z
    .array(z.object({ pattern: z.string(), meaning: z.string() }))
    .describe('Grammar patterns the page teaches, as printed, e.g. 〜そうだ.'),
  readings: readingClaims,
});

type Raw = z.output<typeof pageAnalysisSchema>;
type RawBlock = Raw['blocks'][number];
type RawQuestion = RawBlock['questions'][number];

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
  q: RawQuestion & { block: number },
  readings: readonly CheckedReading[],
): Promise<AnalysedQuestion> {
  const claim = answerClaim(q);
  const answerVerified = claim ? (await checkReading(lang, claim)).verified : true;
  const own = readings.filter((r) => r.surface !== '' && q.explanation.includes(r.surface));
  return { ...q, answerVerified, readings: own };
}

/**
 * A block with its lines trimmed: the Japanese ones, or every printed one for an exercise that
 * cannot be imported (its blanks and symbols are what is shown of it).
 */
function tidy(raw: RawBlock): RawBlock {
  const lines = raw.lines
    .map((line) => ({ ...line, text: line.text.trim() }))
    .filter((line) => (raw.kind === 'unsupported' ? line.text !== '' : JAPANESE.test(line.text)));
  return { ...raw, lines };
}

/** What a block really is: an exercise when it has questions, never one without. */
function kindOf(raw: RawBlock): RawBlock['kind'] {
  if (raw.questions.length > 0) return 'exercise';
  return raw.kind === 'exercise' ? 'text' : raw.kind;
}

/** The blocks that hold something, in order, each as what it really is. */
function blocksOf(raw: Raw): RawBlock[] {
  return raw.blocks
    .map(tidy)
    .filter((b) => b.lines.length > 0 || b.questions.length > 0)
    .map((b) => ({ ...b, kind: kindOf(b) }));
}

function pageBlock(raw: RawBlock): PageBlock {
  const reason = raw.reason?.trim();
  return raw.kind === 'unsupported' && reason ? { kind: raw.kind, reason } : { kind: raw.kind };
}

/**
 * Lays the page's blocks out as its lines and questions, each knowing its block, and checks
 * every reading (A8): each word's, each reading answer's, and those the explanations give, so an
 * unverified one is marked wherever it shows.
 */
export async function finalizePageAnalysis(
  raw: Raw,
  _input: unknown,
  lang: Verifier,
): Promise<PageAnalysis> {
  const blocks = blocksOf(raw);
  const lines = blocks.flatMap((b, block) =>
    b.lines.map((line) => ({
      ...line,
      role: b.kind === 'instruction' ? ('instruction' as const) : ('content' as const),
      block,
    })),
  );
  const asked = blocks.flatMap((b, block) => b.questions.map((q) => ({ ...q, block })));
  const words = await Promise.all(
    raw.words.map(async (w) => ({
      written: w.written.trim(),
      meaning: w.meaning,
      reading: await checkReading(lang, { surface: w.written, reading: w.reading }),
    })),
  );
  const readings = await checkWithProse(lang, raw.readings, asked);
  const questions = await Promise.all(asked.map((q) => finalizeQuestion(lang, q, readings)));
  const { blocks: _blocks, ...rest } = raw;
  return { ...rest, blocks: blocks.map(pageBlock), lines, words, questions, readings };
}
