import { useCallback, useMemo, useState } from 'react';
import type { AiClient, MemoryHookInput } from '../../ai/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlock, AiWriting } from '../../ui/ai-block.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ImmersionFooter, JaProse, OffLanguage, TutorProblem, Unconfirmed } from './ja-prose.tsx';
import styles from './teach.module.css';
import { useAiResult } from './use-ai-result.ts';
import type { WordTeaching } from './word-teaching.ts';

function hookInput(teaching: WordTeaching, sentence: string): MemoryHookInput {
  return {
    word: {
      surface: teaching.surface,
      reading: teaching.reading ?? '',
      meaning: teaching.meanings.slice(0, 2).join('; '),
    },
    kanji: teaching.kanji.map((k) => ({
      char: k.char,
      meanings: k.meanings,
      parts: k.parts.map((p) =>
        p.meaning ? { char: p.char, meaning: p.meaning } : { char: p.char },
      ),
    })),
    sentence: { text: sentence },
  };
}

/** The hook built from the parts, without AI: plain ink, no seal (L1). */
export function PartsHooks({ hooks }: { hooks: readonly string[] }) {
  const t = useT();
  if (hooks.length === 0) {
    return <p className={styles.muted}>{t('teach.readAgain')}</p>;
  }
  return (
    <ul className={styles.lines}>
      {hooks.map((hook) => (
        <li key={hook}>
          <JaProse text={hook} />
        </li>
      ))}
    </ul>
  );
}

function TutorHook({ input, client }: { input: MemoryHookInput; client: AiClient }) {
  const t = useT();
  const run = useCallback(() => client.memoryHook(input), [client, input]);
  const state = useAiResult(run);
  if (state.status === 'loading') {
    return <AiWriting>{t('teach.writingHook')}</AiWriting>;
  }
  if (state.status === 'error') return <TutorProblem error={state.error} onRetry={state.retry} />;
  const { value, offLanguage } = state;
  const flagged = offLanguage || value.readings.some((reading) => !reading.verified);
  const detail = flagged ? (
    <>
      <Unconfirmed readings={value.readings} />
      <OffLanguage off={offLanguage} />
    </>
  ) : undefined;
  return (
    <AiBlock
      label={t('teach.hookLabel')}
      size="sm"
      readings={value.readings}
      offLanguage={offLanguage}
      {...(detail ? { detail } : {})}
    >
      <p className={styles.para}>
        <JaProse text={value.hook} immersion={value.immersion} />
      </p>
      <ImmersionFooter immersion={value.immersion} />
    </AiBlock>
  );
}

/**
 * The memory hook (L1, A5): the hook built from the parts, always; the tutor's, built from what
 * the learner knows, only after "Ask the tutor for a hook" (D41: AI only when asked).
 */
export function MemoryHookView({
  teaching,
  sentence,
}: {
  teaching: WordTeaching;
  sentence: string;
}) {
  const t = useT();
  const [client, setClient] = useState<AiClient>();
  const input = useMemo(() => hookInput(teaching, sentence), [teaching, sentence]);
  const peek = useCallback((c: AiClient) => c.peek('memoryHook', input), [input]);
  return (
    <>
      <PartsHooks hooks={teaching.hooks} />
      {client ? (
        <TutorHook input={input} client={client} />
      ) : (
        <div className={styles.ask}>
          <AiAction label={t('teach.askHook')} run={setClient} peek={peek} />
        </div>
      )}
    </>
  );
}
