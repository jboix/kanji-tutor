import { useCallback, useEffect, useState } from 'react';
import type { AiClient, AiError, Result, WeeklyNotes } from '../../ai/types.ts';
import { ungroundedClaims, type WeekReport } from '../../domain/services/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { plainLetter } from './notes-copy.ts';

/** Why the plain letter is shown instead of the AI one. */
export type PlainReason =
  | { kind: 'error'; error: AiError }
  | { kind: 'ungrounded'; claims: string[] };

/**
 * The weekly letter: the plain version of the real stats, or the tutor's wording of them once
 * asked (A13). `canAsk` offers the button; `writing` while the tutor writes.
 */
export type Letter =
  | { kind: 'loading' }
  | { kind: 'ai'; paragraphs: string[] }
  | {
      kind: 'plain';
      paragraphs: string[];
      reason?: PlainReason;
      canAsk?: boolean;
      writing?: boolean;
    };

function plain(
  t: Translate,
  report: WeekReport,
  extra: { reason?: PlainReason; canAsk?: boolean } = {},
): Letter {
  return { kind: 'plain', paragraphs: plainLetter(t, report.stats), ...extra };
}

/**
 * The tutor's letter is used only when every number in digits and every Japanese phrase in it
 * comes from the stats; otherwise the plain letter is shown and the claims are named.
 */
function checked(t: Translate, report: WeekReport, notes: WeeklyNotes): Letter {
  const days = [new Date(report.start).getDate(), new Date(report.end - 1).getDate()];
  const claims = ungroundedClaims(notes.letter, report.stats, days);
  if (claims.length > 0) return plain(t, report, { reason: { kind: 'ungrounded', claims } });
  return { kind: 'ai', paragraphs: notes.letter };
}

function settled(t: Translate, report: WeekReport, result: Result<WeeklyNotes>): Letter {
  if (!result.ok)
    return plain(t, report, { reason: { kind: 'error', error: result.error }, canAsk: true });
  return checked(t, report, result.value);
}

function thrown(error: unknown): PlainReason {
  const message = error instanceof Error ? error.message : '';
  return { kind: 'error', error: { kind: 'provider', message } };
}

/** The plain letter at once, offering the tutor's when the week has stats. */
function usePlainFirst(report: WeekReport | undefined) {
  const t = useT();
  const [letter, setLetter] = useState<Letter>({ kind: 'loading' });
  useEffect(() => {
    if (report) setLetter(plain(t, report, { canAsk: report.stats.sentencesRead > 0 }));
  }, [report, t]);
  return [letter, setLetter] as const;
}

export interface LetterControls {
  letter: Letter;
  /** "Ask the tutor to write this week's letter", from its `AiAction`: one weeklyNotes call. */
  ask: (client: AiClient) => void;
  /** The letter the tutor already wrote for these stats, if any: the button says "Saved". */
  peek: (client: AiClient) => Promise<unknown>;
}

/**
 * The letter for this report: the plain one at once; `ask` has the tutor write it (one
 * weeklyNotes call, or the cached letter with none, A15). An empty week never offers it.
 */
export function useLetter(report: WeekReport | undefined): LetterControls {
  const [letter, setLetter] = usePlainFirst(report);
  const t = useT();
  const ask = useCallback(
    (client: AiClient) => {
      if (!report) return;
      setLetter({ kind: 'plain', paragraphs: plainLetter(t, report.stats), writing: true });
      client.weeklyNotes({ stats: report.stats }).then(
        (result) => setLetter(settled(t, report, result)),
        (error: unknown) => setLetter(plain(t, report, { reason: thrown(error), canAsk: true })),
      );
    },
    [report, setLetter, t],
  );
  const peek = useCallback(
    async (client: AiClient) =>
      report ? client.peek('weeklyNotes', { stats: report.stats }) : undefined,
    [report],
  );
  return { letter, ask, peek };
}
