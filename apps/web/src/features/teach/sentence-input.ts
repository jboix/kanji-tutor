/** The no-spoil request for "Explain this sentence" (L3): hidden targets and catalogue grammar. */
import type { ExplainSentenceInput, HiddenTarget } from '../../ai/types.ts';
import type { GrammarEntry } from '../../domain/grammar/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { BlankAnswer } from '../../ui/slots.tsx';

/**
 * The task input: the sentence, its translation, the grammar points and the hidden targets. For
 * a blank (A19), the real sentence and the hidden answer, which joins the hidden targets so its
 * readings are removed from the reply too. The translation would give a word blank away, so it
 * is left out.
 */
export function explainInput(
  card: SessionCard,
  translation: string | undefined,
  grammar: readonly GrammarEntry[],
  hidden: HiddenTarget[],
  blank?: BlankAnswer,
): ExplainSentenceInput {
  const detected = grammar.map((entry) => ({ pattern: entry.pattern, meaning: entry.meaning }));
  if (blank) {
    return {
      sentence: { text: blank.text },
      grammar: detected,
      hidden: [...hidden, { surface: blank.answer, readings: blank.readings }],
      blank: { shown: card.sentence.text, answer: blank.answer },
    };
  }
  return {
    sentence: { text: card.sentence.text, ...(translation ? { translation } : {}) },
    grammar: detected,
    hidden,
  };
}
