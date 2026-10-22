import { alignReading, type ReadingSegment } from './align.ts';
import type { Grade, Item, Kanji, KanjiReading, KnowledgeLevel, Word } from './types.ts';

export { alignReading, type ReadingSegment, type RubyPart, rubyParts } from './align.ts';

/** Context of a graded answer that affects the next level. */
export interface LevelContext {
  /** True when the word appeared in a sentence the learner had not seen it in before. */
  newContext: boolean;
}

/**
 * Next knowledge level after a graded answer (K2). Any graded item has at least been seen (1).
 *
 * - correct (kana variants included): up one level; 3 → 4 only in a new context, so a word read
 *   in the same sentence again stays at 3 ("reads in a familiar word"); 4 stays 4.
 * - near-miss: keeps the level; the reading was nearly right but not proven.
 * - wrong: drops to 2 ("knows meaning") from 3 or 4; 0–2 stay where they are.
 */
export function nextLevel(item: Item, grade: Grade, context: LevelContext): KnowledgeLevel {
  const seen = Math.max(item.level, 1) as KnowledgeLevel;
  if (grade.verdict === 'near-miss') return seen;
  if (grade.verdict === 'wrong') return Math.min(seen, 2) as KnowledgeLevel;
  const cap = context.newContext ? 4 : 3;
  return Math.max(seen, Math.min(item.level + 1, cap)) as KnowledgeLevel;
}

/** A word with the learner's level for it. */
export interface KnownWord {
  word: Word;
  level: KnowledgeLevel;
}

/**
 * Kanji segments of a form read with the word's primary reading. Only the primary reading
 * counts: knowing 今日 as きょう says nothing about こんにち (今:コン, 日:ニチ).
 */
function provenSegments(form: string, word: Word, kanji: ReadonlyMap<string, Kanji>) {
  const [reading] = word.readings;
  if (reading === undefined) return [];
  return alignReading(form, reading, kanji).filter(isKanjiSegment);
}

type KanjiSegment = ReadingSegment & { kanji: string; kanjiReading: string };

function isKanjiSegment(segment: ReadingSegment): segment is KanjiSegment {
  return segment.kanji !== undefined && segment.kanjiReading !== undefined;
}

/** Distinct `<char>:<reading>` pairs a word proves, across all its written forms. */
function pairsOf(word: Word, kanji: ReadonlyMap<string, Kanji>): Map<string, KanjiSegment> {
  const pairs = new Map<string, KanjiSegment>();
  for (const form of word.forms) {
    for (const segment of provenSegments(form, word, kanji)) {
      pairs.set(`${segment.kanji}:${segment.kanjiReading}`, segment);
    }
  }
  return pairs;
}

function credit(byId: Map<string, KanjiReading>, id: string, s: KanjiSegment, known: KnownWord) {
  const entry = byId.get(id) ?? {
    id,
    kanji: s.kanji,
    reading: s.kanjiReading,
    level: known.level,
    wordIds: [],
  };
  entry.level = Math.max(entry.level, known.level) as KnowledgeLevel;
  if (!entry.wordIds.includes(known.word.id)) entry.wordIds.push(known.word.id);
  byId.set(id, entry);
}

/**
 * Derives kanji–reading levels from the words that contain them (K3): the level of 生:セイ is
 * the best level among words where 生 is read セイ. Reading 学生 does not prove 生きる.
 * Unseen words (level 0) prove nothing. Only a word's primary reading counts, and words whose
 * reading cannot be aligned to their kanji (jukujikun such as 今日/きょう) are skipped.
 * Results are sorted by id.
 */
export function deriveKanjiReadings(
  words: readonly KnownWord[],
  kanji: ReadonlyMap<string, Kanji>,
): KanjiReading[] {
  const byId = new Map<string, KanjiReading>();
  for (const known of words) {
    if (known.level === 0) continue;
    for (const [id, segment] of pairsOf(known.word, kanji)) credit(byId, id, segment, known);
  }
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
}
