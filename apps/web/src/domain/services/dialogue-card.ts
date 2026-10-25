/**
 * The "complete the line" drill card on a grammar point's dialogues, for the sessions that drill
 * grammar: a unit lesson's 文法 section and a focus session on one point. It comes after the
 * point's introduction, never before. Which dialogue changes with the seed.
 */

import { loadDialogues } from '../dialogues/index.ts';
import { dialogueDrill } from '../drills/index.ts';
import { seededOrder } from '../drills/seed.ts';
import type { SessionCard } from '../session-types.ts';
import { drillCard } from './drills.ts';

/** The card on one of the point's dialogues; undefined when the point has none. */
export async function dialogueCard(
  grammarId: string,
  seed: string,
): Promise<SessionCard | undefined> {
  const set = (await loadDialogues()).get(grammarId);
  if (!set) return undefined;
  const [dialogue] = seededOrder(set.dialogues, (d) => d.id, `dialogue|${seed}`);
  const drill = dialogue && dialogueDrill({ grammarId, dialogue, seed });
  return drill && drillCard(drill);
}
