import { z } from 'zod';
import { type HiddenReading, redactAnswer, redactReadings, spoilsReading } from '../no-spoil.ts';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { ExplainSentenceInput, SentenceExplanation } from '../types.ts';
import { readingClaims } from './shared.ts';

/** Raw `explainSentence` reply (L3). */
export const explainSentenceSchema = z.object({
  meaning: z.string().describe('What the sentence says and how it is built, in 2–3 sentences.'),
  grammar: z
    .array(
      z.object({
        pattern: z.string().describe('The grammar pattern as given, e.g. 〜しかない.'),
        note: z.string().describe('One short sentence on how it works here.'),
      }),
    )
    .describe('One note per grammar point listed in the request.'),
  readings: readingClaims,
});

type Raw = z.output<typeof explainSentenceSchema>;

/** What the reply may not give away, and what the learner already sees. */
interface Filter {
  hidden: readonly HiddenReading[];
  /** A blank's hidden answer (A19). */
  answer?: string | undefined;
  /** The sentence as the learner sees it: a blank's masked one. */
  visible: string;
}

/** One prose field with the hidden readings, then a blank's hidden answer, removed. */
function redactProse(text: string, { hidden, answer, visible }: Filter) {
  const readings = redactReadings(text, hidden, visible);
  const written = redactAnswer(readings.text, answer);
  return { text: written.text, leaked: readings.leaked || written.leaked };
}

/** A claim on the blank's answer itself: its written form is the answer. */
const onAnswer = (claim: { surface: string }, answer?: string) =>
  answer !== undefined && redactAnswer(claim.surface, answer).leaked;

/**
 * Blanks every hidden reading in the prose (no-spoil post-filter), and for a blank exercise its
 * hidden answer (A19); notes whether one leaked.
 */
export function redactExplanation(raw: Raw, filter: Filter) {
  const { hidden, answer } = filter;
  const meaning = redactProse(raw.meaning, filter);
  const grammar = raw.grammar.map((g) => ({ ...g, note: redactProse(g.note, filter) }));
  const claims = raw.readings.filter(
    (claim) => !spoilsReading(claim, hidden) && !onAnswer(claim, answer),
  );
  const leaked =
    meaning.leaked || grammar.some((g) => g.note.leaked) || claims.length !== raw.readings.length;
  const clean: Raw = {
    meaning: meaning.text,
    grammar: grammar.map((g) => ({ pattern: g.pattern, note: g.note.text })),
    readings: claims,
  };
  return { clean, leaked };
}

/**
 * Redacts hidden readings first, then verifies the readings left, listed or in the prose (A8).
 * Runs on cache hits too, so a cached reply is filtered for the targets of this call.
 */
export async function finalizeSentenceExplanation(
  raw: Raw,
  input: ExplainSentenceInput,
  lang: Verifier,
): Promise<SentenceExplanation> {
  const { clean, leaked } = redactExplanation(raw, {
    hidden: input.hidden,
    answer: input.blank?.answer,
    visible: input.blank?.shown ?? input.sentence.text,
  });
  const checked = await checkWithProse(lang, clean.readings, clean);
  const readings = checked.filter((claim) => !spoilsReading(claim, input.hidden));
  return { ...clean, readings, redacted: leaked || readings.length !== checked.length };
}
