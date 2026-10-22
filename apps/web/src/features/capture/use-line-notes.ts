/** Tap a line (C4): one AI translation and explanation per line, asked once and kept. */
import { useCallback, useState } from 'react';
import type { AiClient, AiErrorKind, Answer } from '../../ai/types.ts';
import { citedPhrases } from '../../domain/services/index.ts';

export type LineNote =
  | { status: 'loading' }
  | { status: 'ready'; answer: Answer; cited: string[] }
  | { status: 'error'; kind: AiErrorKind; waitMs?: number | undefined };

/** The question asked for every line; `answerQuestion` returns verified readings with it (A8). */
export const LINE_QUESTION = 'Translate and explain this line for an N3 learner.';

function lineInput(lesson: string, text: string) {
  return {
    scope: 'sentence' as const,
    sentence: lesson ? { text, lesson } : { text },
    question: LINE_QUESTION,
  };
}

export function useLineNotes(lesson: string) {
  const [notes, setNotes] = useState<ReadonlyMap<number, LineNote>>(new Map());
  const set = useCallback((line: number, note: LineNote) => {
    setNotes((current) => new Map(current).set(line, note));
  }, []);
  const input = useCallback((text: string) => lineInput(lesson, text), [lesson]);
  /** The tutor's note for a line, if it already wrote one: no request (A15, A18). */
  const peekLine = useCallback(
    (client: AiClient, text: string) => client.peek('answerQuestion', input(text)),
    [input],
  );
  const explain = useCallback(
    async (client: AiClient, line: number, text: string) => {
      set(line, { status: 'loading' });
      const result = await client.answerQuestion(input(text)).catch(() => undefined);
      if (result?.ok) {
        const cited = citedPhrases(result.value.answer, text);
        return set(line, { status: 'ready', answer: result.value, cited });
      }
      const error = result?.ok === false ? result.error : undefined;
      set(line, { status: 'error', kind: error?.kind ?? 'provider', waitMs: error?.retryAfterMs });
    },
    [input, set],
  );
  return { notes, explain, peekLine };
}
