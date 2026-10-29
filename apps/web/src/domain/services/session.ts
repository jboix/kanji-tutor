/**
 * Builds a reading session (R2) over the `Repos` port: loads the pool, drops sentences whose
 * pre-tokenized readings JMdict does not confirm, runs the i+1 selector and mixes in
 * drills (R8).
 */

import { loadContentLanguage } from '../content-language.ts';
import { explanationLanguageOf } from '../defaults.ts';
import { DEFAULT_DRILL_SHARE } from '../drills/index.ts';
import { explainsGrammar } from '../explain-new.ts';
import { isoWeek } from '../ids.ts';
import { type MixQuestionsOptions, makeQuestions, makeSessionQuestions } from '../questions/mix.ts';
import type { Repos } from '../repos.ts';
import { selectSession } from '../selector.ts';
import type { SessionCard } from '../session-types.ts';
import type { LessonSection, SessionMinutes, SessionMix } from '../types.ts';
import { makeDrills } from './drills.ts';
import {
  grammarQueue,
  introducedGrammar,
  unintroducedGrammar,
  withGrammarIntros,
} from './grammar-intro.ts';
import { buildGrammarSession } from './grammar-session.ts';
import { DAY_MS } from './items.ts';
import { kanjiCardSession } from './kanji-cards.ts';
import { buildLessonPart } from './lesson-session.ts';
import { spanReadings, spanVariants } from './reading-check.ts';
import { scanSessionCards } from './scan-session.ts';
import { trustedSentences } from './sentence-trust.ts';
import { SESSION_EXERCISES, sessionExercises } from './session-exercises.ts';
import {
  capNewItems,
  DEFAULT_SESSION_MINUTES,
  fitMinutes,
  NEW_ITEM_CAPS,
  practiseAgain,
  readingsFor,
} from './session-length.ts';
import { alternate, exerciseSlots, mixCards } from './session-mix.ts';
import { loadPool, type Pool, type SessionFocus } from './session-pool.ts';
import { unitPassageCard } from './unit-passage.ts';

export type { SessionFocus } from './session-pool.ts';

/** A unit's passage card in the learner's language (N9), loading that language's texts. */
async function localPassageCard(repos: Repos, unitId: string): Promise<SessionCard | undefined> {
  const content = await loadContentLanguage(explanationLanguageOf(await repos.settings.get()));
  return unitPassageCard(unitId, content);
}

/** Sentences in a focused session from the kanji page. */
export const FOCUS_SESSION_SIZE = 5;
/** Sentences shown in the last two days are reused only when nothing fresher fits. */
const RECENT_MS = 2 * DAY_MS;

export interface BuildSessionOptions {
  now: number;
  /**
   * Number of sentences, with no time cap. By default the session fits the minutes set in
   * Settings (L6): as many sentences as that leaves room for, then cut to the time estimate.
   */
  size?: number;
  focus?: SessionFocus;
  /**
   * Share of drills (R8), overriding the plan's `drillShare` (else {@link DEFAULT_DRILL_SHARE}).
   * `/read?drills=1` passes the maximum (0.5). Focused sessions have no drills.
   */
  drillShare?: number;
  /**
   * One JLPT-shaped question (J1–J5) per this many sentences, instead of as many as the variety
   * mixer needs (V2); 0 for none. `/read?questions=1` passes 1. Focused sessions have none.
   */
  questionEvery?: number;
  /** Practise this unit (`/read?unit=…`, T3): its words and sentences first, its passage last. */
  unit?: string;
  /** With `unit`: only the unit's passage and its comprehension questions (the Read step, T6). */
  passage?: boolean;
  /** Practise one grammar point (`/read?grammar=…`): see `buildGrammarSession`. */
  grammar?: string;
  /** A round of kanji cards (`/read?cards=kanji`, Start → Kanji): see `kanjiCardSession`. */
  kanjiCards?: boolean;
  /** Practise a scanned lesson (`/read?scan=…`), apart from the daily mix: see `scanSessionCards`. */
  scan?: string;
  /** With `unit`: the lesson's 練習 section (S3), the unit's practice without its passage. */
  practice?: boolean;
  /**
   * The device has a Japanese voice, so listening exercises can be made (S4). It may still be
   * being looked up: only the steps that make exercises wait for it.
   */
  listening?: boolean | Promise<boolean>;
  /** With `unit`: one section of the unit lesson (S3), and its part (1-based). */
  section?: LessonSection;
  part?: number;
}

/** Questions to make: as many as `every` asks, else enough to fill the mixer's slots (V2). */
export function questionCount(readings: number, drills: number, every?: number): number {
  if (every !== undefined) return every > 0 ? Math.floor(readings / every) : 0;
  return Math.max(exerciseSlots(readings) - drills, Math.floor(readings / 6));
}

async function planMix(repos: Repos, now: number): Promise<SessionMix | undefined> {
  const plan = await repos.plans.get(isoWeek(new Date(now)));
  return plan?.status === 'accepted' ? plan.mix : undefined;
}

async function recentSentenceIds(repos: Repos, now: number): Promise<string[]> {
  const reviews = await repos.reviews.since(now - RECENT_MS);
  return [...new Set(reviews.flatMap((review) => review.sentenceId ?? []))];
}

function sizeFor(options: BuildSessionOptions, minutes: SessionMinutes): number {
  if (options.size !== undefined) return options.size;
  if (options.focus) return FOCUS_SESSION_SIZE;
  return readingsFor(minutes, options.unit !== undefined);
}

/** Kanji the learner has met in a word (K3): those with a derived reading of level 1 or more. */
async function knownKanji(repos: Repos): Promise<Set<string>> {
  const rows = await repos.kanjiReadings.all();
  return new Set(rows.filter((row) => row.level > 0).map((row) => row.kanji));
}

/**
 * The selected cards within the level's new kanji and new words (L6), up to `size`, then more
 * sentences on those same new words when the caps leave room.
 */
async function capped(repos: Repos, cards: SessionCard[], pool: Pool, size: number) {
  const caps = NEW_ITEM_CAPS[pool.gate.level];
  const input = { levels: pool.levels, knownKanji: await knownKanji(repos), caps };
  const kept = capNewItems(cards, input).slice(0, size);
  const sentences = pool.sentences.filter((s) => s.verified);
  return practiseAgain(kept, sentences, pool.levels, size - kept.length);
}

/** Accepted answers per target (with attached endings) and the focus reason. */
function finish(card: SessionCard, focus: boolean): SessionCard {
  const targets = card.targets.map((target) => {
    const variants = spanVariants(card.sentence, target.tokenIndex);
    const readings = [...spanReadings(card.sentence, target.tokenIndex), ...variants];
    return { ...target, readings, ...(variants.length > 0 ? { variants } : {}) };
  });
  return { ...card, targets, reason: focus ? 'focus' : card.reason };
}

interface MixInput {
  options: BuildSessionOptions;
  pool: Pool;
  sentences: SessionCard['sentence'][];
  recent: string[];
  mix: SessionMix | undefined;
  /** "Explain new grammar first" (L7): grammar intro cards, else a chip on the exercise. */
  explainFirst: boolean;
}

/** New grammar points of the session (G4), those a question may not blank yet, and the known. */
async function sessionGrammar(repos: Repos, pool: Pool) {
  const introduced = introducedGrammar(await repos.items.byKind('grammar'));
  const level = pool.gate.level;
  const fresh = grammarQueue({ level, unitGrammar: pool.plan.grammar, introduced });
  return { fresh, skip: unintroducedGrammar(level, introduced, fresh), introduced };
}

/** A forced mix of drills or questions (`?drills=1`, `?questions=1`): no S4 exercises then. */
const forced = (options: BuildSessionOptions) =>
  options.questionEvery !== undefined || options.drillShare !== undefined;

/**
 * The S4 exercises (S7): at least one when there is room after the drills and questions, two
 * when the slots between reading cards still need filling.
 */
async function s4Exercises(
  repos: Repos,
  cards: SessionCard[],
  input: MixInput,
  known: { introduced: ReadonlySet<string>; taken: number },
) {
  const { options, pool } = input;
  if (forced(options)) return [];
  const room = Math.max(0, cards.length - 1 - known.taken);
  const need = Math.max(1, exerciseSlots(cards.length) - known.taken);
  const introduced = [...known.introduced];
  const listening = (await options.listening) === true;
  const exerciseInput = { pool, now: options.now, listening, introduced };
  const count = Math.min(SESSION_EXERCISES, room, need);
  return sessionExercises(repos, cards, exerciseInput, count);
}

/**
 * Questions for the mixer's free slots: first on known words, then, when those run short (a
 * learner from zero), on the session's own words, each placed after the cards that introduce
 * its words (V2).
 */
async function slotQuestions(
  repos: Repos,
  cards: SessionCard[],
  qs: MixQuestionsOptions,
  slots: { want: number; room: number },
) {
  const made = (await makeQuestions(repos, cards, qs, slots.want)).slice(0, slots.room);
  const short = Math.min(slots.want, slots.room) - made.length;
  const recent = [...qs.recent, ...made.map((c) => c.sentence.id)];
  // Twice as many as needed, keeping those that can come before the last reading card,
  // earliest first: one that needs every card read could only go last.
  const own = (await makeSessionQuestions(repos, cards, { ...qs, recent }, short * 2))
    .filter((p) => p.after < cards.length)
    .sort((a, b) => a.after - b.after)
    .slice(0, short);
  return {
    questions: [...made, ...own.map((p) => p.card)],
    after: new Map(own.map((p) => [p.card, p.after] as const)),
  };
}

/**
 * The current unit's passage as one more exercise when the others are too few for the reading
 * cards (V2): a learner from zero has few questions to answer. Not in a unit session,
 * which ends with the passage anyway.
 */
async function passageIfShort(
  repos: Repos,
  pool: Pool,
  tail: SessionCard | undefined,
  short: boolean,
) {
  const unit = pool.plan.unit?.unit.id;
  if (tail || !unit || !short) return [];
  const passage = await localPassageCard(repos, unit);
  return passage ? [passage] : [];
}

type SessionGrammar = Awaited<ReturnType<typeof sessionGrammar>>;

/**
 * The exercises of the mix: drills by the plan's share, questions for the slots between reading
 * cards, and one or two S4 exercises (S7), taken in turn, with the reading cards each must come
 * after.
 */
async function exerciseCards(
  repos: Repos,
  cards: SessionCard[],
  input: MixInput,
  grammar: SessionGrammar,
) {
  const { options, pool, sentences, recent, mix } = input;
  const { now } = options;
  const share = options.drillShare ?? mix?.drillShare ?? DEFAULT_DRILL_SHARE;
  const drills = await makeDrills(repos, cards, { now, share, pool, sentences, recent, mix });
  const prefer = [...grammar.fresh, ...pool.plan.grammar];
  const qs = { now, every: 0, levels: pool.levels, sentences, recent, gate: pool.gate, prefer };
  const want = questionCount(cards.length, drills.length, options.questionEvery);
  const free = Math.max(0, cards.length - 1 - drills.length);
  // One slot is kept for an S4 exercise, so every session mixes in one (S7).
  const room = forced(options) ? free : Math.max(0, free - 1);
  const slots = await slotQuestions(
    repos,
    cards,
    { ...qs, skipGrammar: grammar.skip },
    { want, room },
  );
  const taken = drills.length + slots.questions.length;
  const s4 = await s4Exercises(repos, cards, input, { introduced: grammar.introduced, taken });
  const s4Cards = s4.map((p) => p.card);
  return {
    exercises: alternate(drills, alternate(s4Cards, slots.questions)),
    after: new Map([...slots.after, ...s4.map((p) => [p.card, p.after] as const)]),
  };
}

/**
 * The variety mix (V2): the exercises spread between reading cards, the unit's passage last in a
 * unit session, and a grammar introduction before each new point's first exercise (G4).
 */
async function mixSession(repos: Repos, cards: SessionCard[], input: MixInput) {
  const grammar = await sessionGrammar(repos, input.pool);
  const { exercises, after } = await exerciseCards(repos, cards, input, grammar);
  const tail = await tailFor(repos, input.options);
  const short = exercises.length < exerciseSlots(cards.length);
  const extra = await passageIfShort(repos, input.pool, tail, short);
  const fit = input.options.questionEvery === undefined;
  const mixed = mixCards(cards, [...exercises, ...extra], tail, after, fit);
  return withGrammarIntros(mixed, grammar.fresh, input.explainFirst);
}

/** A unit session ends with its passage (T3), but for the lesson's 練習 section (S3). */
async function tailFor(repos: Repos, options: BuildSessionOptions) {
  if (!options.unit || options.practice) return undefined;
  return localPassageCard(repos, options.unit);
}

async function scanSession(repos: Repos, scan: string, options: BuildSessionOptions) {
  const listening = (await options.listening) === true;
  return scanSessionCards(repos, scan, { now: options.now, listening });
}

/** The sessions that are not a reading mix: kanji cards, a grammar point, a scanned lesson. */
function specialSession(repos: Repos, options: BuildSessionOptions) {
  const { now } = options;
  if (options.kanjiCards) return kanjiCardSession(repos, now);
  if (options.scan) {
    return scanSession(repos, options.scan, options);
  }
  if (options.grammar) {
    return buildGrammarSession(repos, options.grammar, now, (c) => finish(c, false));
  }
  return undefined;
}

/**
 * Builds today's session (R2): the learner's own new sentences first (an accepted Use it
 * sentence, a verified AI sentence; see `ownPriority`),
 * then due words, then fresh ones of the current lesson or unit and cluster (T3, V1), then new
 * words that are a sentence's only unknown. Every sentence is at or below the learner's level
 * (G3), verified and i+1, with 1–2 targets, and every content token's reading fits JMdict; a
 * lone-kanji target must have its most likely reading, since context is not modelled.
 * Accepted readings include attached endings (まっ, まって). Drills, questions and grammar
 * introductions are mixed in by the variety mixer (see `mixSession`). Deterministic for the
 * same data and day.
 */
export async function buildSession(
  repos: Repos,
  options: BuildSessionOptions,
): Promise<SessionCard[]> {
  const own = specialSession(repos, options);
  if (own) return own;
  const { unit } = options;
  const passage = async () => {
    const card = unit ? await localPassageCard(repos, unit) : undefined;
    return card ? [card] : [];
  };
  if (unit && options.section) {
    const listening = (await options.listening) === true;
    const input = {
      unit,
      section: options.section,
      part: options.part,
      now: options.now,
      listening,
    };
    const practice = () => buildReading(repos, { ...options, practice: true });
    return buildLessonPart(repos, input, { practice, reading: passage });
  }
  if (unit && options.passage) return passage();
  return buildReading(repos, options);
}

interface SelectInput {
  pool: Pool;
  sentences: SessionCard['sentence'][];
  recent: string[];
  mix: SessionMix | undefined;
  size: number;
  now: number;
  focus: boolean;
}

/** The i+1 selection (R2) over the pool, each card with its accepted readings. */
function selectCards({ pool, sentences, recent, mix, size, now, focus }: SelectInput) {
  return selectSession({
    sentences,
    levels: pool.levels,
    due: pool.due,
    fresh: pool.fresh,
    priority: pool.priority,
    preferredSentenceIds: pool.preferred,
    size,
    now,
    recentSentenceIds: recent,
    ...(mix ? { mix } : {}),
  }).map((card) => finish(card, focus));
}

/** A reading session: selected, capped to the new items and minutes (L6), and mixed (V2). */
async function buildReading(repos: Repos, options: BuildSessionOptions) {
  const { now, focus } = options;
  const mix = await planMix(repos, now);
  const settings = await repos.settings.get();
  const minutes = settings.sessionMinutes ?? DEFAULT_SESSION_MINUTES;
  const size = sizeFor(options, minutes);
  const pool = await loadPool(repos, { now, size, focus, unit: options.unit });
  const sentences = await trustedSentences(repos, pool.sentences, pool.levels);
  const recent = await recentSentenceIds(repos, now);
  const select = { pool, sentences, recent, mix, now, focus: focus !== undefined };
  if (focus) return selectCards({ ...select, size });
  const cards = selectCards({ ...select, size: size * 2 });
  const kept = (await capped(repos, cards, pool, size)).map((c) => finish(c, false));
  const explainFirst = explainsGrammar(settings);
  const mixed = await mixSession(repos, kept, {
    options,
    pool,
    sentences,
    recent,
    mix,
    explainFirst,
  });
  return options.size === undefined ? fitMinutes(mixed, minutes) : mixed;
}
