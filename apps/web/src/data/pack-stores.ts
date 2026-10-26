/** Writing and pruning the rows of each pack store (upsert, then prune). */
import type { PackFile } from '../domain/repos.ts';
import type { Cluster, GrammarPoint, Kanji, Sentence, UnitPack, Word } from '../domain/types.ts';
import type { KanjiTutorDb } from './db.ts';
import { toWordRow } from './dictionary.ts';

export type PackStore = PackFile['store'];

/** Pack stores in install order: sentences before the grammar and units that point to them. */
export const PACK_STORES: PackStore[] = [
  'words',
  'kanji',
  'sentences',
  'grammar',
  'clusters',
  'units',
];

/** Sentence sources that come from the packs; all others are the learner's. */
export const PACK_SOURCES: Sentence['source'][] = ['tatoeba', 'unit'];

/** Ids loaded per store during one install, to prune rows the new version no longer has. */
export type Seen = Record<PackStore, Set<string>>;

export function emptySeen(): Seen {
  return {
    words: new Set(),
    kanji: new Set(),
    sentences: new Set(),
    grammar: new Set(),
    clusters: new Set(),
    units: new Set(),
  };
}

export function rowId(store: PackStore, row: unknown): string {
  const record = row as { id?: string; char?: string };
  return (store === 'kanji' ? record.char : record.id) ?? '';
}

/**
 * A catalogue point merged over what the learner has. A point the learner made keeps its own
 * pattern, meaning and lesson; a catalogue point is refreshed. Either way the learner's own
 * examples (scanned lines, compose) stay after the pack's, and progress lives in `items`, untouched.
 */
export function mergeGrammar(next: GrammarPoint, stored: GrammarPoint | undefined): GrammarPoint {
  if (!stored) return next;
  const own = stored.exampleSentenceIds.filter((id) => !id.startsWith('tatoeba:'));
  const examples = [...new Set([...next.exampleSentenceIds, ...own])];
  if (!stored.catalogue) {
    const merged: GrammarPoint = { ...stored, exampleSentenceIds: examples };
    const level = stored.level ?? next.level;
    if (level) merged.level = level;
    return merged;
  }
  return {
    ...next,
    ...(stored.lesson ? { lesson: stored.lesson } : {}),
    exampleSentenceIds: examples,
  };
}

async function putGrammar(db: KanjiTutorDb, rows: GrammarPoint[]): Promise<void> {
  await db.transaction('rw', db.grammar, async () => {
    const stored = await db.grammar.bulkGet(rows.map((row) => row.id));
    await db.grammar.bulkPut(rows.map((row, i) => mergeGrammar(row, stored[i])));
  });
}

/** Upserts one batch of rows into its store. */
export async function putBatch(db: KanjiTutorDb, store: PackStore, rows: unknown[]) {
  if (store === 'words') {
    const words = (rows as Word[]).map(toWordRow);
    await db.transaction('rw', db.words, () => db.words.bulkPut(words));
  } else if (store === 'kanji') {
    await db.transaction('rw', db.kanji, () => db.kanji.bulkPut(rows as Kanji[]));
  } else if (store === 'sentences') {
    await db.transaction('rw', db.sentences, () => db.sentences.bulkPut(rows as Sentence[]));
  } else if (store === 'grammar') {
    await putGrammar(db, rows as GrammarPoint[]);
  } else if (store === 'clusters') {
    await db.transaction('rw', db.clusters, () => db.clusters.bulkPut(rows as Cluster[]));
  } else {
    await db.transaction('rw', db.units, () => db.units.bulkPut(rows as UnitPack[]));
  }
}

/** The keys of `keys` the new version did not load, deleted from `table`. */
async function dropUnseen(
  table: { bulkDelete(keys: string[]): Promise<void> },
  keys: readonly string[],
  seen: ReadonlySet<string>,
): Promise<void> {
  const stale = keys.filter((key) => !seen.has(key));
  if (stale.length > 0) await table.bulkDelete(stale);
}

/** The keys of the sentences that came from the packs; the learner's are never pruned. */
async function packSentenceKeys(db: KanjiTutorDb): Promise<string[]> {
  const bySource = PACK_SOURCES.map((source) =>
    db.sentences.where('source').equals(source).primaryKeys(),
  );
  return (await Promise.all(bySource)).flat();
}

/**
 * Removes pack rows that the newly loaded version doesn't have, in one transaction. Only keys
 * are read for the large stores: testing every row there reads and decodes each one. The
 * learner's sentences and grammar points are never touched, nor a catalogue point that has an item.
 */
export async function prunePacks(db: KanjiTutorDb, seen: Seen): Promise<void> {
  const tables = [db.words, db.kanji, db.sentences, db.grammar, db.clusters, db.units, db.items];
  const keys = (table: { toCollection(): { primaryKeys(): Promise<string[]> } }) =>
    table.toCollection().primaryKeys();
  await db.transaction('rw', tables, async () => {
    await dropUnseen(db.words, await keys(db.words), seen.words);
    await dropUnseen(db.kanji, await keys(db.kanji), seen.kanji);
    await dropUnseen(db.sentences, await packSentenceKeys(db), seen.sentences);
    await dropUnseen(db.clusters, await keys(db.clusters), seen.clusters);
    await dropUnseen(db.units, await keys(db.units), seen.units);
    const tracked = new Set(await db.items.where('kind').equals('grammar').primaryKeys());
    await db.grammar
      .filter((row) => row.catalogue === true && !seen.grammar.has(row.id))
      .filter((row) => !tracked.has(`grammar:${row.id}`))
      .delete();
  });
}
