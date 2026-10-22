/**
 * Bulk import of words the learner already knows (K6, D14): the approximate JLPT N5/N4 lists,
 * Minna no Nihongo lessons mapped to those lists, and a pasted word list, all at level 3.
 */
import { hasKanji } from '../kana.ts';
import type { DictionaryRepo, Repos } from '../repos.ts';
import { newCard, reviewCard } from '../scheduler.ts';
import type { Item, Word } from '../types.ts';
import { DAY_MS, newWordItem } from './items.ts';
import { rebuildKanjiReadings } from './kanji-readings.ts';
import { levelAfterLists, raiseLearnerLevel } from './learner-level.ts';

export type JlptList = 'n5' | 'n4';

export interface ImportKnownOptions {
  lists?: readonly JlptList[];
  /** Minna no Nihongo lessons 1 to n (D14: ≤ 25 ≈ N5, 26–50 ≈ N5 + N4). */
  minnaUpTo?: number;
  /** One word per line, kanji or kana. */
  pasted?: string;
  /** Lesson tag for the pasted words, e.g. "Minna 第12課". */
  lesson?: string;
  now: number;
  /** Looks a pasted line up (e.g. `lang.lookupWord`, which also takes romaji). */
  lookup?: (line: string) => Promise<Word[]>;
  onProgress?: (done: number, total: number) => void;
}

export interface ImportKnownResult {
  /** Words newly marked as known, or raised to level 3. */
  marked: number;
  /** Words that were already known (level 3 or more). */
  already: number;
  /** Pasted lines that matched no dictionary word. */
  notFound: string[];
}

const LEVEL_OF: Record<JlptList, 5 | 4> = { n5: 5, n4: 4 };

/** Every hiragana and katakana a reading can start with, for scanning without a JLPT index. */
const INITIALS = [
  ...Array.from({ length: 0x3096 - 0x3041 + 1 }, (_, i) => String.fromCharCode(0x3041 + i)),
  ...Array.from({ length: 0x30fa - 0x30a1 + 1 }, (_, i) => String.fromCharCode(0x30a1 + i)),
];
const SCAN_LIMIT = 100_000;

/**
 * Words on a JLPT list. Uses the optional `wordsByJlpt` index when the dictionary has one,
 * otherwise scans by reading prefix (a one-off cost of reading every word once or twice).
 */
export async function wordsOnList(dictionary: DictionaryRepo, level: 5 | 4 | 3): Promise<Word[]> {
  if (dictionary.wordsByJlpt) return dictionary.wordsByJlpt(level);
  const lists = await Promise.all(
    INITIALS.map((kana) => dictionary.wordsByReadingPrefix(kana, SCAN_LIMIT)),
  );
  const byId = new Map(lists.flat().map((word) => [word.id, word]));
  return [...byId.values()].filter((word) => word.jlpt === level);
}

/** Which lists a Minna lesson range stands for (D14) and the tag its words get. */
function minnaLists(upTo: number): [JlptList, string][] {
  const first = `Minna 第1–${Math.min(upTo, 25)}課`;
  return upTo > 25
    ? [
        ['n5', first],
        ['n4', `Minna 第26–${Math.min(upTo, 50)}課`],
      ]
    : [['n5', first]];
}

function listTags(options: ImportKnownOptions): [JlptList, string][] {
  const lists = (options.lists ?? []).map((list): [JlptList, string] => [
    list,
    `JLPT ${list.toUpperCase()}`,
  ]);
  const minna = options.minnaUpTo && options.minnaUpTo > 0 ? minnaLists(options.minnaUpTo) : [];
  return [...lists, ...minna];
}

/** Word id → lesson tag; the first source that names a word tags it. */
export type Picked = Map<string, string | undefined>;

async function pickLists(repos: Repos, options: ImportKnownOptions, picked: Picked) {
  for (const [list, tag] of listTags(options)) {
    for (const word of await wordsOnList(repos.dictionary, LEVEL_OF[list])) {
      if (word.forms.some(hasKanji) && !picked.has(word.id)) picked.set(word.id, tag);
    }
  }
}

function lines(pasted: string | undefined): string[] {
  return [...new Set((pasted ?? '').split(/\r?\n/u).map((line) => line.trim()))].filter(Boolean);
}

/** Adds the dictionary word for each pasted line to `picked`; returns the lines not found. */
export async function pickPasted(repos: Repos, options: ImportKnownOptions, picked: Picked) {
  const lookup = options.lookup ?? ((text: string) => repos.dictionary.wordsByText(text));
  const notFound: string[] = [];
  for (const line of lines(options.pasted)) {
    const words = await lookup(line);
    const word =
      words.find((w) => w.forms.includes(line)) ?? words.find((w) => w.common) ?? words[0];
    if (!word) notFound.push(line);
    else if (!picked.has(word.id)) picked.set(word.id, options.lesson);
  }
  return notFound;
}

/**
 * A known word's card: reviewed once as Easy, then due on a day spread over the next 1–12
 * weeks by its id, so a thousand imported words do not all fall due on the same day.
 */
function knownItem(wordId: string, lesson: string | undefined, now: number): Item {
  const item = newWordItem({
    wordId,
    kind: 'import',
    now,
    level: 3,
    ...(lesson ? { lesson } : {}),
  });
  const reviewed = reviewCard(newCard(now), 4, now);
  const days = 7 + (Number.parseInt(wordId, 10) % 78 || 0);
  return { ...item, card: { ...reviewed, due: now + days * DAY_MS, scheduledDays: days } };
}

const BATCH = 200;

/** Marks picked words known: new items at level 3, lower items raised to 3, known ones kept. */
async function mark(repos: Repos, picked: Picked, options: ImportKnownOptions) {
  const ids = [...picked.keys()];
  let marked = 0;
  for (let at = 0; at < ids.length; at += BATCH) {
    const batch = ids.slice(at, at + BATCH);
    const existing = await repos.items.getMany(batch.map((id) => `word:${id}` as const));
    const updates = batch.flatMap((id, i): Item[] => {
      const item = existing[i];
      if (!item) return [knownItem(id, picked.get(id), options.now)];
      return item.level < 3 ? [{ ...item, level: 3, updatedAt: options.now }] : [];
    });
    await repos.items.putMany(updates);
    marked += updates.length;
    options.onProgress?.(Math.min(at + BATCH, ids.length), ids.length);
  }
  return { marked, already: ids.length - marked };
}

/** Moves the learner's level past the lists just applied (D38); never lowers it. */
async function raiseLevel(repos: Repos, options: ImportKnownOptions) {
  const level = levelAfterLists(listTags(options).map(([list]) => LEVEL_OF[list]));
  if (level !== undefined) await raiseLearnerLevel(repos.settings, level);
}

/**
 * Imports already-known words at level 3 (K6, D14) from the JLPT lists, a Minna lesson range
 * (≤ 25 → N5, more → N5 + N4) and pasted lines, then derives kanji readings (K3). Kana-only
 * words are skipped: they are never unknown in a sentence (D9). Idempotent (P2): a second run
 * marks nothing new, never lowers a level and never touches a known word's FSRS card. A list
 * raises the learner's level past it (D38).
 */
export async function importKnown(
  repos: Repos,
  options: ImportKnownOptions,
): Promise<ImportKnownResult> {
  const picked: Picked = new Map();
  await pickLists(repos, options, picked);
  const notFound = await pickPasted(repos, options, picked);
  const { marked, already } = await mark(repos, picked, options);
  if (marked > 0) await rebuildKanjiReadings(repos);
  await raiseLevel(repos, options);
  return { marked, already, notFound };
}
