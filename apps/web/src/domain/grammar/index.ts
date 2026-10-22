/** Grammar catalogue (G1): typed entries and their token detectors. */
export { GRAMMAR_CATALOGUE } from './catalogue.ts';
export { detectEntries, detectEntry, findSpan, toGrammarPoint } from './detect.ts';
export type { Matcher, TokenSpec } from './dsl.ts';
export {
  FUNCTION_WORDS,
  type FunctionWordNotes,
  functionWordNotes,
  matchesAt,
} from './function-words.ts';
export { sentenceGrammar } from './sentence.ts';
export type * from './types.ts';
