/**
 * Lookalike readings for grading `wrong-kanji` (R5): a word written with a kanji that shares a
 * part with one of the target's kanji (待 → 持, sharing 寺), read the way the target is inflected.
 */
import { parseItemId } from '../ids.ts';
import { hasKanji, toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { Review, Word } from '../types.ts';

/** A lookalike word's readings, inflected like the target (待って → もって). */
export interface Confusable {
  kanji: string;
  lookalike: string;
  readings: string[];
}

/** Lookalike kanji tried per kanji of the target, to keep a wrong answer cheap to grade. */
const MAX_LOOKALIKES = 30;

function commonPrefix(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

async function lookalikesOf(repos: Repos, char: string): Promise<string[]> {
  const entry = await repos.dictionary.kanji(char);
  if (!entry) return [];
  const lists = await Promise.all(
    entry.components.map((c) => repos.dictionary.kanjiByComponent(c)),
  );
  const chars = lists.flat().map((kanji) => kanji.char);
  return [...new Set(chars)].filter((c) => c !== char).slice(0, MAX_LOOKALIKES);
}

/**
 * Inflects a lookalike's reading like the target: the target's dictionary reading (まつ) and
 * its reading in the sentence (まっ, まって) share a stem (ま); the lookalike (もつ) keeps the
 * same ending (つ), so its stem (も) takes the sentence's endings (もっ, もって).
 */
function inflect(lookalike: string, primary: string, accepted: readonly string[]): string[] {
  const first = accepted[0] ?? '';
  const stem = commonPrefix(primary, first);
  const ending = primary.slice(stem);
  if (!lookalike.endsWith(ending)) return [];
  const base = lookalike.slice(0, lookalike.length - ending.length);
  return accepted.map((reading) => base + reading.slice(stem));
}

async function swapped(repos: Repos, form: string, char: string, lookalike: string) {
  const text = form.replace(char, lookalike);
  const words = await repos.dictionary.wordsByText(text);
  return words.filter((word) => word.forms.includes(text));
}

async function forKanji(repos: Repos, word: Word, char: string, accepted: readonly string[]) {
  const form = word.forms[0] ?? '';
  const primary = toKanaFold(word.readings[0] ?? '');
  const out: Confusable[] = [];
  for (const lookalike of await lookalikesOf(repos, char)) {
    const readings = (await swapped(repos, form, char, lookalike)).flatMap((w) =>
      w.readings.flatMap((r) => inflect(toKanaFold(r), primary, accepted)),
    );
    if (readings.length > 0) out.push({ kanji: char, lookalike, readings });
  }
  return out;
}

/**
 * Readings of lookalike words for a target word (待つ → 持つ, 時, 詩…), inflected like the
 * accepted answers. Lookalikes share a component (KRADFILE parts, D13).
 */
export async function confusablesFor(
  repos: Repos,
  word: Word,
  accepted: readonly string[],
): Promise<Confusable[]> {
  const chars = [...new Set([...(word.forms[0] ?? '')].filter(hasKanji))];
  const folded = accepted.map(toKanaFold);
  return (await Promise.all(chars.map((c) => forKanji(repos, word, c, folded)))).flat();
}

/** The lookalike whose reading the answer matches, if any (still swapping 待 and 持). */
export function matchConfusable(
  confusables: readonly Confusable[],
  answer: string,
): Confusable | undefined {
  const given = toKanaFold(answer);
  return confusables.find((c) =>
    c.readings.some((r) => r !== '' && (r === given || given.startsWith(r))),
  );
}

const isKanjiChar = (text: string) => [...text].length === 1 && hasKanji(text);

/**
 * The two kanji a `wrong-kanji` review swapped, the one meant first (待 持): a lookalike drill
 * stores both as its answer and expected text; a typed or spoken reading is matched against the
 * lookalike readings of its word. Undefined when no pair can be found.
 */
export async function swappedPair(
  repos: Repos,
  review: Review,
): Promise<[string, string] | undefined> {
  if (isKanjiChar(review.expected) && isKanjiChar(review.answer)) {
    return [review.expected, review.answer];
  }
  const word = await repos.dictionary.word(parseItemId(review.itemId).ref);
  if (!word) return undefined;
  const match = matchConfusable(
    await confusablesFor(repos, word, [review.expected]),
    review.answer,
  );
  return match ? [match.kanji, match.lookalike] : undefined;
}

/**
 * Which lookalike an answer graded `wrong-kanji` read (待って read もって → 待 and 持), for the
 * mistake note and its cache key (A13, A15). Undefined when no lookalike gives that answer.
 */
export async function confusedKanji(
  repos: Repos,
  wordId: string,
  accepted: readonly string[],
  given: string,
): Promise<Pick<Confusable, 'kanji' | 'lookalike'> | undefined> {
  const word = await repos.dictionary.word(wordId);
  if (!word) return undefined;
  const answer = toKanaFold(given);
  const found = (await confusablesFor(repos, word, accepted)).find((c) =>
    c.readings.includes(answer),
  );
  return found && { kanji: found.kanji, lookalike: found.lookalike };
}
