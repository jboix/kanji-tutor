/**
 * Questions for a session (J1–J5). The session builder's variety mixer (V2,
 * `services/session-mix.ts`) places them; `placeQuestions` is the older fixed placement.
 *
 * - `questionsFor(cards, ctx, count)` builds up to `count` questions (with their sentences)
 *   from sentences not used by `cards`, the kinds taken in turn;
 * - `questionCard(card)` wraps one as a `SessionCard` (reason 'drill', no targets);
 * - `makeQuestions(repos, cards, options, count)` builds question cards over the `Repos` port,
 *   from material that passes the session's level gate (G3);
 * - `makeSessionQuestions(repos, cards, options, count)` builds them on the session's own words,
 *   each to be placed after the cards that introduce them (V2, D56);
 * - `placeQuestions(cards, questions, every)` places them one after every `every` cards;
 * - `passageCard(set)` wraps a 読解 passage (T6) as a card;
 * - `mixQuestions(repos, cards, options)` makes and places them.
 */
import { seededOrder } from '../drills/seed.ts';
import type { Repos } from '../repos.ts';
import { KNOWN_LEVEL } from '../selector.ts';
import { learnerLevelOf } from '../services/learner-level.ts';
import { gateSentences, type LevelGate } from '../services/level-gate.ts';
import { trustedSentences } from '../services/sentence-trust.ts';
import type { SessionCard, WordLevels } from '../session-types.ts';
import type { KnowledgeLevel, QuestionKind, Sentence } from '../types.ts';
import {
  contextWordMaker,
  grammarFormMaker,
  kanjiReadingMaker,
  type Maker,
  orthographyMaker,
  type QuestionContext,
  sentenceOrderMaker,
} from './sources.ts';
import type { ComprehensionSet, Question } from './types.ts';

/** One question after every this many reading cards; 0 turns questions off. */
export const QUESTION_EVERY = 6;

/** Kinds in the order they take turns (J1, J4, J5, J2, J3). */
export const QUESTION_KINDS: readonly QuestionKind[] = [
  'kanji-reading',
  'grammar-form',
  'sentence-order',
  'orthography',
  'context-word',
];

/**
 * Sentences tried per question before a kind gives up. 文法形式の判断 and 文の組み立て need no
 * dictionary lookups, so they look through many more (few sentences fit 文の組み立て).
 */
const MAX_TRIES = 40;
const CHEAP_TRIES = 600;
const CHEAP: ReadonlySet<QuestionKind> = new Set(['grammar-form', 'sentence-order']);
/** Known words whose sentences are searched for question material, and sentences per word. */
const KNOWN_WORDS = 80;
const PER_WORD = 6;

/** A question and the sentence it was made from. */
export interface QuestionCard {
  question: Question;
  sentence: Sentence;
}

function makerFor(kind: QuestionKind): Maker | undefined {
  const makers: Partial<Record<QuestionKind, () => Maker>> = {
    'kanji-reading': () => kanjiReadingMaker,
    orthography: () => orthographyMaker,
    'context-word': contextWordMaker,
    'grammar-form': () => grammarFormMaker,
    'sentence-order': () => sentenceOrderMaker,
  };
  return makers[kind]?.();
}

async function produce(ctx: QuestionContext, kind: QuestionKind, maker: Maker, used: Set<string>) {
  const pool = seededOrder(ctx.sentences, (s) => s.id, `${ctx.seed}|${kind}`)
    .filter((s) => !used.has(s.id))
    .slice(0, CHEAP.has(kind) ? CHEAP_TRIES : MAX_TRIES);
  for (const sentence of pool) {
    const question = await maker(ctx, sentence);
    if (question) return { question, sentence };
  }
  return undefined;
}

/**
 * Up to `count` questions, the kinds taking turns and a kind dropped once it can make no more.
 * Each uses its own sentence, never one of `cards`. Deterministic for the same data and seed.
 */
export async function questionsFor(
  cards: readonly SessionCard[],
  ctx: QuestionContext,
  count: number,
  kinds: readonly QuestionKind[] = QUESTION_KINDS,
): Promise<QuestionCard[]> {
  const used = new Set(cards.map((c) => c.sentence.id));
  const active = kinds.flatMap((kind) => {
    const maker = makerFor(kind);
    return maker ? [{ kind, maker }] : [];
  });
  const out: QuestionCard[] = [];
  for (let turn = 0; out.length < count && active.length > 0; ) {
    const at = turn % active.length;
    const next = active[at];
    const made = next && (await produce(ctx, next.kind, next.maker, used));
    if (!made) {
      active.splice(at, 1);
      continue;
    }
    used.add(made.sentence.id);
    out.push(made);
    turn += 1;
  }
  return out;
}

/** A session card carrying a question: no reading targets, reason 'drill' (not a sentence). */
export function questionCard({ question, sentence }: QuestionCard): SessionCard {
  return { sentence, targets: [], reason: 'drill', question };
}

/**
 * A session card carrying a reading passage and its questions (T6), for the themes content:
 * the passage's lines are its sentence text, with no reading targets.
 */
export function passageCard(set: ComprehensionSet): SessionCard {
  const text = set.sentences.map((line) => line.ja).join('');
  const id = `passage:${set.id}`;
  const sentence: Sentence = {
    id,
    text,
    source: 'tatoeba',
    tokens: [],
    wordIds: [],
    verified: true,
  };
  return { sentence, targets: [], reason: 'drill', passage: set };
}

const isExercise = (card: SessionCard | undefined) =>
  card?.drill !== undefined || card?.question !== undefined || card?.passage !== undefined;

/**
 * Places a question after every `every` reading cards: never first, never right before or after
 * a drill (it waits for the next gap), and never at the very end.
 */
export function placeQuestions(
  cards: readonly SessionCard[],
  questions: readonly SessionCard[],
  every: number,
): SessionCard[] {
  const out: SessionCard[] = [];
  let reading = 0;
  cards.forEach((card, i) => {
    out.push(card);
    if (isExercise(card)) return;
    reading += 1;
    const placed = out.filter((c) => c.question).length;
    const next = cards[i + 1];
    const question = questions[placed];
    if (question && reading >= every * (placed + 1) && next && !isExercise(next))
      out.push(question);
  });
  return out;
}

export interface MixQuestionsOptions {
  now: number;
  /** One question after every this many reading cards (see {@link QUESTION_EVERY}). */
  every: number;
  levels: WordLevels;
  /** The session's spare sentences that passed the reading checks. */
  sentences: readonly Sentence[];
  /** Sentence ids read in the last two days: not used. */
  recent: readonly string[];
  /** The session's level gate (G3): question sentences pass it too. */
  gate?: LevelGate;
  /** Grammar to blank first: the session's new points and its unit's (G4). */
  prefer?: readonly string[];
  /** Grammar not to blank yet: not introduced (G4). */
  skipGrammar?: ReadonlySet<string>;
  /** Only `sentences` as material, no sentences of known words (a grammar focus session). */
  only?: boolean;
  /** The kinds to take in turn; all five by default. */
  kinds?: readonly QuestionKind[];
}

/** Sentences per level added as material when gated, so a new learner gets questions too. */
const PER_LEVEL = 40;

function sentencesOf(repos: Repos, id: string, gate: LevelGate | undefined) {
  if (gate) return repos.sentences.containingWord(id, { maxLevel: gate.level, limit: PER_WORD });
  return repos.sentences.containingWord(id).then((list) => list.slice(0, PER_WORD));
}

/** Sentences at the gate's level and the easier ones (kana-heavy N5 lines for a new learner). */
async function levelSentences(repos: Repos, gate: LevelGate | undefined) {
  if (!gate) return [];
  const levels = ([5, 4, 3] as const).filter((level) => level >= gate.level);
  const lists = await Promise.all(levels.map((level) => repos.sentences.atLevel(level, PER_LEVEL)));
  return lists.flat();
}

/** Sentences of known words, so questions have material beyond the session's pool. */
async function knownSentences(repos: Repos, options: MixQuestionsOptions, seed: string) {
  const known = [...options.levels].filter(([, l]) => l >= KNOWN_LEVEL).map(([id]) => id);
  const sample = seededOrder(known, String, seed).slice(0, KNOWN_WORDS);
  const lists = await Promise.all(sample.map((id) => sentencesOf(repos, id, options.gate)));
  const extra = await levelSentences(repos, options.gate);
  return [...lists.flat(), ...extra].filter((s) => s.verified);
}

async function gated(repos: Repos, options: MixQuestionsOptions, sentences: Sentence[]) {
  return options.gate ? gateSentences(repos, options.gate, sentences, options.levels) : sentences;
}

async function contextFor(
  repos: Repos,
  cards: readonly SessionCard[],
  options: MixQuestionsOptions,
) {
  const seed = String(Math.floor(options.now / 86_400_000));
  const exclude = new Set([...cards.map((c) => c.sentence.id), ...options.recent]);
  const texts = new Set(cards.map((c) => c.sentence.text));
  const extra = options.only ? [] : await knownSentences(repos, options, seed);
  const found = [...options.sentences, ...extra];
  const fresh = [...new Map(found.map((s) => [s.id, s])).values()].filter(
    (s) => !exclude.has(s.id) && !texts.has(s.text),
  );
  const own = (await repos.items.byKind('grammar')).map((item) => item.ref);
  const ctx: QuestionContext = {
    repos,
    levels: options.levels,
    sentences: await trustedSentences(repos, await gated(repos, options, fresh), options.levels),
    avoid: new Set(cards.flatMap((c) => c.targets.map((t) => t.wordId))),
    learnerLevel: learnerLevelOf(await repos.settings.get()),
    grammar: [...new Set([...(options.prefer ?? []), ...own])],
    seed,
  };
  if (options.skipGrammar) ctx.skipGrammar = options.skipGrammar;
  return ctx;
}

/**
 * Adds questions to a session (see the module comment). The number is the reading cards ÷
 * `every`, rounded down; fewer when the material runs out. Deterministic for the same data and day.
 */
export async function mixQuestions(
  repos: Repos,
  cards: SessionCard[],
  options: MixQuestionsOptions,
): Promise<SessionCard[]> {
  const reading = cards.filter((c) => !isExercise(c)).length;
  const count = options.every > 0 ? Math.floor(reading / options.every) : 0;
  if (count === 0) return cards;
  const made = await makeQuestions(repos, cards, options, count);
  return placeQuestions(cards, made, options.every);
}

/** A question on the session's own words and how many reading cards must come before it. */
export interface PlacedQuestion {
  card: SessionCard;
  after: number;
}

/** Word id → index of the first card that targets it. */
function firstCards(cards: readonly SessionCard[]): Map<string, number> {
  const out = new Map<string, number>();
  cards.forEach((card, i) => {
    for (const t of card.targets) if (!out.has(t.wordId)) out.set(t.wordId, i);
  });
  return out;
}

/** Reading cards that must come before a question on `sentence`: up to its last session word. */
function afterOf(sentence: Sentence, first: ReadonlyMap<string, number>): number {
  const at = sentence.wordIds.flatMap((id) => first.get(id) ?? []);
  return at.length > 0 ? Math.max(...at) + 1 : 0;
}

/**
 * Questions on the session's own words (V2, D56), for a learner who knows too few words for
 * {@link makeQuestions}: each word a card targets counts as read once its card has been, so J1
 * and J2 can ask it, and J4 and J5 can use a sentence made of such words. A question comes after
 * the cards of every session word its sentence shows.
 */
export async function makeSessionQuestions(
  repos: Repos,
  cards: readonly SessionCard[],
  options: MixQuestionsOptions,
  count: number,
): Promise<PlacedQuestion[]> {
  const first = firstCards(cards);
  if (count <= 0 || first.size === 0) return [];
  const levels = new Map(options.levels);
  for (const id of first.keys())
    levels.set(id, Math.max(levels.get(id) ?? 0, KNOWN_LEVEL) as KnowledgeLevel);
  const ctx = {
    ...(await contextFor(repos, cards, { ...options, levels })),
    avoid: new Set<string>(),
  };
  const made = await questionsFor(cards, ctx, count, options.kinds);
  return made.map((q) => ({ card: questionCard(q), after: afterOf(q.sentence, first) }));
}

/** Up to `count` question cards for the session's cards, not placed yet (see the module comment). */
export async function makeQuestions(
  repos: Repos,
  cards: readonly SessionCard[],
  options: MixQuestionsOptions,
  count: number,
): Promise<SessionCard[]> {
  if (count <= 0) return [];
  const ctx = await contextFor(repos, cards, options);
  return (await questionsFor(cards, ctx, count, options.kinds)).map(questionCard);
}
