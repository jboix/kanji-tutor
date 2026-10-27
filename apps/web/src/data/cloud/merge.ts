import type { BackupFile } from '../backup-schema.ts';

/** A save's content: what a backup file holds under `data`. */
export type SaveData = BackupFile['data'];

/**
 * Which side wins a record both have, when the record says nothing about which is newer: `mine`
 * after this device changed things (a conflict while saving), `theirs` on a first sign-in, where
 * the saved progress is the established one.
 */
export type Prefer = 'mine' | 'theirs';

/** Records of both sides by `key`; on a clash, `pick` chooses. */
function union<T>(
  mine: readonly T[],
  theirs: readonly T[],
  key: (record: T) => string,
  pick: (a: T, b: T) => T,
): T[] {
  const merged = new Map<string, T>();
  for (const record of theirs) merged.set(key(record), record);
  for (const record of mine) {
    const other = merged.get(key(record));
    merged.set(key(record), other === undefined ? record : pick(record, other));
  }
  return [...merged.values()];
}

/** Without the storage's own numbering, which each device counts on its own. */
function unnumbered<T extends { id?: number }>(record: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = record;
  return rest;
}

const byId = (record: { id: string }) => record.id;

/**
 * An AI log entry by what it says, field by field: the same entry read back from a save lists
 * its fields in another order, so its JSON text would not match.
 */
const logKey = (entry: SaveData['aiLog'][number]) =>
  [
    entry.at,
    entry.task,
    entry.model,
    entry.cached,
    entry.ok,
    entry.inputTokens,
    entry.outputTokens,
  ].join('|');

/** The record changed last; on a tie, the preferred side's. */
const newer =
  (side: <T>(a: T, b: T) => T) =>
  <T extends { updatedAt: number }>(a: T, b: T) =>
    a.updatedAt === b.updatedAt ? side(a, b) : a.updatedAt > b.updatedAt ? a : b;

/** Captures of a save written before scanned lessons, kept until it is imported. */
function legacyCaptures(mine: SaveData, theirs: SaveData, prefer: Prefer) {
  const pick = <T>(a: T, b: T) => (prefer === 'mine' ? a : b);
  const captures = union(mine.captures ?? [], theirs.captures ?? [], byId, pick);
  return captures.length > 0 ? { captures } : {};
}

/**
 * Two saves made apart, as one. Items, which carry the review schedule, keep the newer
 * `updatedAt`. Reviews and the AI log are histories: both devices' entries are kept, matched by
 * what they say rather than by their local numbers. Everything else is matched by id, the
 * preferred side winning a clash. Something deleted on one side and kept on the other comes back:
 * merging only happens when two devices saved at nearly the same time.
 */
export function mergeSaves(mine: SaveData, theirs: SaveData, prefer: Prefer): SaveData {
  const side = <T>(a: T, b: T) => (prefer === 'mine' ? a : b);
  const sameId = <T extends { id: string }>(a: T[], b: T[]) => union(a, b, byId, side);
  return {
    items: union(mine.items, theirs.items, byId, newer(side)),
    reviews: union(
      mine.reviews.map(unnumbered),
      theirs.reviews.map(unnumbered),
      (r) => `${r.itemId}|${r.at}`,
      side,
    ),
    aiLog: union(mine.aiLog.map(unnumbered), theirs.aiLog.map(unnumbered), logKey, side),
    kanjiReadings: sameId(mine.kanjiReadings, theirs.kanjiReadings),
    sentences: sameId(mine.sentences, theirs.sentences),
    grammar: sameId(mine.grammar, theirs.grammar),
    scans: sameId(mine.scans, theirs.scans),
    ...legacyCaptures(mine, theirs, prefer),
    notes: sameId(mine.notes, theirs.notes),
    plans: sameId(mine.plans, theirs.plans),
    settings: side(mine.settings, theirs.settings),
  };
}
