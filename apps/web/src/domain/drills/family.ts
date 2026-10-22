import { itemId } from '../ids.ts';
import { toKanaFold } from '../kana.ts';
import type { Kanji, Word } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { FamilyDrill } from './types.ts';

export interface FamilyInput {
  /** The shared phonetic part, e.g. 青. */
  part: string;
  /** Kanji with that phonetic part (the part itself may be one of them). */
  members: readonly Kanji[];
  /** On'yomi (katakana) the learner reads at level 3 or more, per kanji (K3). */
  knownOn: ReadonlyMap<string, ReadonlySet<string>>;
  /** Dictionary words written with one kanji alone, per kanji (精 → 精 せい), for the reveal. */
  solo?: ReadonlyMap<string, readonly Word[]>;
  seed: string;
}

/** Known members needed before a guess makes sense (kanji.html shows two). */
const MIN_KNOWN = 2;

/** The on'yomi most members share (セイ for 青 清 晴 精). */
function sharedSound(members: readonly Kanji[]): string | undefined {
  const counts = new Map<string, number>();
  for (const on of members.flatMap((m) => m.on)) counts.set(on, (counts.get(on) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function soloWord(input: FamilyInput, char: string, kana: string) {
  const word = input.solo?.get(char)?.find((w) => toKanaFold(w.readings[0] ?? '') === kana);
  return word ? { form: char, reading: kana } : undefined;
}

/**
 * Same part, same sound (R8, kanji.html "guess it"): two or more members the learner reads with
 * the family's shared on'yomi, and one member they don't read yet that also has it. The typed
 * guess is graded against that member's on'yomi. Undefined when the family does not allow it.
 */
export function familyDrill(input: FamilyInput): FamilyDrill | undefined {
  const sound = sharedSound(input.members);
  if (sound === undefined) return undefined;
  const withSound = input.members.filter((m) => m.on.includes(sound));
  const known = withSound.filter((m) => input.knownOn.get(m.char)?.has(sound));
  const unread = withSound.filter((m) => (input.knownOn.get(m.char)?.size ?? 0) === 0);
  const [guess] = seededOrder(unread, (m) => m.char, input.seed);
  if (known.length < MIN_KNOWN || !guess) return undefined;
  const kana = toKanaFold(sound);
  const drill: FamilyDrill = {
    kind: 'family',
    part: input.part,
    sound,
    known: known.map((m) => m.char),
    guess: guess.char,
    itemId: itemId('kanjiReading', `${guess.char}:${sound}`),
    accepted: [...new Set([kana, ...guess.on.map(toKanaFold)])],
  };
  const word = soloWord(input, guess.char, kana);
  if (word) drill.word = word;
  return drill;
}
