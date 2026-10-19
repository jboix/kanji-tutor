/**
 * What each drill kind is built from (R8), loaded over the `Repos` port: the pairs the learner
 * swapped, lookalikes among known kanji, derived readings (K3), phonetic families, and the
 * learner's grammar points. Each producer returns the next drill of its kind, or undefined.
 */
import {
  clozeDrill,
  type Drill,
  familyDrill,
  lookalikeDrill,
  readingsDrill,
} from '../drills/index.ts';
import type { Repos } from '../repos.ts';
import type { Kanji, KanjiReading, KnowledgeLevel, Review, Sentence, Word } from '../types.ts';
import { lessonGrammar } from './grammar.ts';
import { gateSentences, type LevelGate } from './level-gate.ts';
import { lookalikePairs, type PairCandidate } from './lookalike-pairs.ts';
import { trustedSentences } from './sentence-trust.ts';

/** Everything the producers share for one session. */
export interface DrillSource {
  repos: Repos;
  levels: ReadonlyMap<string, KnowledgeLevel>;
  /** Reviews of the last two weeks, newest first. */
  reviews: readonly Review[];
  /** Sentence ids not to use: the session's, those read in the last two days, earlier drills'. */
  exclude: Set<string>;
  /** Words to build drills around, most relevant first (recent mistakes, then the session). */
  words: readonly string[];
  /** The session's reading targets: not asked again in a drill. */
  targets: ReadonlySet<string>;
  /** Kanji of `words`, in the same order. */
  kanji: readonly string[];
  /** Spare session sentences that already passed the reading checks. */
  pool: readonly Sentence[];
  /** Grammar ids to drill first: the plan's, recent cloze misses, then due grammar points. */
  grammarFocus: readonly string[];
  /** Some grammar point's FSRS card is due, so cloze comes earlier among the kinds. */
  grammarDue: boolean;
  seed: string;
  /** The session's level gate (G3): drill sentences pass it too. */
  gate?: LevelGate;
}

export type Producer = () => Promise<Drill | undefined>;

/** Sentences fetched per word when looking for a lookalike sentence. */
const SENTENCES_PER_WORD = 20;
/** Words whose sentences are searched per lookalike pair. */
const WORDS_PER_PAIR = 3;

async function freshTrusted(src: DrillSource, sentences: readonly Sentence[]) {
  const byId = new Map(sentences.map((s) => [s.id, s]));
  const fresh = [...byId.values()].filter((s) => s.verified && !src.exclude.has(s.id));
  const gated = src.gate ? await gateSentences(src.repos, src.gate, fresh, src.levels) : fresh;
  return trustedSentences(src.repos, gated, src.levels);
}

async function sentencesWith(src: DrillSource, wordIds: readonly string[]) {
  const lists = await Promise.all(
    wordIds.map(async (id) =>
      src.gate
        ? src.repos.sentences.containingWord(id, {
            maxLevel: src.gate.level,
            limit: SENTENCES_PER_WORD,
          })
        : (await src.repos.sentences.containingWord(id)).slice(0, SENTENCES_PER_WORD),
    ),
  );
  return lists.flat();
}

/** Known words proving a reading of the kanji (K3), then the words a swap happened in. */
async function pairWords(src: DrillSource, pair: PairCandidate) {
  const rows = await src.repos.kanjiReadings.byKanji(pair.kanji.char);
  const proving = rows.filter((r) => r.level >= 3).flatMap((r) => r.wordIds);
  return [...new Set([...pair.wordIds, ...proving])].slice(0, WORDS_PER_PAIR + pair.wordIds.length);
}

/** The first value from `next` that `make` turns into a drill; values tried are used up. */
async function firstDrill<T>(
  next: () => T | undefined | Promise<T | undefined>,
  make: (value: T) => Promise<Drill | undefined>,
): Promise<Drill | undefined> {
  for (let value = await next(); value !== undefined; value = await next()) {
    const drill = await make(value);
    if (drill) return drill;
  }
  return undefined;
}

async function lookalikeFor(src: DrillSource, pair: PairCandidate) {
  const fetched = await sentencesWith(src, await pairWords(src, pair));
  const sentences = await freshTrusted(src, [...fetched, ...src.pool]);
  return lookalikeDrill({ pairs: [pair], sentences, levels: src.levels, seed: src.seed });
}

/**
 * Lookalike drills: confused pairs first, then lookalike shapes among known kanji. A kanji is
 * blanked at most once per session.
 */
export function lookalikeProducer(src: DrillSource): Producer {
  let pairs: PairCandidate[] | undefined;
  const blanked = new Set<string>();
  const next = async () => {
    pairs ??= await lookalikePairs(src.repos, src.reviews, src.kanji);
    pairs = pairs.filter((pair) => !blanked.has(pair.kanji.char));
    return pairs.shift();
  };
  const make = async (pair: PairCandidate) => {
    const drill = await lookalikeFor(src, pair);
    if (drill) blanked.add(drill.answer);
    return drill;
  };
  return () => firstDrill(next, make);
}

async function readingsFor(src: DrillSource, char: string) {
  const rows = (await src.repos.kanjiReadings.byKanji(char)).map((r) => ({
    ...r,
    wordIds: r.wordIds.filter((id) => !src.targets.has(id)),
  }));
  const ids = [...new Set(rows.flatMap((r) => r.wordIds))];
  const entries = await src.repos.dictionary.words(ids);
  const words = new Map(entries.flatMap((w): [string, Word][] => (w ? [[w.id, w]] : [])));
  return readingsDrill({ kanji: char, rows, words, levels: src.levels, seed: src.seed });
}

/** Kanji tried in turn, each at most once per session. */
function cursor(src: DrillSource) {
  const queue = [...src.kanji];
  return () => queue.shift();
}

/** One kanji, many readings: kanji of recent mistakes first, then of the session's words. */
export function readingsProducer(src: DrillSource): Producer {
  const next = cursor(src);
  return () => firstDrill(next, (char) => readingsFor(src, char));
}

const KATAKANA = /^[ァ-ヺー]+$/u;

/** On'yomi each kanji is read with at level 3 or more (K3). */
async function knownOn(repos: Repos, members: readonly Kanji[]) {
  const rows = await Promise.all(members.map((m) => repos.kanjiReadings.byKanji(m.char)));
  const known = (list: readonly KanjiReading[] | undefined) =>
    new Set(
      (list ?? []).filter((r) => r.level >= 3 && KATAKANA.test(r.reading)).map((r) => r.reading),
    );
  return new Map(members.map((m, i) => [m.char, known(rows[i])]));
}

async function familyMembers(repos: Repos, part: string): Promise<Kanji[]> {
  const found = await repos.dictionary.kanjiByPhonetic(part);
  const base = found.some((k) => k.char === part) ? undefined : await repos.dictionary.kanji(part);
  return base && found.length > 0 ? [...found, base] : found;
}

async function familyFor(src: DrillSource, part: string) {
  const members = await familyMembers(src.repos, part);
  if (members.length < 3) return undefined;
  const known = await knownOn(src.repos, members);
  const unread = members.filter((m) => (known.get(m.char)?.size ?? 0) === 0);
  const solo = new Map(
    await Promise.all(
      unread.map(async (m) => [m.char, await src.repos.dictionary.wordsByText(m.char)] as const),
    ),
  );
  return familyDrill({ part, members, knownOn: known, solo, seed: src.seed });
}

/** The next phonetic part not tried yet: a kanji's phonetic, or the kanji itself (青). */
function partCursor(src: DrillSource) {
  const next = cursor(src);
  const tried = new Set<string>();
  const part = async (char: string) => (await src.repos.dictionary.kanji(char))?.phonetic ?? char;
  return async () => {
    for (let char = next(); char !== undefined; char = next()) {
      const found = await part(char);
      if (tried.has(found)) continue;
      tried.add(found);
      return found;
    }
    return undefined;
  };
}

/** Same part, same sound: the phonetic families of the session's kanji, each at most once. */
export function familyProducer(src: DrillSource): Producer {
  const next = partCursor(src);
  return () => firstDrill(next, (part) => familyFor(src, part));
}

/** Words whose sentences are searched for a cloze, besides the learner's own sentences. */
const CLOZE_WORDS = 10;

async function clozeSentences(src: DrillSource, examples: readonly string[]) {
  const stored = (await src.repos.sentences.getMany(examples)).flatMap((s) => (s ? [s] : []));
  const own = [
    ...(await src.repos.sentences.bySource('compose')),
    ...(await src.repos.sentences.bySource('capture')),
  ];
  const read = await sentencesWith(src, src.words.slice(0, CLOZE_WORDS));
  return freshTrusted(src, [...stored, ...own, ...read, ...src.pool]);
}

/** The current lesson's grammar points plus the focus ones (plan, misses, due) from any lesson. */
async function clozePoints(src: DrillSource) {
  const lesson = await lessonGrammar(src.repos);
  const ids = new Set(lesson.map((p) => p.id));
  const focus = await src.repos.grammar.getMany(src.grammarFocus.filter((id) => !ids.has(id)));
  return [...lesson, ...focus.flatMap((p) => (p ? [p] : []))];
}

/** Grammar cloze over the learner's grammar points (see `clozePoints`), each at most once. */
export function clozeProducer(src: DrillSource): Producer {
  const asked = new Set<string>();
  return async () => {
    const points = await clozePoints(src);
    if (points.length < 2) return undefined;
    const sentences = await clozeSentences(
      src,
      points.flatMap((p) => p.exampleSentenceIds),
    );
    const input = { points, prefer: src.grammarFocus, exclude: asked, sentences };
    const drill = clozeDrill({ ...input, levels: src.levels, seed: src.seed });
    if (drill) asked.add(drill.grammarId);
    return drill;
  };
}
