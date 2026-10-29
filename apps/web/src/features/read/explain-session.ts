/**
 * The session's "explain new … first" choices (L7): read once from the settings, changed from an
 * intro's box (saved to the settings as well), and what each card decided on arrival.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { explainsGrammar, explainsKanji } from '../../domain/explain-new.ts';
import type { ExplainKind, ExplainNew } from '../../ui/explain-new.tsx';
import { useServices } from '../../ui/services.tsx';

type Choices = Record<ExplainKind, boolean>;

export interface SessionExplain extends ExplainNew {
  /** The choices the session started with: its cards were built for them. */
  started: Readonly<Choices>;
}

const FIELD = { grammar: 'explainGrammar', kanji: 'explainKanji' } as const;

/** Undefined until the settings are read. */
export function useSessionExplain(): SessionExplain | undefined {
  const { repos } = useServices();
  const [started, setStarted] = useState<Choices>();
  const [on, setOn] = useState<Choices>();
  useEffect(() => {
    void repos.settings.get().then((settings) => {
      const read = { grammar: explainsGrammar(settings), kanji: explainsKanji(settings) };
      setStarted(read);
      setOn(read);
    });
  }, [repos]);
  const set = useCallback(
    (kind: ExplainKind, value: boolean) => {
      setOn((was) => was && { ...was, [kind]: value });
      void repos.settings.patch({ [FIELD[kind]]: value });
    },
    [repos],
  );
  return useMemo(() => (started && on ? { started, on, set } : undefined), [started, on, set]);
}

/**
 * The value as it was when `key` (the card and step) was reached: a box ticked on an intro
 * leaves that intro on screen and only changes the cards after it.
 */
export function useOnArrival<T>(key: string, value: T): T {
  const [held, setHeld] = useState({ key, value });
  if (held.key !== key) {
    setHeld({ key, value });
    return value;
  }
  return held.value;
}
