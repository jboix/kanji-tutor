/**
 * Kanji cards: a kanji the learner reads, to read from its shape or to write from its readings
 * and meaning. Pure: the kanji, the readings the learner knows and the other kanji to choose
 * from come in.
 */
import { itemId } from '../ids.ts';
import { toKanaFold } from '../kana.ts';
import type { Kanji } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { KanjiCardDrill } from './types.ts';

export interface KanjiCardInput {
  kanji: Kanji;
  /** The readings the learner knows, as stored (セイ, い.きる): shown first. */
  known: readonly string[];
  direction: KanjiCardDrill['direction'];
  /** Other kanji the learner reads, for the choices of a typed card. */
  others: readonly Kanji[];
  seed: string;
}

/** Readings a writing card shows, at most. */
const CUE_READINGS = 3;

/** Choices on a typed writing card, the kanji among them. */
export const CARD_CHOICES = 4;

/** What a dictionary reading counts as when typed: セイ → せい, い.きる → いきる and い. */
export function typedReadings(reading: string): string[] {
  const plain = reading.replaceAll('-', '');
  const [stem = '', ending = ''] = plain.split('.');
  const forms = ending ? [stem + ending, stem] : [stem];
  return forms.filter(Boolean).map(toKanaFold);
}

const readingsOf = (kanji: Kanji) => [...kanji.on, ...kanji.kun];

/** How alike two kanji are, for choices that make the learner look: a shared part, a sound. */
function likeness(kanji: Kanji, other: Kanji): number {
  const parts = other.components.filter((c) => kanji.components.includes(c)).length;
  const sounds = other.on.filter((r) => kanji.on.includes(r)).length;
  return parts * 2 + sounds;
}

/** The kanji and up to three others, the most alike first, in a seeded order. */
function choicesFor(kanji: Kanji, others: readonly Kanji[], seed: string): string[] {
  const pool = seededOrder(
    others.filter((o) => o.char !== kanji.char),
    (o) => o.char,
    seed,
  );
  const picked = [...pool].sort((a, b) => likeness(kanji, b) - likeness(kanji, a));
  const chars = [kanji.char, ...picked.slice(0, CARD_CHOICES - 1).map((o) => o.char)];
  return seededOrder(chars, String, `${seed}|${kanji.char}`);
}

/**
 * A card on the kanji, or undefined for a kanji without readings, or a writing card without
 * enough other kanji to choose from when it is typed.
 */
export function kanjiCardDrill(input: KanjiCardInput): KanjiCardDrill | undefined {
  const { kanji, known, direction } = input;
  const all = readingsOf(kanji);
  if (all.length === 0) return undefined;
  const choices = choicesFor(kanji, input.others, input.seed);
  if (direction === 'write' && choices.length < 3) return undefined;
  const readings = [...new Set([...known, ...all])];
  return {
    kind: 'kanji-card',
    direction,
    kanji: kanji.char,
    itemId: itemId('kanji', kanji.char),
    meanings: kanji.meanings.slice(0, 3),
    readings,
    cue: known.length > 0 ? known.slice(0, CUE_READINGS) : all.slice(0, 2),
    accepted: [...new Set(readings.flatMap(typedReadings))],
    choices,
  };
}
