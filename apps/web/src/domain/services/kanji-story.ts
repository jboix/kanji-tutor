/**
 * What the tutor needs for a kanji's story (the kanji page): the kanji with its meanings and
 * named parts, and the kanji the learner reads, most frequent first, for the short story.
 */
import type { Repos } from '../repos.ts';
import { type KanjiWithParts, kanjiWithParts } from './kanji-parts.ts';

/** Known kanji sent with a story: enough to write two sentences, few enough to stay cheap. */
const KNOWN_MAX = 80;

export interface StoryMaterial {
  kanji: KanjiWithParts;
  knownKanji: string[];
}

/** The kanji the learner reads (a reading at level 3 or more), most frequent first. */
async function knownKanji(repos: Repos, except: string): Promise<string[]> {
  const rows = await repos.kanjiReadings.all();
  const chars = [...new Set(rows.filter((row) => row.level >= 3).map((row) => row.kanji))];
  const kanji = await repos.dictionary.kanjiMany(chars.filter((char) => char !== except));
  return kanji
    .flatMap((k) => k ?? [])
    .sort((a, b) => (a.freq ?? 9999) - (b.freq ?? 9999))
    .slice(0, KNOWN_MAX)
    .map((k) => k.char);
}

/** The story's material, or undefined when the kanji is not in the dictionary. */
export async function storyMaterial(
  repos: Repos,
  char: string,
): Promise<StoryMaterial | undefined> {
  const [kanji] = await kanjiWithParts(repos, char);
  if (!kanji) return undefined;
  return { kanji, knownKanji: await knownKanji(repos, char) };
}
