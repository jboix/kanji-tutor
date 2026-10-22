/**
 * Session length (L6): a session or lesson takes about the minutes set in Settings (5 by
 * default), by the R13 time estimate rather than a card count, and brings in only a few new
 * kanji and words at a time.
 */
import { itemId } from '../ids.ts';
import { unknownTokens } from '../selector.ts';
import type { SessionCard, Target, WordLevels } from '../session-types.ts';
import type { LearnerLevel, Sentence, SessionMinutes } from '../types.ts';
import { sessionSeconds } from './session-outline.ts';

export const DEFAULT_SESSION_MINUTES: SessionMinutes = 5;

/** New kanji and new words one session may introduce, by the learner's level. */
export const NEW_ITEM_CAPS: Readonly<Record<LearnerLevel, { kanji: number; words: number }>> = {
  5: { kanji: 3, words: 5 },
  4: { kanji: 5, words: 8 },
  3: { kanji: 5, words: 8 },
};

/** A reading card with the exercises the mixer puts beside it, roughly (R13 times, V2). */
const SECONDS_PER_READING = 45;
const PASSAGE_SECONDS = 120;

/** Reading cards to select for a session of `minutes`, a unit's passage left room for. */
export function readingsFor(minutes: SessionMinutes, withPassage: boolean): number {
  const room = minutes * 60 - (withPassage ? PASSAGE_SECONDS : 0);
  return Math.max(3, Math.floor(room / SECONDS_PER_READING));
}

const KANJI = /\p{Script=Han}/gu;

export interface NewItemInput {
  levels: WordLevels;
  /** Kanji the learner has met in a word already. */
  knownKanji: ReadonlySet<string>;
  caps: { kanji: number; words: number };
}

/** The new words a card would bring in and their kanji not met before. */
function newOf(card: SessionCard, input: NewItemInput) {
  const fresh = card.targets.filter((t) => (input.levels.get(t.wordId) ?? 0) === 0);
  const kanji = fresh.flatMap((t) => t.surface.match(KANJI) ?? []);
  return {
    words: fresh.map((t) => t.wordId),
    kanji: kanji.filter((k) => !input.knownKanji.has(k)),
  };
}

/**
 * The cards in order, leaving out each one that would take the session past its new kanji or
 * new words (L6). Cards on words already met always stay.
 */
export function capNewItems(cards: readonly SessionCard[], input: NewItemInput): SessionCard[] {
  const words = new Set<string>();
  const kanji = new Set<string>();
  return cards.filter((card) => {
    const add = newOf(card, input);
    const nextWords = new Set([...words, ...add.words]);
    const nextKanji = new Set([...kanji, ...add.kanji]);
    if (nextWords.size > input.caps.words || nextKanji.size > input.caps.kanji) return false;
    for (const id of add.words) words.add(id);
    for (const k of add.kanji) kanji.add(k);
    return true;
  });
}

/** The session's new words: targets of cards on words not met before. */
function newWords(cards: readonly SessionCard[], levels: WordLevels): Set<string> {
  const fresh = cards.flatMap((c) => c.targets).filter((t) => (levels.get(t.wordId) ?? 0) === 0);
  return new Set(fresh.map((t) => t.wordId));
}

/** A reading card on the unknown tokens of `sentence`, when they are all words of `allowed`. */
function againCard(sentence: Sentence, levels: WordLevels, allowed: ReadonlySet<string>) {
  const unknown = unknownTokens(sentence, levels);
  const targets: Target[] = unknown.flatMap((i) => {
    const token = sentence.tokens[i];
    if (!token?.wordId || !allowed.has(token.wordId)) return [];
    const { wordId, surface } = token;
    return [{ tokenIndex: i, itemId: itemId('word', wordId), wordId, surface, readings: [] }];
  });
  const fits = targets.length === unknown.length && targets.length > 0 && targets.length <= 2;
  return fits ? { sentence, targets, reason: 'new' as const } : undefined;
}

/**
 * With room left under the new-item caps (L6), a second sentence for the session's new words,
 * using no other unknown word, so a few new words get more practice instead of more new words.
 */
export function practiseAgain(
  cards: readonly SessionCard[],
  sentences: readonly Sentence[],
  levels: WordLevels,
  room: number,
): SessionCard[] {
  const allowed = newWords(cards, levels);
  const used = new Set(cards.map((c) => c.sentence.id));
  const extra: SessionCard[] = [];
  for (const sentence of sentences) {
    if (extra.length >= room) break;
    const card = used.has(sentence.id) ? undefined : againCard(sentence, levels, allowed);
    if (card) extra.push(card);
    used.add(sentence.id);
  }
  return [...cards, ...extra];
}

/** An introduction, drill or question cannot end a session; a reading card or a passage can. */
function loose(card: SessionCard | undefined): boolean {
  return card !== undefined && !card.passage && (card.reason === 'drill' || !!card.grammarIntro);
}

/**
 * The mixed session cut from the end to about `minutes` (L6, R13), keeping a unit's passage
 * last. An introduction or exercise left at the end goes too, since nothing follows it.
 */
export function fitMinutes(cards: readonly SessionCard[], minutes: SessionMinutes): SessionCard[] {
  const last = cards.at(-1);
  const tail = last?.passage ? last : undefined;
  const body = tail ? cards.slice(0, -1) : [...cards];
  const all = () => (tail ? [...body, tail] : body);
  while (body.length > 1 && sessionSeconds(all()) > minutes * 60) body.pop();
  while (body.length > 1 && loose(body.at(-1))) body.pop();
  return all();
}
