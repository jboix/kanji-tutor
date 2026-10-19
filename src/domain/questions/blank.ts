/** Blanks that cover whole tokens: a word or form with the ending it is written with (J3, J4). */
import type { Sentence } from '../types.ts';
import { type Conjugation, INFLECTIONS, type Inflection, inflect } from './conjugate.ts';

/** A form realised in a sentence: the blank's range, its text and the inflection it shows. */
export interface Realised {
  from: number;
  to: number;
  text: string;
  inflection: Inflection | undefined;
}

/** The surfaces a form can take, with their inflection (one, bare, for a form that does not conjugate). */
type Surfaces = [string, Inflection | undefined][];
const SURFACES = new Map<string, Surfaces>();

function surfaces(core: string, cls: Conjugation | undefined): Surfaces {
  if (!cls) return [[core, undefined]];
  const key = `${cls}|${core}`;
  const cached = SURFACES.get(key);
  if (cached) return cached;
  const all = INFLECTIONS.flatMap((f) =>
    inflect(core, cls, f).map((s): [string, Inflection] => [s, f]),
  );
  SURFACES.set(key, all);
  return all;
}

const ENDS = new WeakMap<Sentence, ReadonlySet<number>>();

/** Where the sentence's tokens end, worked out once per sentence. */
function endsOf(sentence: Sentence): ReadonlySet<number> {
  const cached = ENDS.get(sentence);
  if (cached) return cached;
  const ends = new Set(sentence.tokens.map((t) => t.start + t.surface.length));
  ENDS.set(sentence, ends);
  return ends;
}

/**
 * A form as written from token `k` on: the longest of its surfaces that ends on a token
 * boundary, so a blank never cuts a token or stops at a bare stem (もら of もらいました).
 */
export function realiseAt(
  sentence: Sentence,
  k: number,
  core: string,
  cls: Conjugation | undefined,
): Realised | undefined {
  const at = sentence.tokens[k]?.start;
  if (at === undefined) return undefined;
  const ends = endsOf(sentence);
  let best: Realised | undefined;
  for (const [text, inflection] of surfaces(core, cls)) {
    const fits = sentence.text.startsWith(text, at) && ends.has(at + text.length);
    if (fits && text.length > (best?.text.length ?? 0))
      best = { from: at, to: at + text.length, text, inflection };
  }
  return best;
}
