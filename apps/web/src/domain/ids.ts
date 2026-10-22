import type { ItemId, ItemKind } from './types.ts';

/** Builds a stable item id, e.g. `itemId('kanjiReading', '生:セイ')` → `kanjiReading:生:セイ`. */
export function itemId(kind: ItemKind, ref: string): ItemId {
  return `${kind}:${ref}`;
}

/** Splits an item id into its kind and ref. */
export function parseItemId(id: ItemId): { kind: ItemKind; ref: string } {
  const at = id.indexOf(':');
  return { kind: id.slice(0, at) as ItemKind, ref: id.slice(at + 1) };
}

/** ISO-8601 week of a date, e.g. "2026-W42". Weeks start on Monday. */
export function isoWeek(date: Date): string {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
