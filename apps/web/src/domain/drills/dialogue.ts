/**
 * "Complete the line" on a grammar dialogue: the blanked line's focus is the answer, its three
 * distractors the other choices, in an order fixed by the seed. Pure.
 */
import { focusRange } from '../dialogues/lines.ts';
import type { Dialogue } from '../dialogues/types.ts';
import { itemId } from '../ids.ts';
import { seededOrder } from './seed.ts';
import type { DialogueDrill } from './types.ts';

export interface DialogueInput {
  grammarId: string;
  dialogue: Dialogue;
  seed: string;
}

/** The drill, or undefined when the blanked line has no focus in its text. */
export function dialogueDrill(input: DialogueInput): DialogueDrill | undefined {
  const { dialogue, grammarId } = input;
  const line = dialogue.lines[dialogue.blank.line];
  const answer = line?.focus;
  if (!line || !answer || !focusRange(line)) return undefined;
  const choices = [...new Set([answer, ...dialogue.blank.distractors])];
  return {
    kind: 'dialogue',
    grammarId,
    itemId: itemId('grammar', grammarId),
    dialogue,
    answer,
    choices: seededOrder(choices, String, `${input.seed}|${dialogue.id}`),
  };
}
