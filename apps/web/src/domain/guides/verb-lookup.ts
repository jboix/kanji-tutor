import { classOf, isVerbClass } from '../conjugation/index.ts';
import type { DictionaryRepo } from '../repos.ts';
import type { Word } from '../types.ts';
import type { Example } from './tables.ts';

/**
 * The verb a learner typed for the conjugation table, in its dictionary form, written or read:
 * the first dictionary word with that writing or reading that conjugates as a verb, common words
 * first. Undefined when none does.
 */
export async function verbNamed(
  dictionary: Pick<DictionaryRepo, 'wordsByText'>,
  text: string,
): Promise<Example | undefined> {
  const words = await dictionary.wordsByText(text.trim());
  const ordered = [...words].sort((a, b) => Number(b.common) - Number(a.common));
  return ordered.map((word) => asVerb(word, text)).find((verb) => verb !== undefined);
}

/** The word as a verb to conjugate, written as typed when that is one of its forms. */
function asVerb(word: Word, text: string): Example | undefined {
  const reading = word.readings[0];
  const written = word.forms.includes(text) ? text : (word.forms[0] ?? reading);
  if (!written || !reading) return undefined;
  const cls = classOf(written, word.pos, reading);
  return cls && isVerbClass(cls) ? { written, reading, cls } : undefined;
}
