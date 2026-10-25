/**
 * Grammar dialogues (pure): the lines helpers, and the data, loaded on demand so it stays out of
 * the app shell.
 */
import type { GrammarDialogues } from './types.ts';

export { blankedText, dialogueText, focusRange, spokenLines } from './lines.ts';
export type * from './types.ts';

let loading: Promise<ReadonlyMap<string, GrammarDialogues>> | undefined;

/** Every point's dialogues by grammar id, loading their chunk once. */
export function loadDialogues(): Promise<ReadonlyMap<string, GrammarDialogues>> {
  if (!loading) {
    loading = import('./catalogue.ts').then(
      ({ GRAMMAR_DIALOGUES }) => new Map(GRAMMAR_DIALOGUES.map((set) => [set.grammarId, set])),
    );
    loading.catch(() => {
      loading = undefined;
    });
  }
  return loading;
}
