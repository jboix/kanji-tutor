/** Tap a line of a scanned page: one translation and explanation from the tutor, asked once and kept. */
import { useCallback, useState } from 'react';
import type { AiClient, AiErrorKind, Answer } from '../../ai/types.ts';

export type LineNote =
  | { status: 'loading' }
  | { status: 'ready'; answer: Answer }
  | { status: 'error'; kind: AiErrorKind; waitMs?: number | undefined };

/** The question asked for every line; `answerQuestion` returns its readings verified (A8). */
const LINE_QUESTION = 'Translate and explain this line for the learner.';

function lineInput(text: string, lesson: string | undefined) {
  return {
    scope: 'sentence' as const,
    sentence: lesson ? { text, lesson } : { text },
    question: LINE_QUESTION,
  };
}

/** Notes by line key; `peek` finds a note the tutor already wrote, with no request (A15). */
export function useLineNotes(lesson: string | undefined) {
  const [notes, setNotes] = useState<ReadonlyMap<string, LineNote>>(new Map());
  const set = useCallback((key: string, note: LineNote) => {
    setNotes((current) => new Map(current).set(key, note));
  }, []);
  const peek = useCallback(
    (client: AiClient, text: string) => client.peek('answerQuestion', lineInput(text, lesson)),
    [lesson],
  );
  const explain = useCallback(
    async (client: AiClient, key: string, text: string) => {
      set(key, { status: 'loading' });
      const result = await client.answerQuestion(lineInput(text, lesson)).catch(() => undefined);
      if (result?.ok) return set(key, { status: 'ready', answer: result.value });
      const error = result?.ok === false ? result.error : undefined;
      set(key, { status: 'error', kind: error?.kind ?? 'provider', waitMs: error?.retryAfterMs });
    },
    [lesson, set],
  );
  return { notes, explain, peek };
}
