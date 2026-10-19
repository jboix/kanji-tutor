import { itemId } from './ids.ts';
import { devoice, hasKanji, shortenVowels, toKanaFold } from './kana.ts';
import type { SessionCard, Target, WordLevels } from './session-types.ts';
import type { ErrorType, Item, Sentence, SessionMix, Token } from './types.ts';

/** Inputs to building a session. */
export interface SessionInput {
  /** Candidate sentences (verified only). */
  sentences: readonly Sentence[];
  /** Levels of every word the learner tracks. Untracked words count as level 0. */
  levels: WordLevels;
  /** Word and grammar items due now, soonest first. */
  due: readonly Item[];
  /** New items to introduce (level ≤ 2), e.g. this week's lesson. */
  fresh: readonly Item[];
  /** Items queued before everything else: the words of the learner's own new sentences. */
  priority?: readonly Item[];
  /** Sentences preferred over all others for their words (the learner's own new sentences). */
  preferredSentenceIds?: readonly string[];
  mix?: SessionMix;
  size: number;
  now: number;
  /** Sentences shown in recent sessions; used only when nothing fresher fits. */
  recentSentenceIds?: readonly string[];
}

/** Level from which a word counts as readable (K2: reads in a familiar word). */
export const KNOWN_LEVEL = 3;

/** Most targets per sentence (R2). */
const MAX_TARGETS = 2;

/**
 * Tokenizer parts of speech that never count as unknown: grammar glue and punctuation. Content
 * POS ('noun', 'verb', 'adjective', 'adverb', 'pronoun', 'adnominal', 'prefix', 'suffix',
 * 'conjunction', 'interjection', 'other') count only when written with kanji: kana-only
 * tokens (する, これ, コーヒー) are readable as written, so they are never unknown or targets.
 */
export const FUNCTION_POS: ReadonlySet<string> = new Set(['particle', 'auxiliary', 'symbol']);

/** True when a token has kanji to read and is not a function word or punctuation. */
function isContent(token: Token): boolean {
  return !FUNCTION_POS.has(token.pos) && hasKanji(token.surface);
}

function isKnown(token: Token, levels: WordLevels): boolean {
  return token.wordId !== undefined && (levels.get(token.wordId) ?? 0) >= KNOWN_LEVEL;
}

/**
 * Indices of the content tokens the learner cannot read yet: kanji tokens whose word level is
 * below 3, or that did not resolve to a dictionary word. See {@link FUNCTION_POS}.
 */
export function unknownTokens(sentence: Sentence, levels: WordLevels): number[] {
  return sentence.tokens.flatMap((token, i) =>
    isContent(token) && !isKnown(token, levels) ? [i] : [],
  );
}

/**
 * True when every content token except the targets is known (level ≥ 3) and there are 1–2
 * targets (R2): the unknown tokens number 1–2 and each resolved to a dictionary word.
 */
export function isIPlusOne(sentence: Sentence, levels: WordLevels): boolean {
  const unknown = unknownTokens(sentence, levels);
  return (
    unknown.length >= 1 &&
    unknown.length <= MAX_TARGETS &&
    unknown.every((i) => sentence.tokens[i]?.wordId !== undefined)
  );
}

/** A sentence that can carry a session card, with its precomputed unknown tokens. */
interface Candidate {
  sentence: Sentence;
  unknown: number[];
  order: number;
  recent: boolean;
  preferred: boolean;
}

/** Candidates indexed by the word ids of their kanji tokens. */
type CandidateIndex = Map<string, Candidate[]>;

interface Marks {
  recent: ReadonlySet<string>;
  preferred: ReadonlySet<string>;
}

function marksOf(input: SessionInput): Marks {
  return {
    recent: new Set(input.recentSentenceIds ?? []),
    preferred: new Set(input.preferredSentenceIds ?? []),
  };
}

function toCandidate(input: SessionInput, marks: Marks) {
  return (sentence: Sentence, order: number): Candidate[] => {
    if (!sentence.verified) return [];
    const unknown = unknownTokens(sentence, input.levels);
    const targetable = unknown.every((i) => sentence.tokens[i]?.wordId !== undefined);
    if (!targetable || unknown.length > MAX_TARGETS) return [];
    const { id } = sentence;
    return [
      {
        sentence,
        unknown,
        order,
        recent: marks.recent.has(id),
        preferred: marks.preferred.has(id),
      },
    ];
  };
}

function buildIndex(input: SessionInput): CandidateIndex {
  const index: CandidateIndex = new Map();
  for (const candidate of input.sentences.flatMap(toCandidate(input, marksOf(input)))) {
    const ids = new Set(candidate.sentence.tokens.filter(isContent).map((t) => t.wordId));
    for (const id of ids) {
      if (id !== undefined) index.set(id, [...(index.get(id) ?? []), candidate]);
    }
  }
  return index;
}

function toTarget(tokens: readonly Token[], tokenIndex: number): Target[] {
  const token = tokens[tokenIndex];
  if (token?.wordId === undefined) return [];
  const { wordId, surface } = token;
  const readings = [toKanaFold(token.reading)];
  return [{ tokenIndex, itemId: itemId('word', wordId), wordId, surface, readings }];
}

/** Targets of a candidate for a word: its first kanji token plus the other unknown words. */
function targetsFor(candidate: Candidate, wordId: string): Target[] {
  const { tokens } = candidate.sentence;
  const own = tokens.findIndex((t) => t.wordId === wordId && isContent(t));
  const indices = [...new Set([own, ...candidate.unknown])].sort((a, b) => a - b);
  const targets: Target[] = [];
  for (const target of indices.flatMap((i) => toTarget(tokens, i))) {
    if (!targets.some((t) => t.wordId === target.wordId)) targets.push(target);
  }
  return targets;
}

/** Whether a reading exercises an error type the plan wants more of. */
function exercises(reading: string, errorType: ErrorType): boolean {
  if (errorType === 'long-vowel') return shortenVowels(reading) !== reading;
  if (errorType === 'sokuon') return reading.includes('っ');
  if (errorType === 'rendaku') return devoice(reading.slice(1)) !== reading.slice(1);
  return false;
}

/** True when a card matches the plan focus: a focus grammar point or a focus error type. */
function matchesFocus(
  sentence: Sentence,
  targets: readonly Target[],
  mix: SessionMix | undefined,
): boolean {
  if (!mix) return false;
  if (sentence.grammarIds?.some((id) => mix.grammarIds.includes(id))) return true;
  const focus = Object.entries(mix.focusErrorTypes).filter(([, share]) => (share ?? 0) > 0);
  const readings = targets.flatMap((t) => t.readings);
  return focus.some(([type]) => readings.some((r) => exercises(r, type as ErrorType)));
}

interface Option {
  candidate: Candidate;
  targets: Target[];
  focus: boolean;
}

/**
 * Sort key: preferred (the learner's own new sentence, never recent), then not recently shown,
 * plan focus, fewer targets and input order.
 */
function rank(option: Option): number[] {
  const { candidate, focus, targets } = option;
  const { preferred, recent, order } = candidate;
  return [Number(!preferred), Number(recent), Number(!focus), targets.length, order];
}

function compareRanks(a: Option, b: Option): number {
  const ra = rank(a);
  const rb = rank(b);
  const at = ra.findIndex((value, i) => value !== rb[i]);
  return at < 0 ? 0 : (ra[at] ?? 0) - (rb[at] ?? 0);
}

interface Picking {
  index: CandidateIndex;
  usedSentences: Set<string>;
  /** Word ids already targeted in this session. */
  covered: Set<string>;
  mix: SessionMix | undefined;
}

/** Best unused sentence for a word: 1–2 targets, the word among them, none targeted before. */
function pick(picking: Picking, wordId: string): Option | undefined {
  const options = (picking.index.get(wordId) ?? [])
    .filter((c) => !picking.usedSentences.has(c.sentence.id))
    .map((candidate) => {
      const targets = targetsFor(candidate, wordId);
      return { candidate, targets, focus: matchesFocus(candidate.sentence, targets, picking.mix) };
    })
    .filter((o) => o.targets.length >= 1 && o.targets.length <= MAX_TARGETS)
    .filter((o) => !o.targets.some((t) => picking.covered.has(t.wordId)));
  return options.sort(compareRanks)[0];
}

type Queued = { item: Item; reason: 'due' | 'new' };

/**
 * Priority items first, then due items soonest first (stable), then fresh ones. Only word items
 * can be targets: grammar is reviewed through cloze drills (see `mixDrills`).
 */
function queue(input: SessionInput): Queued[] {
  const dueAt = (item: Item) => item.card?.due ?? Number.POSITIVE_INFINITY;
  const due = [...input.due].sort((a, b) => dueAt(a) - dueAt(b));
  const priority = (input.priority ?? []).map((item) => ({
    item,
    reason: dueAt(item) <= input.now ? ('due' as const) : ('new' as const),
  }));
  return [
    ...priority,
    ...due.map((item) => ({ item, reason: 'due' as const })),
    ...input.fresh.map((item) => ({ item, reason: 'new' as const })),
  ].filter((q) => q.item.kind === 'word');
}

/** The card for a queued item, if any unused sentence fits it. */
function cardFor(picking: Picking, { item, reason }: Queued): SessionCard | undefined {
  if (picking.covered.has(item.ref)) return undefined;
  const option = pick(picking, item.ref);
  if (!option) return undefined;
  const focused = reason === 'new' && option.focus;
  return {
    sentence: option.candidate.sentence,
    targets: option.targets,
    reason: focused ? 'focus' : reason,
  };
}

/**
 * Builds an i+1 session (R2): `priority` items first, then due word items (soonest due), then
 * fresh ones, each in an unused verified sentence whose other content tokens are all known, with
 * 1–2 targets. A second target is the sentence's other unknown word, and a word already targeted
 * is skipped. `preferredSentenceIds` win over other sentences for their words; sentences in
 * `recentSentenceIds` are a last resort. `mix.grammarIds` and `mix.focusErrorTypes` are soft
 * preferences (such cards from fresh items get reason 'focus'). Drills (`mix.drillShare`) and
 * grammar reviews are mixed in afterwards by `mixDrills`, as cloze for grammar. Deterministic:
 * ties keep the input order of `sentences`.
 */
export function selectSession(input: SessionInput): SessionCard[] {
  const picking: Picking = {
    index: buildIndex(input),
    usedSentences: new Set(),
    covered: new Set(),
    mix: input.mix,
  };
  const cards: SessionCard[] = [];
  for (const queued of queue(input)) {
    if (cards.length >= input.size) break;
    const card = cardFor(picking, queued);
    if (!card) continue;
    picking.usedSentences.add(card.sentence.id);
    for (const target of card.targets) picking.covered.add(target.wordId);
    cards.push(card);
  }
  return cards;
}
