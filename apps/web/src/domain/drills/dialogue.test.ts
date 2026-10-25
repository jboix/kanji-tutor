import { describe, expect, it } from 'vitest';
import { GRAMMAR_DIALOGUES } from '../dialogues/catalogue.ts';
import type { Dialogue } from '../dialogues/types.ts';
import { dialogueDrill } from './dialogue.ts';

const ALL: Dialogue[] = GRAMMAR_DIALOGUES.flatMap((set) => [...set.dialogues]);

describe('the "complete the line" drill', () => {
  it('offers the answer and its three distractors, in a seeded order', () => {
    for (const set of GRAMMAR_DIALOGUES) {
      for (const dialogue of set.dialogues) {
        const drill = dialogueDrill({ grammarId: set.grammarId, dialogue, seed: 'a' });
        expect(drill, dialogue.id).toBeDefined();
        expect(drill?.choices).toHaveLength(4);
        expect(drill?.choices).toContain(drill?.answer);
        expect(drill?.itemId).toBe(`grammar:${set.grammarId}`);
      }
    }
    const dialogue = ALL[0] as Dialogue;
    const again = (seed: string) => dialogueDrill({ grammarId: 'x', dialogue, seed })?.choices;
    expect(again('a')).toEqual(again('a'));
  });

  it('is not made on a blanked line without its form', () => {
    const dialogue = ALL[0] as Dialogue;
    const broken = { ...dialogue, blank: { ...dialogue.blank, line: 0 } };
    expect(dialogueDrill({ grammarId: 'x', dialogue: broken, seed: 'a' })).toBeUndefined();
  });
});
