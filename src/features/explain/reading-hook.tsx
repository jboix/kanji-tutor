import type { AiClient, CheckedReading, Result } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import { AiAction, type AiRun } from '../../ui/ai-action.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { ChipRow } from '../../ui/chip.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';
import type { ReadingHookSlotProps } from '../../ui/slots.tsx';
import { AiProblem, Pending } from './ai-status.tsx';
import styles from './explain.module.css';
import { JaText } from './ja-text.tsx';
import { UncheckedReadings, unverified } from './unchecked-readings.tsx';
import { type AiState, useAiState } from './use-ai.ts';
import { wordInput } from './use-word-data.ts';

interface Hook {
  hook: string | undefined;
  readings: CheckedReading[];
}

/** A hook for a reading, asked about one of the learner's words that carries it (A5). */
async function fetchHook(
  repos: Repos,
  client: AiClient,
  props: ReadingHookSlotProps,
): Promise<Result<Hook>> {
  const words = (await repos.dictionary.words(props.wordIds)).flatMap((w) => w ?? []);
  const word = words.find((w) => w.forms.some((f) => f.includes(props.kanji)));
  const form = word?.forms.find((f) => f.includes(props.kanji));
  if (!word || !form) return { ok: true, value: { hook: undefined, readings: [] }, cached: false };
  // Keyed on the word like the word sheet's explanation, so either one fills the other (A15).
  const result = await client.explainWord(wordInput({ text: form }, form, word.id, word));
  if (!result.ok) return result;
  const { hook, readings, reading } = result.value;
  return { ok: true, value: { hook, readings: [reading, ...readings] }, cached: result.cached };
}

function HookNote({ state, onRetry }: { state: AiState<Hook>; onRetry: AiRun }) {
  const t = useT();
  if (state.status === 'loading') return <Pending />;
  if (state.status === 'error') {
    return <AiProblem error={state.error} rest={t('explain.restPage')} onRetry={onRetry} />;
  }
  if (state.status !== 'done') return null;
  const { hook, readings } = state.value;
  if (!hook) return <p className={styles.status}>{t('explain.noHook')}</p>;
  const detail = unverified(readings).length > 0 && <UncheckedReadings readings={readings} />;
  return (
    <AiBlock
      size="xs"
      label={t('explain.hookLabel')}
      readings={readings}
      {...(detail ? { detail } : {})}
    >
      <JaText text={hook} />
    </AiBlock>
  );
}

/**
 * A memory hook under a kanji reading (A5, kanji.html). Fetched only when asked for, so
 * browsing kanji pages spends no calls; answers are cached by the AI layer.
 */
export function ReadingHook(props: ReadingHookSlotProps) {
  const { repos } = useServices();
  const t = useT();
  const [state, start] = useAiState<Hook>();
  const ask = (client: AiClient) => start(() => fetchHook(repos, client, props));
  if (state.status !== 'idle') return <HookNote state={state} onRetry={ask} />;
  return (
    <ChipRow>
      <AiAction label={t('explain.showHook')} run={ask} />
    </ChipRow>
  );
}
