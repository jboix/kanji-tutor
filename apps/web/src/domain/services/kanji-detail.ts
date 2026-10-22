/**
 * The kanji page (K3): how well each reading is read, the words that prove it, the sound
 * family, and where the kanji was first met.
 */
import { isoWeek, itemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import type { Item, Kanji, KanjiReading, KnowledgeLevel, Review, Source, Word } from '../types.ts';
import { DAY_MS } from './items.ts';
import { kanjiOf } from './kanji-readings.ts';

export interface ReadingRow {
  /** As stored: "セイ" or "い.きる". */
  reading: string;
  /** As shown: on in katakana, kun with ・ before okurigana ("い・きる"). */
  label: string;
  level: KnowledgeLevel;
  /** Recent answers on its words were missed more often than not. */
  misread: boolean;
  /** A word proving it was added this week. */
  newThisWeek: boolean;
  /** Written forms of up to three words that prove it. */
  examples: string[];
  /** The JMdict ids of `examples`, in the same order (U5: each example opens its word sheet). */
  exampleIds: string[];
  wordIds: string[];
}

export interface FamilyMember {
  char: string;
  /** Some reading of it is read in familiar words (level 3 or more). */
  known: boolean;
}

export interface KanjiDetail {
  kanji: Kanji;
  rows: ReadingRow[];
  /** Dictionary readings no word of yours proves yet. */
  unmet: string[];
  /** Your words containing the kanji. */
  wordCount: number;
  /** Source of the earliest of those words. */
  since?: Source;
  family?: { sound: string; members: FamilyMember[] };
}

const MISREAD_WINDOW_MS = 30 * DAY_MS;
const EXAMPLES = 3;

/** On readings stay katakana; kun readings show okurigana after ・ (D12). */
export function readingLabel(reading: string): string {
  return reading.replaceAll('.', '・');
}

function isMisread(reviews: readonly Review[]): boolean {
  const misses = reviews.filter((r) => r.verdict !== 'correct').length;
  return misses >= 2 && misses >= reviews.length - misses;
}

interface Context {
  items: Map<string, Item>;
  words: Map<string, Word>;
  reviews: Map<string, Review[]>;
  week: string;
}

/** Added this week by the learner; imported known words are not news. */
function isNewThisWeek(item: Item | undefined, week: string): boolean {
  return item !== undefined && item.source.week === week && item.source.kind !== 'import';
}

function toRow(row: KanjiReading, ctx: Context): ReadingRow {
  const reviews = row.wordIds.flatMap((id) => ctx.reviews.get(id) ?? []);
  const shown = row.wordIds.slice(0, EXAMPLES).flatMap((id) => {
    const form = ctx.words.get(id)?.forms[0];
    return form ? [{ id, form }] : [];
  });
  return {
    reading: row.reading,
    label: readingLabel(row.reading),
    level: row.level,
    misread: isMisread(reviews),
    newThisWeek: row.wordIds.some((id) => isNewThisWeek(ctx.items.get(id), ctx.week)),
    examples: shown.map((s) => s.form),
    exampleIds: shown.map((s) => s.id),
    wordIds: row.wordIds,
  };
}

async function loadContext(repos: Repos, rows: readonly KanjiReading[], now: number) {
  const ids = [...new Set(rows.flatMap((row) => row.wordIds))];
  const items = (await repos.items.getMany(ids.map((id) => itemId('word', id)))).flatMap((item) =>
    item ? [item] : [],
  );
  const words = (await repos.dictionary.words(ids)).flatMap((word) => (word ? [word] : []));
  const lists = await Promise.all(ids.map((id) => repos.reviews.byItem(itemId('word', id))));
  const since = now - MISREAD_WINDOW_MS;
  return {
    items: new Map(items.map((item) => [item.ref, item])),
    words: new Map(words.map((word) => [word.id, word])),
    reviews: new Map(ids.map((id, i) => [id, (lists[i] ?? []).filter((r) => r.at >= since)])),
    week: isoWeek(new Date(now)),
  };
}

function earliest(items: Iterable<Item>): Source | undefined {
  let first: Source | undefined;
  for (const { source } of items) if (!first || source.addedAt < first.addedAt) first = source;
  return first;
}

/** The on reading most of the family shares (セイ for 生 性 星 姓). */
function sharedSound(kanji: Kanji, members: readonly Kanji[]): string | undefined {
  const score = (on: string) => members.filter((m) => m.on.includes(on)).length;
  return [...kanji.on].sort((a, b) => score(b) - score(a))[0];
}

async function familyOf(repos: Repos, kanji: Kanji): Promise<KanjiDetail['family']> {
  const base = kanji.phonetic ?? kanji.char;
  const found = await repos.dictionary.kanjiByPhonetic(base);
  const extra = base === kanji.char ? [] : [await repos.dictionary.kanji(base)];
  const members = [...found, ...extra].flatMap((m) => (m && m.char !== kanji.char ? [m] : []));
  const sound = sharedSound(kanji, members);
  if (members.length === 0 || sound === undefined) return undefined;
  const known = await Promise.all(
    members.map(async (m) => (await repos.kanjiReadings.byKanji(m.char)).some((r) => r.level >= 3)),
  );
  return { sound, members: members.map((m, i) => ({ char: m.char, known: known[i] ?? false })) };
}

function byLevel(a: ReadingRow, b: ReadingRow): number {
  return b.level - a.level || b.wordIds.length - a.wordIds.length;
}

/** Everything the kanji page shows for one character, or undefined when it is not in KANJIDIC. */
export async function kanjiDetail(
  repos: Repos,
  char: string,
  now: number,
): Promise<KanjiDetail | undefined> {
  const kanji = await repos.dictionary.kanji(char);
  if (!kanji) return undefined;
  const rows = (await repos.kanjiReadings.byKanji(char)).filter((row) => row.wordIds.length > 0);
  const ctx = await loadContext(repos, rows, now);
  const proven = new Set(rows.map((row) => row.reading));
  const detail: KanjiDetail = {
    kanji,
    rows: rows.map((row) => toRow(row, ctx)).sort(byLevel),
    unmet: [...kanji.on, ...kanji.kun].filter((r) => !proven.has(r)).map(readingLabel),
    wordCount: ctx.items.size,
  };
  const since = earliest(ctx.items.values());
  const family = await familyOf(repos, kanji);
  if (since) detail.since = since;
  if (family) detail.family = family;
  return detail;
}

/** Kanji of words answered in the last week, then of words added this week (not imported). */
export async function recentKanji(repos: Repos, now: number, limit = 24): Promise<string[]> {
  const week = await repos.items.byWeek(isoWeek(new Date(now)));
  const reviews = (await repos.reviews.since(now - 7 * DAY_MS)).sort((a, b) => b.at - a.at);
  const refs = [
    ...reviews.flatMap((r) => (r.itemId.startsWith('word:') ? [r.itemId.slice(5)] : [])),
    ...week.filter((i) => i.kind === 'word' && i.source.kind !== 'import').map((i) => i.ref),
  ];
  const words = await repos.dictionary.words([...new Set(refs)]);
  const chars = words.flatMap((word) => (word ? kanjiOf(word) : []));
  return [...new Set(chars)].slice(0, limit);
}
