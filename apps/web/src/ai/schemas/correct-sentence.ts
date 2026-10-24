import { z } from 'zod';
import { anchorMarks } from '../anchor-marks.ts';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { Correction, CorrectionMark, CorrectSentenceInput, Verdict } from '../types.ts';
import { readingClaims } from './shared.ts';

const mark = z.object({
  kind: z.enum(['insert', 'replace', 'delete']),
  severity: z
    .enum(['error', 'style'])
    .describe('error: wrong; style: correct but could be better.'),
  before: z
    .string()
    .describe('Up to three characters of the sentence just before the mark; empty at its start.'),
  original: z
    .string()
    .describe('The exact text of the sentence the mark covers; empty for an insertion.'),
  start: z.int().min(0).describe('UTF-16 index into the learner sentence where the mark starts.'),
  end: z.int().min(0).describe('UTF-16 index where it ends; equal to start for an insertion.'),
  text: z.string().describe('Inserted or replacement text; empty for a deletion.'),
  title: z.string().describe('A short heading, e.g. "Needed: な."'),
  note: z.string().describe('One or two sentences on why.'),
});

/** Raw `correctSentence` reply (A6). */
export const correctionSchema = z.object({
  corrected: z.string().describe('The corrected sentence.'),
  marks: z.array(mark),
  verdict: z
    .enum(['natural', 'needs-work', 'not-yet'])
    .describe(
      'natural: nothing wrong, style notes at most; needs-work: errors a small fix mends; not-yet: it does not say what was meant or misses the grammar point.',
    ),
  works: z.string().describe('What the sentence gets right, in one or two sentences.'),
  next: z
    .string()
    .describe('One concrete thing to try next with this grammar point; empty when there is none.'),
  usesTarget: z.boolean().describe('Whether the sentence uses the target grammar point.'),
  readings: readingClaims,
});

/** A sentence with an error, or without the grammar point, is never called natural. */
function verdictOf(said: Verdict, marks: readonly CorrectionMark[], usesTarget: boolean): Verdict {
  const wrong = marks.some((mark) => mark.severity === 'error') || !usesTarget;
  return said === 'natural' && wrong ? 'needs-work' : said;
}

/**
 * Places each mark by the text it quotes (offsets only pick between repeats), drops marks whose
 * quote is not in the learner's sentence, and verifies readings.
 */
export async function finalizeCorrection(
  raw: z.output<typeof correctionSchema>,
  input: CorrectSentenceInput,
  lang: Verifier,
): Promise<Correction> {
  const marks = anchorMarks(input.sentence, raw.marks);
  const shown = { ...raw, marks, verdict: verdictOf(raw.verdict, marks, raw.usesTarget) };
  return { ...shown, readings: await checkWithProse(lang, raw.readings, shown) };
}
