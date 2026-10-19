/**
 * Mixes drills (R8) into a session (BUILD-PLAN Wave 4): how many comes from `drillShare`, which
 * kinds and pairs first from the learner's mistakes of the last two weeks and the accepted plan,
 * so the plan and the mistakes change what is drilled.
 */
import {
  type Drill,
  drillCount,
  drillKinds,
  type MistakeSignals,
  type ReadingDrillKind,
} from '../drills/index.ts';
import { parseItemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import type { ErrorType, Review, Sentence, SessionMix, Token } from '../types.ts';
import {
  clozeProducer,
  type DrillSource,
  familyProducer,
  lookalikeProducer,
  type Producer,
  readingsProducer,
} from './drill-sources.ts';
import { DAY_MS } from './items.ts';
import { kanjiOf } from './kanji-readings.ts';
import type { Pool } from './session-pool.ts';

/** Mistakes older than this no longer steer drills. */
const MISTAKE_WINDOW_MS = 14 * DAY_MS;
/** Kanji drills are built around, at most. */
const DRILL_KANJI = 16;

export interface MixOptions {
  now: number;
  /** Share of the session's cards that should be drills (0–0.5). */
  share: number;
  pool: Pool;
  /** The pool sentences that passed the reading checks. */
  sentences: readonly Sentence[];
  /** Sentence ids read in the last two days. */
  recent: readonly string[];
  mix: SessionMix | undefined;
}

const isMiss = (review: Review) => review.verdict !== 'correct' && review.errorType !== undefined;
const isCloze = (review: Review) =>
  review.mode === 'drill' && parseItemId(review.itemId).kind === 'grammar';

/** What the learner missed recently and what the plan asks for (see `drillKinds`). */
export function mistakeSignals(reviews: readonly Review[], mix?: SessionMix): MistakeSignals {
  const errors: Partial<Record<ErrorType, number>> = {};
  for (const review of reviews.filter(isMiss)) {
    const type = review.errorType ?? 'other';
    errors[type] = (errors[type] ?? 0) + 1;
  }
  return {
    errors,
    clozeMisses: reviews.filter((r) => isCloze(r) && r.verdict === 'wrong').length,
    focus: mix?.focusErrorTypes ?? {},
    grammarFocus: (mix?.grammarIds.length ?? 0) > 0,
  };
}

/** Words of recently missed answers first, then of other recent answers, then the session's. */
function drillWords(reviews: readonly Review[], cards: readonly SessionCard[]): string[] {
  const ref = (r: Review) => parseItemId(r.itemId);
  const words = (list: readonly Review[]) =>
    list.flatMap((r) => (ref(r).kind === 'word' ? [ref(r).ref] : []));
  const ids = [
    ...words(reviews.filter(isMiss)),
    ...words(reviews),
    ...cards.flatMap((card) => card.targets.map((t) => t.wordId)),
  ];
  return [...new Set(ids)];
}

async function drillKanji(repos: Repos, wordIds: readonly string[]) {
  const entries = await repos.dictionary.words(wordIds);
  const chars = entries.flatMap((word) => (word ? kanjiOf(word) : []));
  return [...new Set(chars)].slice(0, DRILL_KANJI);
}

/** A word list the read screen can render for drills without a sentence (学生、生きる). */
function wordList(
  id: string,
  parts: readonly { form: string; reading: string; wordId?: string }[],
) {
  let start = 0;
  const tokens = parts.flatMap(({ form, reading, wordId }, i): Token[] => {
    const word: Token = { surface: form, reading, base: form, pos: 'noun', start };
    if (wordId !== undefined) word.wordId = wordId;
    start += form.length;
    if (i === parts.length - 1) return [word];
    const comma: Token = { surface: '、', reading: '、', base: '、', pos: 'symbol', start };
    start += 1;
    return [word, comma];
  });
  const text = tokens.map((t) => t.surface).join('');
  const wordIds = parts.flatMap((p) => p.wordId ?? []);
  const sentence: Sentence = { id, text, source: 'tatoeba', tokens, wordIds, verified: true };
  return sentence;
}

/** A one-word "sentence" for a drill on a word with no sentence of its own. */
const oneWord = (id: string, form: string, reading: string, wordId?: string) =>
  wordList(id, [{ form, reading, ...(wordId ? { wordId } : {}) }]);

function drillSentence(drill: Drill): Sentence {
  if ('sentence' in drill) return drill.sentence;
  if (drill.kind === 'readings') {
    const parts = drill.items.map((i) => ({
      form: i.form,
      reading: i.readings[0] ?? '',
      wordId: i.wordId,
    }));
    return wordList(`drill:readings:${drill.kanji}`, parts);
  }
  if (drill.kind === 'family') {
    return oneWord(`drill:family:${drill.guess}`, drill.guess, drill.accepted[0] ?? '');
  }
  if (drill.kind === 'meaning') {
    return oneWord(
      `drill:meaning:${drill.wordId}`,
      drill.word.written,
      drill.word.reading,
      drill.wordId,
    );
  }
  const { cue } = drill;
  const wordId = drill.kind === 'conjugation' ? drill.wordId : drill.cue.wordId;
  return oneWord(`drill:${drill.kind}:${cue.written}`, cue.written, cue.reading, wordId);
}

/** A session card carrying a drill: no reading targets, reason 'drill'. */
export function drillCard(drill: Drill): SessionCard {
  return { sentence: drillSentence(drill), targets: [], reason: 'drill', drill };
}

const PRODUCERS: Record<ReadingDrillKind, (src: DrillSource) => Producer> = {
  lookalike: lookalikeProducer,
  readings: readingsProducer,
  family: familyProducer,
  cloze: clozeProducer,
};

/** Drill sentences are not used twice in a session. */
function claim(src: DrillSource, drill: Drill): void {
  if (drill.kind === 'lookalike' || drill.kind === 'cloze') src.exclude.add(drill.sentence.id);
}

/** Drills in turn over the kinds (most relevant first), dropping a kind once it runs out. */
async function collect(src: DrillSource, kinds: readonly ReadingDrillKind[], count: number) {
  const active = kinds.map((kind) => PRODUCERS[kind](src));
  const drills: Drill[] = [];
  let turn = 0;
  while (drills.length < count && active.length > 0) {
    const at = turn % active.length;
    const drill = await active[at]?.();
    if (!drill) {
      active.splice(at, 1);
      continue;
    }
    claim(src, drill);
    drills.push(drill);
    turn += 1;
  }
  return drills;
}

/** Grammar points whose FSRS card is due: reviewed through cloze drills, soonest first. */
async function dueGrammar(repos: Repos, now: number): Promise<string[]> {
  const due = await repos.items.dueBefore(now);
  return due.filter((item) => item.kind === 'grammar').map((item) => item.ref);
}

function grammarFocus(reviews: readonly Review[], mix: SessionMix | undefined, due: string[]) {
  const missed = reviews.filter((r) => isCloze(r) && r.verdict === 'wrong');
  const ids = [...(mix?.grammarIds ?? []), ...missed.map((r) => parseItemId(r.itemId).ref), ...due];
  return [...new Set(ids)];
}

async function sourceFor(repos: Repos, cards: readonly SessionCard[], options: MixOptions) {
  const reviews = (await repos.reviews.since(options.now - MISTAKE_WINDOW_MS)).sort(
    (a, b) => b.at - a.at,
  );
  const exclude = new Set([...cards.map((c) => c.sentence.id), ...options.recent]);
  const words = drillWords(reviews, cards);
  const due = await dueGrammar(repos, options.now);
  const src: DrillSource = {
    repos,
    levels: options.pool.levels,
    reviews,
    exclude,
    words,
    targets: new Set(cards.flatMap((c) => c.targets.map((t) => t.wordId))),
    kanji: await drillKanji(repos, words),
    pool: options.sentences.filter((s) => !exclude.has(s.id)),
    grammarFocus: grammarFocus(reviews, options.mix, due),
    grammarDue: due.length > 0,
    seed: String(Math.floor(options.now / DAY_MS)),
    gate: options.pool.gate,
  };
  return src;
}

/**
 * The drill cards for a session's reading cards (R8): `drillCount` of them for the share. Kinds
 * come in the order `drillKinds` gives for the recent mistakes and the plan, lookalike pairs the
 * learner swapped come first, and grammar the plan or recent cloze misses name is asked first,
 * then grammar points that are due (their FSRS review is the cloze answer, see
 * `recordDrillChoice`); due grammar also raises cloze among the kinds. Every drill sentence
 * passes the session's reading checks and level gate (G3). The variety mixer places them (V2).
 * Deterministic for the same data and day.
 */
export async function makeDrills(
  repos: Repos,
  cards: readonly SessionCard[],
  options: MixOptions,
): Promise<SessionCard[]> {
  const count = drillCount(cards.length, options.share);
  if (count === 0) return [];
  const src = await sourceFor(repos, cards, options);
  const signals = mistakeSignals(src.reviews, options.mix);
  const kinds = drillKinds({ ...signals, grammarFocus: signals.grammarFocus || src.grammarDue });
  const drills = await collect(src, kinds, count);
  return drills.map(drillCard);
}
