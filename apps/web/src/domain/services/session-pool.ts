/**
 * Loads what a session is built from: levels of tracked words, the due and fresh queue, and the
 * candidate sentences for it, fetched per target word with the level-gated `levelKeys` queries
 * (G3), so 45,000 sentences are never all loaded.
 */
import { isoWeek } from '../ids.ts';
import { hasKanji } from '../kana.ts';
import type { Repos } from '../repos.ts';
import { KNOWN_LEVEL, unknownTokens } from '../selector.ts';
import type { Item, KnowledgeLevel, Sentence, SourceKind } from '../types.ts';
import { DAY_MS, newWordItem } from './items.ts';
import { type LessonPlan, lessonPlan } from './lesson-plan.ts';
import { gateSentences, type LevelGate, maxLevelFor } from './level-gate.ts';
import { ownPriority } from './own-sentences.ts';

/** A kanji reading to practise, from the kanji page ("Read 5 sentences with ショウ"). */
export interface SessionFocus {
  kanji: string;
  /** As stored in KANJIDIC style: "ショウ" or "い.きる". */
  reading: string;
}

export interface Pool {
  levels: Map<string, KnowledgeLevel>;
  due: Item[];
  fresh: Item[];
  /** Words of the learner's own new sentences, queued first (see `ownPriority`). */
  priority: Item[];
  /** Ids of those own sentences and of the unit's sentences, preferred for their words. */
  preferred: string[];
  sentences: Sentence[];
  /** What the session may show (G3). */
  gate: LevelGate;
  /** Today's lesson: the unit, its grammar and new words (T3, V1). */
  plan: LessonPlan;
}

export interface PoolOptions {
  now: number;
  size: number;
  focus?: SessionFocus | undefined;
  /** A unit to practise instead of the path's current one. */
  unit?: string | undefined;
}

/** Sentences fetched per queued word; enough to choose from, bounded for very common words. */
const SENTENCES_PER_WORD = 30;
/** Known words whose sentences are searched for one new word each, when the queue is short. */
const DISCOVERY_WORDS = 150;
/** Sentences per known word searched, so new words come from many different contexts. */
const DISCOVERY_SENTENCES = 3;
/** Sentences per seed word searched for one whose only unknown word is that word. */
const SEED_SENTENCES = 12;

/** FNV-1a hash, for a deterministic daily order. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

function dailyOrder<T>(values: readonly T[], key: (value: T) => string, now: number): T[] {
  const day = String(Math.floor(now / DAY_MS));
  return [...values].sort((a, b) => hash(key(a) + day) - hash(key(b) + day));
}

/** What fetching is gated by: the level gate and the learner's word levels. */
interface Gating {
  gate: LevelGate;
  levels: ReadonlyMap<string, KnowledgeLevel>;
}

/**
 * Levelled sentences of each word at or below its gate level, easiest first, whose new words
 * pass the gate too (G3).
 */
async function sentencesFor(
  repos: Repos,
  { gate, levels }: Gating,
  wordIds: readonly string[],
  limit = SENTENCES_PER_WORD,
): Promise<Sentence[]> {
  const lists = await Promise.all(
    wordIds.map((id) =>
      repos.sentences.containingWord(id, { maxLevel: maxLevelFor(gate, id), limit }),
    ),
  );
  const byId = new Map(lists.flat().map((sentence) => [sentence.id, sentence]));
  const verified = [...byId.values()].filter((sentence) => sentence.verified);
  return gateSentences(repos, gate, verified, levels);
}

async function focusQueue(repos: Repos, focus: SessionFocus): Promise<Item[]> {
  const row = await repos.kanjiReadings.get(`${focus.kanji}:${focus.reading}`);
  const ids = (row?.wordIds ?? []).map((id) => `word:${id}` as const);
  return (await repos.items.getMany(ids)).flatMap((item) => (item ? [item] : []));
}

/** Words met in a session or imported come back through FSRS, not as this week's new words. */
const NOT_FRESH: ReadonlySet<SourceKind> = new Set(['session', 'import']);

/** The class lesson's new items, else this week's, then the lesson plan's new words. */
async function freshQueue(repos: Repos, plan: LessonPlan, now: number): Promise<Item[]> {
  const { currentLesson } = await repos.settings.get();
  const items = currentLesson
    ? await repos.items.byLesson(currentLesson)
    : await repos.items.byWeek(isoWeek(new Date(now)));
  const added = items.filter(
    (item) => item.kind === 'word' && item.level <= 2 && !NOT_FRESH.has(item.source.kind),
  );
  const planned = plan.fresh.map((wordId) => newWordItem({ wordId, kind: 'session', now }));
  return [...added, ...planned];
}

async function dueQueue(repos: Repos, now: number): Promise<Item[]> {
  return (await repos.items.dueBefore(now)).filter((item) => item.kind === 'word');
}

/** Word ids with kanji forms only: kana words are never targets. */
async function withKanji(repos: Repos, items: readonly Item[]): Promise<Item[]> {
  const words = await repos.dictionary.words(items.map((item) => item.ref));
  return items.filter((_, i) => words[i]?.forms.some(hasKanji) ?? false);
}

/** Untracked words that are the only unknown word of a sentence; tracked ones wait for FSRS. */
function discover(pool: Pool, extra: readonly Sentence[], items: Map<string, Item>, now: number) {
  const found = new Map<string, Item>();
  for (const sentence of extra) {
    const unknown = unknownTokens(sentence, pool.levels);
    const wordId = unknown.length === 1 ? sentence.tokens[unknown[0] ?? -1]?.wordId : undefined;
    if (wordId === undefined || items.has(wordId) || found.has(wordId)) continue;
    found.set(wordId, newWordItem({ wordId, kind: 'session', now }));
  }
  return [...found.values()];
}

/** Untracked words of the learner's level searched when few words are known (P1). */
const SEED_WORDS = 60;

/**
 * Sentences whose only unknown word is an untracked word of the learner's level, searched when
 * few words are known: a learner starting from zero (P1) meets N5 words in sentences where
 * everything else is kana.
 */
async function levelSeedSentences(repos: Repos, pool: Pool, now: number, known: number) {
  const { dictionary } = repos;
  if (known >= DISCOVERY_WORDS || !dictionary.wordsByJlpt) return [];
  const words = await dictionary.wordsByJlpt(pool.gate.level);
  const fresh = words.filter((w) => !pool.levels.has(w.id) && w.forms.some(hasKanji));
  const ids = dailyOrder(fresh, (w) => w.id, now)
    .slice(0, SEED_WORDS)
    .map((w) => w.id);
  const sentences = await sentencesFor(repos, pool, ids, SEED_SENTENCES);
  const single = sentences.filter((s) => unknownTokens(s, pool.levels).length === 1);
  return single.slice(0, SEED_WORDS * DISCOVERY_SENTENCES);
}

function addSentences(pool: Pool, sentences: readonly Sentence[]): void {
  const seen = new Set(pool.sentences.map((sentence) => sentence.id));
  pool.sentences.push(...sentences.filter((sentence) => !seen.has(sentence.id)));
}

async function addDiscoveries(repos: Repos, pool: Pool, items: Map<string, Item>, now: number) {
  const known = [...items.values()].filter((item) => item.level >= KNOWN_LEVEL);
  const sample = dailyOrder(known, (item) => item.ref, now).slice(0, DISCOVERY_WORDS);
  const ids = sample.map((item) => item.ref);
  const lists = [
    ...(await sentencesFor(repos, pool, ids, DISCOVERY_SENTENCES)),
    ...(await levelSeedSentences(repos, pool, now, sample.length)),
  ];
  const extra = [...new Map(lists.map((sentence) => [sentence.id, sentence])).values()];
  pool.fresh.push(...discover(pool, extra, items, now));
  addSentences(pool, extra);
}

/** Queues the words of the learner's own new sentences first and adds those that pass the gate. */
async function addOwn(repos: Repos, pool: Pool, items: Map<string, Item>, now: number) {
  const own = await ownPriority(repos, { items, levels: pool.levels, now });
  const fits = new Set(
    (await gateSentences(repos, pool.gate, own.sentences, pool.levels)).map((s) => s.id),
  );
  const kept = own.sentences.filter((s) => fits.has(s.id));
  const words = new Set(kept.flatMap((s) => s.wordIds));
  pool.priority = own.items.filter((item) => words.has(item.ref));
  pool.preferred = kept.map((sentence) => sentence.id);
  addSentences(pool, kept);
}

/** The unit's passage lines and tagged sentences that pass the gate, preferred for their words. */
async function addUnitSentences(repos: Repos, pool: Pool) {
  const stored = await repos.sentences.getMany(pool.plan.preferred);
  const found = stored.flatMap((s) => (s?.verified ? [s] : []));
  const kept = await gateSentences(repos, pool.gate, found, pool.levels);
  pool.preferred.push(...kept.map((s) => s.id));
  addSentences(pool, kept);
}

async function queues(repos: Repos, plan: LessonPlan, options: PoolOptions) {
  const { focus, now } = options;
  const due = await withKanji(
    repos,
    focus ? await focusQueue(repos, focus) : await dueQueue(repos, now),
  );
  const fresh = focus ? [] : await withKanji(repos, await freshQueue(repos, plan, now));
  return { due, fresh };
}

/**
 * Everything a session draws from, gated at the learner's level (G3). With a focus, only the
 * words proving that kanji reading are queued; otherwise the learner's own new sentences first
 * (capture, Use it, AI), then due words, the class lesson's (or this week's) new words, the
 * current unit's and cluster's new words (T3, V1), then, when those do not fill `size`, new
 * words that are the only unknown word of a sentence (i+1).
 */
export async function loadPool(repos: Repos, options: PoolOptions): Promise<Pool> {
  const { now, size, focus } = options;
  const all = await repos.items.byKind('word');
  const items = new Map(all.map((item) => [item.ref, item]));
  const levels = new Map(all.map((item) => [item.ref, item.level]));
  const plan = await lessonPlan(repos, { now, unit: options.unit, levels });
  const { due, fresh } = await queues(repos, plan, options);
  const queue = [...new Set([...due, ...fresh].map((item) => item.ref))].slice(0, size * 3);
  const sentences = await sentencesFor(repos, { gate: plan.gate, levels }, queue);
  const pool: Pool = {
    levels,
    due,
    fresh,
    priority: [],
    preferred: [],
    sentences,
    gate: plan.gate,
    plan,
  };
  if (focus) return pool;
  await addOwn(repos, pool, items, now);
  await addUnitSentences(repos, pool);
  if (due.length + fresh.length < size) await addDiscoveries(repos, pool, items, now);
  return pool;
}
