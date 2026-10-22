/**
 * New words from class typed or pasted by hand (K1, K5): unlike the known-words import (K6) they
 * start unseen, sourced as textbook words of the lesson and the ISO week, so they become this
 * week's fresh items in sessions.
 */
import type { Repos } from '../repos.ts';
import type { Word } from '../types.ts';
import { type Picked, pickPasted } from './import-known.ts';
import { ensureItem } from './items.ts';

export interface LessonWordsOptions {
  /** One word per line, kanji, kana or romaji. */
  pasted: string;
  /** Lesson tag; defaults to `settings.currentLesson`. */
  lesson?: string;
  now: number;
  /** Looks a pasted line up (e.g. `lang.lookupWord`, which also takes romaji). */
  lookup?: (line: string) => Promise<Word[]>;
}

export interface LessonWordsResult {
  /** Words added as new items (level 0). */
  added: number;
  /** Words that were already tracked, left as they were. */
  tracked: number;
  notFound: string[];
  /** The lesson tag the new words got, if any. */
  lesson?: string;
}

/** The given tag, else the current lesson; a tag given with no current lesson becomes it. */
async function lessonTag(repos: Repos, given: string | undefined): Promise<string | undefined> {
  const { currentLesson } = await repos.settings.get();
  const lesson = given?.trim() || currentLesson;
  if (lesson && !currentLesson) await repos.settings.patch({ currentLesson: lesson });
  return lesson;
}

/**
 * Adds pasted words as new lesson words: level 0 with a fresh FSRS card, `source.kind`
 * 'textbook', the given lesson tag or the current lesson, and this ISO week. Words already
 * tracked keep their level and source. A tag given while no current lesson is set becomes the
 * current lesson, as captures do (D20), so the words are fresh in sessions.
 */
export async function addLessonWords(
  repos: Repos,
  options: LessonWordsOptions,
): Promise<LessonWordsResult> {
  const picked: Picked = new Map();
  const notFound = await pickPasted(repos, options, picked);
  const lesson = await lessonTag(repos, options.lesson);
  let added = 0;
  for (const wordId of picked.keys()) {
    const base = { wordId, kind: 'textbook' as const, now: options.now };
    const { created } = await ensureItem(repos, lesson ? { ...base, lesson } : base);
    if (created) added += 1;
  }
  const result: LessonWordsResult = { added, tracked: picked.size - added, notFound };
  if (lesson) result.lesson = lesson;
  return result;
}
