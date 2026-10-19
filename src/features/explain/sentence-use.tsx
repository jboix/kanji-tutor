import { useCallback } from 'react';
import type { AiClient, Answer, QuestionInput, SentenceContext } from '../../ai/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { AiProblem, Pending } from './ai-status.tsx';
import { ImmersionFooter, JaText } from './ja-text.tsx';
import { UncheckedReadings, unverified } from './unchecked-readings.tsx';
import { useAiState } from './use-ai.ts';

/** The one sentence-specific question, so its answer is cached per sentence and word (A15). */
export function inSentenceQuestion(surface: string): string {
  return `What does ${surface} mean and do in this sentence?`;
}

function questionInput(sentence: SentenceContext, surface: string): QuestionInput {
  return { scope: 'word', sentence, surface, question: inSentenceQuestion(surface) };
}

function UseNote({ value, surface }: { value: Answer; surface: string }) {
  const t = useT();
  const detail = unverified(value.readings).length > 0 && (
    <UncheckedReadings readings={value.readings} />
  );
  return (
    <AiBlock
      size="sm"
      label={t('explain.inSentence', { surface })}
      readings={value.readings}
      {...(detail ? { detail } : {})}
    >
      <JaText text={value.answer} immersion={value.immersion} />
      <ImmersionFooter immersion={value.immersion} />
    </AiBlock>
  );
}

/**
 * "What it does in this sentence" (A15): the part of a word's explanation that depends on the
 * sentence, asked separately and only when wanted. The `label` names the button.
 */
export function SentenceUse(props: { sentence: SentenceContext; surface: string; label: string }) {
  const { sentence, surface } = props;
  const peek = useCallback(
    (client: AiClient) => client.peek('answerQuestion', questionInput(sentence, surface)),
    [sentence, surface],
  );
  const [state, start] = useAiState<Answer>();
  const ask = (client: AiClient) =>
    start(() => client.answerQuestion(questionInput(sentence, surface)));
  if (state.status === 'done') return <UseNote value={state.value} surface={surface} />;
  if (state.status === 'loading') return <Pending />;
  if (state.status === 'error') return <AiProblem error={state.error} onRetry={ask} />;
  return <AiAction label={props.label} run={ask} peek={peek} />;
}
