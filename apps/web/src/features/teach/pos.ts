/** JMdict part-of-speech tags in plain words, for the hint sheet (L2). */
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';

const EXACT: Readonly<Record<string, PlainKey>> = {
  n: 'teach.posNoun',
  'adj-i': 'teach.posAdjI',
  'adj-na': 'teach.posAdjNa',
  'adj-no': 'teach.posAdjNo',
  adv: 'teach.posAdverb',
  'adv-to': 'teach.posAdverbTo',
  vs: 'teach.posSuru',
  'vs-i': 'teach.posSuruVerb',
  vk: 'teach.posKuru',
  v1: 'teach.posIchidan',
  vt: 'teach.posTransitive',
  vi: 'teach.posIntransitive',
  exp: 'teach.posExpression',
  int: 'teach.posInterjection',
  pn: 'teach.posPronoun',
  ctr: 'teach.posCounter',
  conj: 'teach.posConjunction',
  prt: 'teach.posParticle',
  suf: 'teach.posSuffix',
  pref: 'teach.posPrefix',
  num: 'teach.posNumber',
};

function label(tag: string): PlainKey | undefined {
  if (EXACT[tag]) return EXACT[tag];
  if (tag.startsWith('v5')) return 'teach.posGodan';
  if (tag.startsWith('v1')) return 'teach.posIchidan';
  return undefined;
}

/** "godan verb · transitive verb", or undefined when no tag is known. */
export function partOfSpeech(
  t: Translate,
  tags: readonly string[] | undefined,
): string | undefined {
  const keys = [...new Set((tags ?? []).flatMap((tag) => label(tag) ?? []))];
  return keys.length > 0 ? keys.map((key) => t(key)).join(' · ') : undefined;
}
