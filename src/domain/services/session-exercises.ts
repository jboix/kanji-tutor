/**
 * The S4 exercises of a daily session (S7): every session mixes exercise types, even a
 * beginner's whose sentences give few questions. A meaning check on a word just met, a particle
 * fill, a sentence to build or one to hear on a sentence just read, a pattern drill on a point
 * already introduced, and a conjugation drill on a verb the learner knows, in an order that
 * changes from day to day. Each one on the session's own sentences comes after the card that
 * reads them, so nothing is shown before it is taught.
 */

import { patternRule } from '../conjugation/patterns.ts';
import type { ExerciseDrill } from '../drills/index.ts';
import { seededOrder } from '../drills/seed.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import type { Sentence } from '../types.ts';
import {
  buildCard,
  conjugationCard,
  type ExerciseMaterial,
  exerciseMaterial,
  listeningCard,
  meaningCard,
  particleCard,
  patternCard,
} from './exercise-material.ts';
import { DAY_MS } from './items.ts';
import type { Pool } from './session-pool.ts';
import { writtenAs } from './unit-words.ts';

/** S4 exercises a daily session gets, at most. */
export const SESSION_EXERCISES = 2;

/** An exercise and the reading cards that must come before it. */
export interface PlacedExercise {
  card: SessionCard;
  after: number;
}

type Kind = ExerciseDrill['kind'];
const KINDS: readonly Kind[] = [
  'meaning',
  'particle',
  'build',
  'listening',
  'pattern',
  'conjugation',
];

interface Round {
  m: ExerciseMaterial;
  cards: readonly SessionCard[];
  /** Reading cards already used by an exercise, so the next one takes another. */
  used: Set<number>;
  /** Grammar points introduced before this session. */
  introduced: readonly string[];
  /** Sentences whose translations listening may offer. */
  others: readonly Sentence[];
}

/** Reading cards not used yet first, then the others, with their positions. */
function readingOrder(round: Round): { card: SessionCard; i: number }[] {
  const all = round.cards.flatMap((card, i) => (card.targets.length > 0 ? [{ card, i }] : []));
  return [
    ...all.filter(({ i }) => !round.used.has(i)),
    ...all.filter(({ i }) => round.used.has(i)),
  ];
}

type OnCard = (round: Round, card: SessionCard) => Promise<SessionCard | undefined>;

async function onReadCard(round: Round, make: OnCard): Promise<PlacedExercise | undefined> {
  for (const { card, i } of readingOrder(round)) {
    const made = await make(round, card);
    if (!made) continue;
    round.used.add(i);
    return { card: made, after: i + 1 };
  }
  return undefined;
}

/** A meaning check on a target of the card, written as the card shows it. */
async function meaningOf(round: Round, card: SessionCard) {
  const words = await round.m.repos.dictionary.words(card.targets.map((t) => t.wordId));
  return card.targets
    .flatMap((target, i) => {
      const word = words[i];
      return word ? [meaningCard(round.m, writtenAs(word, target.surface))] : [];
    })
    .find(Boolean);
}

const MAKERS: Record<Kind, (round: Round) => Promise<PlacedExercise | undefined>> = {
  meaning: (round) => onReadCard(round, meaningOf),
  particle: (round) => onReadCard(round, (r, c) => particleCard(r.m, [c.sentence])),
  build: (round) => onReadCard(round, (r, c) => buildCard(r.m, c.sentence)),
  listening: (round) => onReadCard(round, (r, c) => listeningCard(r.m, c.sentence, r.others)),
  pattern: async (round) => {
    const id = round.introduced.find((g) => patternRule(g) !== undefined);
    const card = id ? patternCard(round.m, id) : undefined;
    return card && { card, after: 0 };
  },
  conjugation: async (round) => {
    const card = conjugationCard(round.m);
    return card && { card, after: 0 };
  },
};

export interface SessionExerciseInput {
  pool: Pool;
  now: number;
  listening: boolean;
  introduced: readonly string[];
}

async function roundFor(repos: Repos, cards: readonly SessionCard[], input: SessionExerciseInput) {
  const seed = `s4|${Math.floor(input.now / DAY_MS)}`;
  const ids = [...new Set(cards.flatMap((c) => c.targets.map((t) => t.wordId)))];
  const lesson = (await repos.dictionary.words(ids)).flatMap((w) => w ?? []);
  const ctx = { repos, level: input.pool.gate.level, levels: input.pool.levels, seed };
  const m = await exerciseMaterial({ ...ctx, listening: input.listening }, lesson);
  const others = [...cards.map((c) => c.sentence), ...input.pool.sentences];
  return { m, cards, used: new Set<number>(), introduced: input.introduced, others };
}

/**
 * Up to `count` S4 exercises of different types for the session's reading cards (see the module
 * comment), each with the reading cards it must come after.
 */
export async function sessionExercises(
  repos: Repos,
  cards: readonly SessionCard[],
  input: SessionExerciseInput,
  count = SESSION_EXERCISES,
): Promise<PlacedExercise[]> {
  if (count <= 0 || cards.length === 0) return [];
  const round = await roundFor(repos, cards, input);
  const out: PlacedExercise[] = [];
  for (const kind of seededOrder(KINDS, String, round.m.seed)) {
    if (out.length >= count) break;
    const made = await MAKERS[kind](round);
    if (made) out.push(made);
  }
  return out;
}
