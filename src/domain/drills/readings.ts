import { itemId } from '../ids.ts';
import { toKanaFold } from '../kana.ts';
import { KNOWN_LEVEL } from '../selector.ts';
import type { WordLevels } from '../session-types.ts';
import type { KanjiReading, Word } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { ReadingItem, ReadingsDrill } from './types.ts';

export interface ReadingsInput {
  kanji: string;
  /** The kanji's derived readings (K3), with the words that prove them. */
  rows: readonly KanjiReading[];
  /** Dictionary entries of those words. */
  words: ReadonlyMap<string, Word>;
  levels: WordLevels;
  seed: string;
}

/** Words per drill: enough to compare readings, few enough for one screen. */
const MAX_ITEMS = 4;
/** Level 4 readings are solid; a drill needs at least one reading still being learned. */
const SOLID = 4;

function itemFor(row: KanjiReading, input: ReadingsInput, used: Set<string>) {
  const known = (id: string) => !used.has(id) && (input.levels.get(id) ?? 0) >= KNOWN_LEVEL;
  for (const id of seededOrder(row.wordIds, (value) => value, input.seed).filter(known)) {
    const word = input.words.get(id);
    const form = word?.forms.find((f) => f.includes(input.kanji));
    if (!word || form === undefined) continue;
    const item: ReadingItem = {
      wordId: id,
      itemId: itemId('word', id),
      form,
      kanjiReading: row.reading,
      readings: [...new Set(word.readings.map(toKanaFold))],
    };
    return item;
  }
  return undefined;
}

/**
 * One kanji, many readings (R8, 生 in 学生, 生きる, 一生): one known word (level 3 or more) for
 * each of 2–4 derived readings (K3), readings still being learned (level ≤ 3) first. Undefined
 * when fewer than two readings have such a word, or every reading is already solid.
 */
export function readingsDrill(input: ReadingsInput): ReadingsDrill | undefined {
  const rows = seededOrder(input.rows, (r) => r.id, input.seed).sort(
    (a, b) => Number(a.level >= SOLID) - Number(b.level >= SOLID),
  );
  const used = new Set<string>();
  const items: ReadingItem[] = [];
  let learning = false;
  for (const row of rows) {
    const item = items.length < MAX_ITEMS ? itemFor(row, input, used) : undefined;
    if (!item) continue;
    used.add(item.wordId);
    items.push(item);
    learning ||= row.level < SOLID;
  }
  if (items.length < 2 || !learning) return undefined;
  return { kind: 'readings', kanji: input.kanji, items };
}
