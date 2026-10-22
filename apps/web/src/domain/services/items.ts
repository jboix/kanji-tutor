import { isoWeek, itemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import { newCard } from '../scheduler.ts';
import type { Item, KnowledgeLevel, Source, SourceKind } from '../types.ts';

export const DAY_MS = 86_400_000;

/** What `ensureItem` needs to create a word item. */
export interface EnsureItemOptions {
  wordId: string;
  kind: SourceKind;
  now: number;
  /** Lesson tag; defaults to `settings.currentLesson` for textbook, capture and manual adds. */
  lesson?: string;
  /** Level for a new item; 0 (unseen) by default. */
  level?: KnowledgeLevel;
}

/** Sources that belong to the lesson studied right now, so they default to its tag (K5). */
const LESSON_KINDS: ReadonlySet<SourceKind> = new Set(['textbook', 'capture', 'manual']);

async function lessonFor(repos: Repos, options: EnsureItemOptions): Promise<string | undefined> {
  if (options.lesson !== undefined) return options.lesson;
  if (!LESSON_KINDS.has(options.kind)) return undefined;
  return (await repos.settings.get()).currentLesson;
}

/** A word item that is not stored yet, with a fresh FSRS card due now (K4, K5). */
export function newWordItem(options: EnsureItemOptions & { lesson?: string }): Item {
  const { wordId, kind, now, lesson, level = 0 } = options;
  const source: Source = { kind, week: isoWeek(new Date(now)), addedAt: now };
  if (lesson !== undefined) source.lesson = lesson;
  return {
    id: itemId('word', wordId),
    kind: 'word',
    ref: wordId,
    level,
    card: newCard(now),
    source,
    updatedAt: now,
  };
}

/**
 * The word item for a JMdict id, created when missing (K1, K5): a fresh FSRS card, the source
 * kind, the lesson (given, or the current lesson for textbook, capture and manual adds) and the
 * ISO week. An existing item is returned unchanged.
 */
export async function ensureItem(
  repos: Repos,
  options: EnsureItemOptions,
): Promise<{ item: Item; created: boolean }> {
  const existing = await repos.items.get(itemId('word', options.wordId));
  if (existing) return { item: existing, created: false };
  const lesson = await lessonFor(repos, options);
  const item = newWordItem(lesson === undefined ? options : { ...options, lesson });
  await repos.items.put(item);
  return { item, created: true };
}
