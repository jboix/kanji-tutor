/** The word of the season (Home) with its dictionary entry, when the installed packs have it. */
import type { Repos } from '../repos.ts';
import { type SeasonNow, seasonAt } from '../seasons.ts';
import type { Word } from '../types.ts';

export interface SeasonWordView extends SeasonNow {
  entry: Word;
}

/** The season word of `now`, or undefined when the dictionary lacks it (no packs yet). */
export async function seasonWord(repos: Repos, now: number): Promise<SeasonWordView | undefined> {
  const season = seasonAt(now);
  if (!season) return undefined;
  const { written, reading } = season.word;
  const words = await repos.dictionary.wordsByText(written);
  const entry = words.find((w) => w.forms.includes(written) && w.readings.includes(reading));
  return entry ? { ...season, entry } : undefined;
}
