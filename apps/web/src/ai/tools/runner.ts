/**
 * The tutor's local tools (A10): Gemini function declarations and their handlers over a
 * `LearnerView`. Handlers only read the learner's progress; none writes or reaches the network.
 */
import { z } from 'zod';
import type { LearnerView } from '../../domain/learner-view.ts';
import { toProviderSchema } from '../json-schema.ts';
import type { ToolCall, ToolDeclaration, ToolResult, ToolRunner } from '../types.ts';

const texts = z.array(z.string());

interface Tool<S extends z.ZodType> {
  description: string;
  args: S;
  run: (view: LearnerView, args: z.output<S>) => Promise<unknown>;
}

const tool = <S extends z.ZodType>(definition: Tool<S>) => definition as Tool<z.ZodType>;

/** Every tool by its function name. */
export const TOOLS: Readonly<Record<string, Tool<z.ZodType>>> = {
  get_learner_profile: tool({
    description:
      "The learner's JLPT level, words, kanji and grammar known per level (known of total), " +
      'the current lesson or unit, the explanation language and the last mistakes with their ' +
      'error types. Call it before explaining.',
    args: z.object({}),
    run: (view) => view.getLearnerProfile({ withUnit: true }),
  }),
  check_known: tool({
    description:
      'Whether each word, kanji and grammar pattern is known, being learned or unseen, with its ' +
      'JLPT level. Use it on the words you plan to explain with.',
    args: z.object({
      words: texts.exactOptional().describe('Words as written, e.g. 待つ.'),
      kanji: texts.exactOptional().describe('Single kanji, e.g. 待.'),
      grammar: texts.exactOptional().describe('Grammar patterns or ids, e.g. 〜ながら.'),
    }),
    run: (view, args) => view.checkKnown(args),
  }),
  lookup_word: tool({
    description:
      'Dictionary entries for a word: readings, meanings, JLPT level and whether the learner ' +
      'knows it. Check a meaning or reading here before you state it. The usual reading comes ' +
      'first (preferredReading): teach that one; lessCommon readings are only "also possible".',
    args: z.object({ text: z.string().min(1).describe('The word as written, e.g. 待つ.') }),
    run: (view, args) => view.lookupWord(args.text),
  }),
  known_examples: tool({
    description:
      'Up to five words the learner knows that contain a kanji, or verified sentences that use ' +
      'a word or grammar pattern, easiest first. Use them for examples and memory hooks.',
    args: z.object({ query: z.string().min(1).describe('A kanji, a word or a grammar pattern.') }),
    run: (view, args) => view.knownExamples(args.query),
  }),
};

/** The declarations sent with teacher-tier requests. */
export const TOOL_DECLARATIONS: readonly ToolDeclaration[] = Object.entries(TOOLS).map(
  ([name, { description, args }]) => ({ name, description, parameters: toProviderSchema(args) }),
);

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'The tool failed.';
}

async function execute(view: LearnerView, call: ToolCall): Promise<ToolResult> {
  const base = { ...(call.id === undefined ? {} : { id: call.id }), name: call.name };
  const definition = TOOLS[call.name];
  if (!definition) return { ...base, response: { error: `Unknown tool ${call.name}.` } };
  const args = definition.args.safeParse(call.args ?? {});
  if (!args.success) return { ...base, response: { error: `Bad arguments for ${call.name}.` } };
  try {
    return { ...base, response: { output: await definition.run(view, args.data) } };
  } catch (error) {
    return { ...base, response: { error: messageOf(error) } };
  }
}

/** Tools bound to one learner. `execute` never throws: failures come back as `{ error }`. */
export function createToolRunner(view: LearnerView): ToolRunner {
  return { declarations: TOOL_DECLARATIONS, execute: (call) => execute(view, call) };
}
