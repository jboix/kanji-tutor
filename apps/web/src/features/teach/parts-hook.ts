/**
 * The memory hook built from a kanji's parts when there is no AI (L1): "待 = 彳 (going) + 寺
 * (Buddhist temple): picture going and Buddhist temple together to remember "wait"." No AI, no
 * readings, so it can show in the no-spoil hint too (L2).
 */
import type { Translate } from '../../ui/i18n/types.ts';

export interface Part {
  char: string;
  meaning?: string | undefined;
}

export interface KanjiParts {
  char: string;
  /** The kanji's first meaning. */
  meaning?: string | undefined;
  parts: Part[];
}

const named = (part: Part) => (part.meaning ? `${part.char} (${part.meaning})` : part.char);

/** One line for one kanji, or undefined when no part has a meaning to build on. */
export function partsHook(t: Translate, kanji: KanjiParts): string | undefined {
  const known = kanji.parts.filter((part) => part.meaning);
  if (!kanji.meaning || known.length === 0) return undefined;
  const sum = kanji.parts.map(named).join(' + ');
  const picture = known.map((part) => part.meaning).join(` ${t('teach.and')} `);
  const params = { kanji: kanji.char, sum, picture, meaning: kanji.meaning };
  return known.length === 1 ? t('teach.hookOne', params) : t('teach.hookMany', params);
}

/** A word of two or more kanji: its kanji meanings add up to the word's meaning. */
function compoundHook(
  t: Translate,
  surface: string,
  meaning: string,
  kanji: readonly KanjiParts[],
) {
  if (kanji.length < 2 || kanji.some((k) => !k.meaning)) return undefined;
  const sum = kanji.map((k) => `${k.char} (${k.meaning})`).join(' + ');
  return t('teach.hookCompound', { surface, sum, meaning });
}

/** Up to three hook lines for a word: the compound first, then each kanji's parts. */
export function wordHooks(
  t: Translate,
  surface: string,
  meaning: string | undefined,
  kanji: readonly KanjiParts[],
): string[] {
  const compound = meaning ? compoundHook(t, surface, meaning, kanji) : undefined;
  const parts = kanji.flatMap((k) => partsHook(t, k) ?? []);
  return [...(compound ? [compound] : []), ...parts].slice(0, 3);
}
