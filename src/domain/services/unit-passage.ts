/** A unit's passage as a session card (T3 Read step, T6): its lines and 読解 questions. */
import { type ContentLookup, ENGLISH_CONTENT, localUnit } from '../content-language.ts';
import { comprehensionSet } from '../questions/comprehension.ts';
import { passageCard } from '../questions/mix.ts';
import type { SessionCard } from '../session-types.ts';
import { unitById } from '../themes/index.ts';

/**
 * The passage card of a unit, or undefined for an unknown unit. The passage was written at the
 * unit's level and checked at pack time (T2), so the card carries the unit's level. Line
 * translations and question explanations come from `content` when it has the unit (N9).
 */
export function unitPassageCard(
  unitId: string,
  content: ContentLookup = ENGLISH_CONTENT,
): SessionCard | undefined {
  const found = unitById(unitId);
  if (!found) return undefined;
  const unit = localUnit(content, found).value;
  const set = comprehensionSet({
    id: `unit:${unit.id}`,
    sentences: unit.passage.sentences,
    questions: unit.questions,
  });
  if (!set) return undefined;
  const card = passageCard(set);
  return { ...card, sentence: { ...card.sentence, level: unit.level } };
}
