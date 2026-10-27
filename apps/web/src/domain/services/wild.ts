/**
 * In the wild: what the tutor read on a photo of a sign or a menu, against what the learner
 * knows. Each kanji is known (a reading at level 3 or more) or new; the words that hold a new
 * kanji can be added to study, as a capture.
 */

import { itemId } from '../ids.ts';
import { hasKanji } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { SignInput, WildPhoto, WildReading } from '../wild-types.ts';
import { ensureItem } from './items.ts';

export type { SignInput, WildPhoto, WildReading } from '../wild-types.ts';

export interface WildKanji {
  char: string;
  meaning?: string;
  known: boolean;
}

export interface WildBox {
  char: string;
  box: readonly [number, number, number, number];
  known: boolean;
}

export interface WildWord {
  surface: string;
  reading: string;
  meaning: string;
  /** The dictionary confirmed the reading (A8). */
  verified: boolean;
  /** Its JMdict id, when the dictionary has it: only then can it be added. */
  wordId?: string;
  /** Already among the learner's words. */
  added: boolean;
}

export interface WildView {
  place: string;
  /** Each kanji once, in the order seen. */
  kanji: WildKanji[];
  boxes: WildBox[];
  /** Words with a kanji new to the learner. */
  words: WildWord[];
}

async function knownKanji(repos: Repos): Promise<Set<string>> {
  const rows = await repos.kanjiReadings.all();
  return new Set(rows.filter((row) => row.level >= 3).map((row) => row.kanji));
}

async function meanings(repos: Repos, chars: readonly string[]): Promise<Map<string, string>> {
  const found = await repos.dictionary.kanjiMany(chars);
  return new Map(found.flatMap((k) => (k?.meanings[0] ? [[k.char, k.meanings[0]] as const] : [])));
}

async function wordOf(repos: Repos, word: SignInput['words'][number], input: SignInput) {
  const verified = input.readings.some(
    (r) => r.surface === word.surface && r.reading === word.reading && r.verified,
  );
  const entry = (await repos.dictionary.wordsByText(word.surface)).find((w) =>
    w.readings.includes(word.reading),
  );
  const added = entry ? (await repos.items.get(itemId('word', entry.id))) !== undefined : false;
  return { ...word, verified, added, ...(entry ? { wordId: entry.id } : {}) };
}

/** The photo's kanji and words against what the learner knows. */
export async function wildView(repos: Repos, input: SignInput): Promise<WildView> {
  const known = await knownKanji(repos);
  const chars = [...new Set(input.kanji.map((k) => k.char).filter(hasKanji))];
  const meaning = await meanings(repos, chars);
  const kanji = chars.map((char) => {
    const found = meaning.get(char);
    return { char, known: known.has(char), ...(found ? { meaning: found } : {}) };
  });
  const isNew = (text: string) => [...text].some((c) => hasKanji(c) && !known.has(c));
  const fresh = input.words.filter((word) => isNew(word.surface));
  return {
    place: input.place,
    kanji,
    boxes: input.kanji.map(({ char, box }) => ({ char, box, known: known.has(char) })),
    words: await Promise.all(fresh.map((word) => wordOf(repos, word, input))),
  };
}

/** Adds words to study as captures; words already there are left as they are. */
export async function addWildWords(repos: Repos, wordIds: readonly string[], now: number) {
  for (const wordId of wordIds) await ensureItem(repos, { wordId, kind: 'capture', now });
}

/** Keeps a photo with what the tutor read on it; saving the same photo again replaces it. */
export async function saveWildPhoto(
  repos: Repos,
  photo: { id: string; photo: Blob; reading: WildReading; now: number },
) {
  const { now, ...rest } = photo;
  await repos.wildPhotos.put({ ...rest, createdAt: now });
}

/** Forgets a saved photo; the words added from it stay. */
export async function deleteWildPhoto(repos: Repos, id: string): Promise<void> {
  await repos.wildPhotos.delete(id);
}

/** The saved photos, newest first. */
export async function wildPhotos(repos: Repos): Promise<WildPhoto[]> {
  return (await repos.wildPhotos.all()).sort((a, b) => b.createdAt - a.createdAt);
}
