/** Every grammar point's dialogues. Loaded on demand through `loadDialogues`, out of the shell. */
import { APPEARANCE_DIALOGUES } from './appearance.ts';
import { ASPECT_DIALOGUES } from './aspect.ts';
import { CONJECTURE_DIALOGUES } from './conjecture.ts';
import { DECISION_DIALOGUES } from './decision.ts';
import { INTENTION_DIALOGUES } from './intention.ts';
import type { GrammarDialogues } from './types.ts';

export const GRAMMAR_DIALOGUES: readonly GrammarDialogues[] = [
  ...DECISION_DIALOGUES,
  ...INTENTION_DIALOGUES,
  ...APPEARANCE_DIALOGUES,
  ...CONJECTURE_DIALOGUES,
  ...ASPECT_DIALOGUES,
];
