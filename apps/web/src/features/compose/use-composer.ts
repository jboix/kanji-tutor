import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import type { AiClient, AiErrorKind, Correction } from '../../ai/index.ts';
import {
  acceptComposition,
  type ComposeTarget,
  nextComposeTarget,
} from '../../domain/services/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { useServices } from '../../ui/services.tsx';
import { loadDraft, saveDraft } from './draft-store.ts';

export interface Composer {
  text: string;
  setText: (text: string) => void;
  /** The correction being shown; undefined while writing. */
  correction: Correction | undefined;
  error: AiErrorKind | 'save' | undefined;
  /** After a rate limit: the wait Google asked for, in ms (A14). */
  waitMs: number | undefined;
  busy: boolean;
  /** Check, from its `AiAction`: one correctSentence call (A18). */
  check: (client: AiClient) => Promise<void>;
  /** The tutor's correction of this exact text, if it already wrote one: "Saved". */
  peek: (client: AiClient) => Promise<unknown>;
  rewrite: () => void;
  accept: () => Promise<void>;
}

type Checked = { correction: Correction } | { error: AiErrorKind; waitMs?: number | undefined };

function useDraft(grammarId: string): [string, (text: string) => void] {
  const [text, setTextState] = useState(() => loadDraft(grammarId));
  const setText = (next: string) => {
    setTextState(next);
    saveDraft(grammarId, next);
  };
  return [text, setText];
}

function checkInput(target: ComposeTarget, sentence: string) {
  const { pattern, meaning } = target.grammar;
  return { grammar: { pattern, meaning }, sentence };
}

async function runCheck(
  client: AiClient,
  target: ComposeTarget,
  sentence: string,
): Promise<Checked> {
  try {
    const result = await client.correctSentence(checkInput(target, sentence));
    if (result.ok) return { correction: result.value };
    return { error: result.error.kind, waitMs: result.error.retryAfterMs };
  } catch {
    return { error: 'provider' };
  }
}

/**
 * Saves the sentence, then goes on to the lesson's next grammar point not written with yet;
 * back to Today only once there is none.
 */
function useAccept(target: ComposeTarget) {
  const { repos, lang } = useServices();
  const navigate = useNavigate();
  const t = useT();
  return async (original: string, correction: Correction) => {
    const input = { grammar: target.grammar, original, correction, now: Date.now(), lang };
    await acceptComposition(repos, input);
    saveDraft(target.grammar.id, '');
    const next = await nextComposeTarget(repos, target.grammar.id);
    if (!next) {
      await navigate(paths.today, { replace: true, state: { notice: t('compose.savedAll') } });
      return;
    }
    const to = `${paths.compose}?grammar=${encodeURIComponent(next.grammar.id)}`;
    await navigate(to, { replace: true, state: { notice: t('compose.saved') } });
  };
}

/** The tutor's correction of this exact draft, if it already wrote one (A15, A18). */
function usePeek(target: ComposeTarget, text: string) {
  return useCallback(
    (client: AiClient) => client.peek('correctSentence', checkInput(target, text.trim())),
    [target, text],
  );
}

/** Draft → check → corrected → accept or rewrite (compose.html). The draft is never lost. */
export function useComposer(target: ComposeTarget): Composer {
  const [text, setText] = useDraft(target.grammar.id);
  const [correction, setCorrection] = useState<Correction>();
  const [error, setError] = useState<Composer['error']>();
  const [waitMs, setWaitMs] = useState<number>();
  const [busy, setBusy] = useState(false);
  const save = useAccept(target);
  const peek = usePeek(target, text);
  const check = async (client: AiClient) => {
    const sentence = text.trim();
    if (sentence !== text) setText(sentence);
    setBusy(true);
    const checked = await runCheck(client, target, sentence);
    setBusy(false);
    setError('error' in checked ? checked.error : undefined);
    setWaitMs('error' in checked ? checked.waitMs : undefined);
    if ('correction' in checked) setCorrection(checked.correction);
  };
  const accept = async () => {
    if (!correction) return;
    setBusy(true);
    await save(text, correction).catch(() => {
      setBusy(false);
      setError('save');
    });
  };
  const rewrite = () => setCorrection(undefined);
  return { text, setText, correction, error, waitMs, busy, check, peek, rewrite, accept };
}
