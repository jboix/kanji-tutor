/**
 * The grammar cloze of a unit lesson (S3): a passage line with the point's words blanked, the
 * line's meaning shown with it, and two other points of the level to choose from. Several
 * forms can fit a blank grammatically (学生です, 学生じゃありません), so the meaning decides.
 * Pure.
 */
import { detectEntry } from '../grammar/detect.ts';
import type { GrammarEntry } from '../grammar/types.ts';
import { itemId } from '../ids.ts';
import type { Sentence } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { ClozeDrill } from './types.ts';

export interface LessonClozeInput {
  sentence: Sentence;
  entry: GrammarEntry;
  /** Other points whose first form can be a choice: the unit's, then the level's. */
  others: readonly GrammarEntry[];
  seed: string;
}

const CHOICES = 3;

/** The cloze, or undefined when the line does not use the point or has no translation. */
export function lessonCloze(input: LessonClozeInput): ClozeDrill | undefined {
  const { sentence, entry } = input;
  const match = detectEntry(entry, sentence.tokens);
  if (!match || !sentence.translation) return undefined;
  const answer = sentence.text.slice(match.from, match.to);
  const seen = new Set([answer]);
  const others = input.others.flatMap((other) => {
    const text = other.cloze[0];
    if (other.id === entry.id || !text || seen.has(text)) return [];
    seen.add(text);
    return [{ grammarId: other.id, pattern: text }];
  });
  if (others.length < CHOICES - 1) return undefined;
  const picked = [{ grammarId: entry.id, pattern: answer }, ...others.slice(0, CHOICES - 1)];
  return {
    kind: 'cloze',
    sentence,
    grammarId: entry.id,
    itemId: itemId('grammar', entry.id),
    meaning: entry.meaning,
    start: match.from,
    end: match.to,
    choices: seededOrder(picked, (c) => c.grammarId, `${input.seed}|${sentence.id}`),
    hint: sentence.translation,
  };
}
