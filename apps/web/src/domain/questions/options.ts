/** Shared rules for every generator: four distinct options, one right, in a seeded order. */
import { seededOrder } from '../drills/seed.ts';
import { toKanaFold } from '../kana.ts';
import type { QuestionOption } from './types.ts';

/** Options per question, as on the JLPT. */
export const OPTION_COUNT = 4;

/** Compares options as a learner sees them: kana scripts and spaces folded together. */
export const optionKey = (text: string) => toKanaFold(text);

/**
 * The right option and the first wrong ones that differ from it and from each other, until
 * there are four, in an order fixed by the seed. Undefined when fewer than three wrong options
 * are left: a question is never emitted with duplicate options or a missing distractor.
 */
export function arrange(
  right: QuestionOption,
  wrong: readonly QuestionOption[],
  seed: string,
): { options: QuestionOption[]; answer: number } | undefined {
  const seen = new Set([optionKey(right.text)]);
  const picked: QuestionOption[] = [right];
  for (const option of wrong) {
    const key = optionKey(option.text);
    if (picked.length >= OPTION_COUNT || key === '' || seen.has(key)) continue;
    seen.add(key);
    picked.push(option);
  }
  if (picked.length < OPTION_COUNT) return undefined;
  const options = seededOrder(picked, (o) => o.text, seed);
  return { options, answer: options.indexOf(right) };
}

/**
 * Takes from each list in turn (one long-vowel slip, one っ slip, one voicing slip…), so the
 * wrong options are varied before any kind repeats.
 */
export function roundRobin<T>(lists: readonly (readonly T[])[]): T[] {
  const out: T[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const value = list[i];
      if (value !== undefined) out.push(value);
    }
  }
  return out;
}

const STOP = new Set(
  'a an the to of in on at for be is it do does did as or and not no so by with this that one someone something sth casual'.split(
    ' ',
  ),
);

/** Content words of English glosses or meanings, lower case: "to wait; to await" → wait, await. */
export function meaningWords(glosses: readonly string[]): Set<string> {
  const words = glosses
    .join(' ')
    .toLowerCase()
    .split(/[^a-z]+/u)
    .filter((w) => w.length > 1 && !STOP.has(w));
  return new Set(words);
}

/** True when two glosses share a content word ("must, have to" and "have to (need)"). */
export function sameMeaning(a: readonly string[], b: readonly string[]): boolean {
  const left = meaningWords(a);
  return [...meaningWords(b)].some((w) => left.has(w));
}

/** The first gloss sense, short: "to wait; to await" → "to wait". */
export function firstGloss(glosses: readonly string[]): string {
  return (glosses[0] ?? '').split(';')[0]?.trim() ?? '';
}

/** What stands in for a masked word in a question's hint. */
export const MASK = '___';
/** Shared letters from which two English words count as one (wait, waiting, waited). */
const STEM = 4;

function sameWord(word: string, meaning: ReadonlySet<string>): boolean {
  if (meaning.has(word)) return true;
  if (word.length < STEM) return false;
  return [...meaning].some((m) => m.length >= STEM && word.slice(0, STEM) === m.slice(0, STEM));
}

/**
 * The translation with every word of the blank's meaning masked (J3, J4): "I want to drink
 * tea" with "want" → "I ___ to drink tea". Undefined when no word of the meaning is in it: the
 * translation then says it in other words, and would give the blank away.
 */
export function maskedMeaning(translation: string, glosses: readonly string[]): string | undefined {
  const meaning = meaningWords(glosses);
  if (meaning.size === 0) return undefined;
  let masked = false;
  const text = translation.replace(/[A-Za-z']+/gu, (word) => {
    if (!sameWord(word.toLowerCase(), meaning)) return word;
    masked = true;
    return MASK;
  });
  return masked ? text.replace(new RegExp(`${MASK}(?:\\s+${MASK})+`, 'gu'), MASK) : undefined;
}

/** A blank question's translation, and its masked hint when there is one. */
export function meaningFields(
  translation: string | undefined,
  glosses: readonly string[],
): { translation?: string; hint?: string } {
  if (!translation) return {};
  const hint = maskedMeaning(translation, glosses);
  return hint ? { translation, hint } : { translation };
}
