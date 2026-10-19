/**
 * Particle fill (S4): a sentence with one particle blanked, and the particle among three others
 * of the learner's level. Particles that could also fit the blank (は and が, に and へ) are
 * never offered against each other, and particles in a compound (では, には) are not blanked.
 * Pure.
 */
import { FUNCTION_WORDS, matchesAt } from '../grammar/function-words.ts';
import { itemId } from '../ids.ts';
import type { LearnerLevel, Sentence, Token } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { ParticleDrill } from './types.ts';

/** The particles a blank can hold, all N5. */
export const BLANK_PARTICLES: readonly string[] = [
  'が',
  'を',
  'に',
  'で',
  'へ',
  'と',
  'から',
  'まで',
  'は',
  'も',
  'の',
  'や',
];

/** Particles that can stand in for the answer in many sentences: never its distractors. */
const COULD_FIT: Readonly<Record<string, readonly string[]>> = {
  は: ['が', 'も'],
  が: ['は', 'も', 'を'],
  も: ['は', 'が'],
  を: ['が'],
  に: ['へ', 'で', 'と'],
  へ: ['に'],
  で: ['に'],
  と: ['や', 'に'],
  や: ['と'],
};

const CHOICES = 4;

export interface ParticleInput {
  sentences: readonly Sentence[];
  level: LearnerLevel;
  seed: string;
  /** Blank only this function word (`particle-ni`), for its grammar page (S5). */
  only?: string;
}

const isParticle = (token: Token | undefined) => token?.pos === 'particle';

/**
 * A lone particle of the blank set: not first, not part of a compound (では), and not at the end
 * of the sentence, where の and か end it rather than link two words.
 */
function blankable(tokens: readonly Token[], i: number): boolean {
  const token = tokens[i];
  const next = tokens[i + 1];
  if (!token || !next || i === 0 || !BLANK_PARTICLES.includes(token.surface)) return false;
  if (next.pos === 'symbol') return false;
  return isParticle(token) && !isParticle(tokens[i - 1]) && !isParticle(next);
}

/** The function word a particle token is, at or below the level. */
function functionWord(tokens: readonly Token[], i: number, level: LearnerLevel) {
  return FUNCTION_WORDS.find((w) => w.level >= level && matchesAt(w, tokens, i));
}

function choicesFor(answer: string, seed: string): string[] {
  const keep = new Set([answer, ...(COULD_FIT[answer] ?? [])]);
  const others = seededOrder(
    BLANK_PARTICLES.filter((p) => !keep.has(p)),
    (p) => p,
    seed,
  );
  return seededOrder([answer, ...others.slice(0, CHOICES - 1)], (p) => p, `${seed}|${answer}`);
}

function drillIn(sentence: Sentence, input: ParticleInput): ParticleDrill | undefined {
  const { tokens } = sentence;
  const spots = tokens.flatMap((_, i) => (blankable(tokens, i) ? [i] : []));
  for (const i of seededOrder(spots, String, `${input.seed}|${sentence.id}`)) {
    const word = functionWord(tokens, i, input.level);
    const token = tokens[i];
    if (!word || !token || (input.only && word.id !== input.only)) continue;
    return {
      kind: 'particle',
      sentence,
      tokenIndex: i,
      at: token.start,
      answer: token.surface,
      choices: choicesFor(token.surface, input.seed),
      itemId: itemId('grammar', word.id),
    };
  }
  return undefined;
}

/** The first sentence, in the order given, with a particle to blank. */
export function particleDrill(input: ParticleInput): ParticleDrill | undefined {
  for (const sentence of input.sentences) {
    const drill = drillIn(sentence, input);
    if (drill) return drill;
  }
  return undefined;
}
