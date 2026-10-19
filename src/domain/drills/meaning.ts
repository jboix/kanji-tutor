/**
 * Meaning check (S4): a word of the lesson and four meanings, its own and three of words at the
 * same level, of the same kind (a noun's meaning among nouns) where it can. Pure.
 */
import { itemId } from '../ids.ts';
import type { Word } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { MeaningDrill, MeaningOption } from './types.ts';

export interface MeaningInput {
  word: Word;
  /** Words to take the other meanings from: the lesson's and the level's. */
  others: readonly Word[];
  seed: string;
  /** Show the meaning and choose the word. */
  reverse?: boolean;
}

/** Glosses shown per option. */
const GLOSSES = 2;
const OPTIONS = 4;

/** A coarse kind of word, so a verb's meaning is not the only verb among nouns. */
export function wordKind(word: Pick<Word, 'pos'>): 'verb' | 'adjective' | 'other' {
  const pos = word.pos ?? [];
  // vs marks a noun that takes する (勉強): the noun itself is not a verb.
  if (pos.some((tag) => /^v(1|5|k|s-|z)/u.test(tag))) return 'verb';
  if (pos.some((tag) => tag.startsWith('adj'))) return 'adjective';
  return 'other';
}

const fold = (gloss: string) => gloss.toLowerCase().replace(/^to /u, '').trim();

/** Whether two words share a meaning, so both would be right. */
function overlaps(a: Word, b: Word): boolean {
  const own = new Set(a.glosses.map(fold));
  return b.glosses.some((gloss) => own.has(fold(gloss)));
}

const writtenOf = (word: Word) => word.forms[0] ?? word.readings[0] ?? '';

/** A gloss this long makes a choice button wrap past three lines. */
const MAX_GLOSS = 40;

/**
 * The first senses, short enough for a choice: JMdict glosses can hold several senses joined
 * by semicolons ("teacher; instructor; master; sensei; title or form of address…").
 */
export function shortGlosses(glosses: readonly string[]): string[] {
  const bare = (g: string) => g.replace(/\s*\([^)]*\)/gu, '').trim();
  const senses = [...new Set(glosses.flatMap((g) => g.split(/;\s*/u)).map(bare))];
  const kept = senses.filter((g) => g.length > 0 && g.length <= MAX_GLOSS);
  return (kept.length > 0 ? kept : senses.map((g) => `${g.slice(0, MAX_GLOSS - 1)}…`)).slice(
    0,
    GLOSSES,
  );
}

function optionOf(word: Word): MeaningOption {
  const option: MeaningOption = {
    wordId: word.id,
    written: writtenOf(word),
    glosses: shortGlosses(word.glosses),
  };
  if (word.glossesByLang) {
    const entries = Object.entries(word.glossesByLang).map(([k, v]) => [k, shortGlosses(v)]);
    option.glossesByLang = Object.fromEntries(entries);
  }
  return option;
}

function distractors(input: MeaningInput): Word[] {
  const { word } = input;
  const usable = input.others.filter(
    (other) =>
      other.id !== word.id &&
      other.glosses.length > 0 &&
      writtenOf(other) !== writtenOf(word) &&
      !overlaps(word, other),
  );
  const kind = wordKind(word);
  const same = seededOrder(
    usable.filter((o) => wordKind(o) === kind),
    (o) => o.id,
    input.seed,
  );
  const rest = seededOrder(
    usable.filter((o) => wordKind(o) !== kind),
    (o) => o.id,
    input.seed,
  );
  const picked: Word[] = [];
  for (const other of [...same, ...rest]) {
    if (picked.length === OPTIONS - 1) break;
    const clash = picked.some((p) => overlaps(p, other) || writtenOf(p) === writtenOf(other));
    if (!clash) picked.push(other);
  }
  return picked;
}

/** The meaning check for `word`, or undefined without glosses or three other meanings. */
export function meaningDrill(input: MeaningInput): MeaningDrill | undefined {
  const { word } = input;
  const written = writtenOf(word);
  if (!written || word.glosses.length === 0) return undefined;
  const others = distractors(input);
  if (others.length < OPTIONS - 1) return undefined;
  const ordered = seededOrder([word, ...others], (w) => w.id, `${input.seed}|${word.id}`);
  const drill: MeaningDrill = {
    kind: 'meaning',
    wordId: word.id,
    itemId: itemId('word', word.id),
    word: { written, reading: word.readings[0] ?? written },
    options: ordered.map(optionOf),
    answer: ordered.indexOf(word),
  };
  if (input.reverse) drill.reverse = true;
  return drill;
}
