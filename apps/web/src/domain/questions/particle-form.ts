/**
 * 文法形式の判断 (J4) for N5: the catalogue rarely has three other N5 forms that fill the same
 * slot, so an N5 learner is asked the case particle between a noun and its verb or
 * adjective, as the JLPT N5 paper does (ドア（を）閉めます). The distractors must clearly not fit,
 * so they are の, や and か, which join a noun to a noun (or end a question) and never stand
 * before a verb. Another case particle would often fit too (右に / 右を曲がる, 牛乳で / 牛乳と作る),
 * so none is offered, and は and も, which replace almost any of them, are never asked. After a
 * question word (何か, 誰か) か fits, so those are skipped. Pure.
 */
import { particleDrill } from '../drills/particle.ts';
import { FUNCTION_WORDS } from '../grammar/function-words.ts';
import type { FunctionWord } from '../grammar/types.ts';
import type { Sentence } from '../types.ts';
import { arrange, meaningFields } from './options.ts';
import { questionId, stemOf } from './stem.ts';
import { type ChoiceQuestion, note, type QuestionOption, SECTION } from './types.ts';

export interface ParticleFormInput {
  sentence: Sentence;
  seed: string;
}

/** The case particles asked. */
const CASE = new Set(['を', 'が', 'に', 'で', 'へ', 'と', 'から', 'まで']);
/** Never right before a verb or adjective. */
const MISFITS = ['の', 'や', 'か'];
const PREDICATES = new Set(['verb', 'adjective']);
const NOUNS = new Set(['noun', 'pronoun']);
const QUESTION_WORDS = new Set([
  '何',
  'なに',
  'なん',
  '誰',
  'だれ',
  'どこ',
  'いつ',
  'どれ',
  'どちら',
]);

/** The N5 entry of a particle as written (に → particle-ni, its first sense). */
const entryOf = (particle: string): FunctionWord | undefined =>
  FUNCTION_WORDS.find((w) => w.level === 5 && w.pattern.split(' ')[0] === particle);

function explain(particle: string) {
  const entry = entryOf(particle);
  return {
    pattern: particle,
    meaning: entry?.meaning ?? particle,
    formation: entry?.uses[0]?.use.toLowerCase() ?? 'a particle',
  };
}

/** The particle question on `sentence`, or undefined when no particle gives a clear one. */
export function particleFormQuestion(input: ParticleFormInput): ChoiceQuestion | undefined {
  const { sentence } = input;
  const drill = particleDrill({ sentences: [sentence], level: 5, seed: input.seed });
  const verb = drill && sentence.tokens[drill.tokenIndex + 1];
  const noun = drill && sentence.tokens[drill.tokenIndex - 1];
  if (!(drill && verb && noun && CASE.has(drill.answer))) return undefined;
  if (!PREDICATES.has(verb.pos) || !NOUNS.has(noun.pos) || QUESTION_WORDS.has(noun.surface)) {
    return undefined;
  }
  const from = drill.at;
  const to = from + drill.answer.length;
  const wrong = MISFITS;
  const right = { text: drill.answer, note: note('form-fits', explain(drill.answer)) };
  const others: QuestionOption[] = wrong.map((p) => ({
    text: p,
    note: note('form-misfits', explain(p)),
  }));
  const arranged = arrange(right, others, input.seed);
  if (!arranged) return undefined;
  return {
    id: questionId('grammar-form', sentence.id, drill.itemId),
    kind: 'grammar-form',
    section: SECTION['grammar-form'],
    stem: stemOf(sentence, from, to, 'blank'),
    ...arranged,
    itemId: drill.itemId,
    sentenceId: sentence.id,
    ...meaningFields(sentence.translation, [entryOf(drill.answer)?.meaning ?? '']),
  };
}
