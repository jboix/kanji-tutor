/**
 * The intro-once rule (L1): an intro card shows before the first exercise on a word the learner
 * has never met (untracked, or level 0 with no review), and never twice for the same item.
 * Answering leaves a review, which ends it for good; "Got it" is also remembered on this device,
 * so leaving between the card and the answer does not bring the card back.
 */
import type { Repos } from '../../domain/repos.ts';
import type { ItemId } from '../../domain/types.ts';

const KEY = 'kanji-reader:introduced';
/** Oldest ids are dropped past this; by then they have reviews. */
const KEEP = 2000;

const shown = new Set<string>();

function stored(): string[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** True when this item's intro was shown (this run, or remembered on this device). */
export function wasIntroduced(itemId: ItemId): boolean {
  return shown.has(itemId) || stored().includes(itemId);
}

/** Remembers that the intro for `itemId` was shown. */
export function markIntroduced(itemId: ItemId): void {
  shown.add(itemId);
  try {
    const list = [...stored().filter((id) => id !== itemId), itemId].slice(-KEEP);
    globalThis.localStorage?.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage may be full or blocked; the in-memory set still holds for this run.
  }
}

/** For tests: forget every intro shown in this run. */
export function resetIntroduced(): void {
  shown.clear();
}

/** True when the learner has never met this item and its intro was not shown yet. */
export async function introDue(repos: Repos, itemId: ItemId): Promise<boolean> {
  if (wasIntroduced(itemId)) return false;
  const item = await repos.items.get(itemId);
  if (item && item.level > 0) return false;
  return (await repos.reviews.byItem(itemId)).length === 0;
}
