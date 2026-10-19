import { useState } from 'react';
import type { AiClient, Answer, FollowUpKind, SentenceContext } from '../../ai/types.ts';
import { AiAskInput, type AiRun } from '../../ui/ai-action.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { AskSlotProps } from '../../ui/slots.tsx';
import { AiProblem, Pending } from './ai-status.tsx';
import type { ChipContext } from './chip-actions.ts';
import styles from './explain.module.css';
import { ChipOutcomeView } from './follow-up-view.tsx';
import { ImmersionFooter, JaText } from './ja-text.tsx';
import { contextOf, followUpChips } from './sentence-context.ts';
import { UncheckedReadings, unverified } from './unchecked-readings.tsx';
import { type AiState, useAiState } from './use-ai.ts';
import { useChips } from './use-chips.tsx';

/** What a chip under an answer acts on: the scope of the question. */
interface AnswerScope {
  context: SentenceContext;
  sentenceId: string;
  surface?: string | undefined;
  wordId?: string | undefined;
}

/** Simpler, one more example and keep under every answer (A3). */
const ANSWER_CHIPS: readonly FollowUpKind[] = ['simpler', 'example', 'keep'];

function AnswerNote({ value, scope }: { value: Answer; scope: AnswerScope }) {
  const t = useT();
  const surface = scope.surface ?? scope.context.text;
  const chipContext: ChipContext = {
    sentence: scope.context,
    sentenceId: scope.sentenceId,
    surface,
    wordId: scope.wordId,
    previous: value.answer,
  };
  const { buttons, state, onWriteNew, retry } = useChips(
    followUpChips(t, [], surface, ANSWER_CHIPS),
    chipContext,
  );
  const detail = unverified(value.readings).length > 0 && (
    <UncheckedReadings readings={value.readings} />
  );
  return (
    <>
      <AiBlock
        size="sm"
        label={t('explain.answerLabel')}
        chips={buttons}
        readings={value.readings}
        {...(detail ? { detail } : {})}
      >
        <JaText text={value.answer} immersion={value.immersion} />
        <ImmersionFooter immersion={value.immersion} />
      </AiBlock>
      <ChipOutcomeView state={state} onWriteNew={onWriteNew} onRetry={retry} />
    </>
  );
}

interface AskAnswerProps {
  state: AiState<Answer>;
  question: string;
  scope: AnswerScope;
  onRetry: AiRun;
}

function AskAnswer(props: AskAnswerProps) {
  const { state, question } = props;
  const { t, rich } = useI18n();
  if (state.status === 'idle') return null;
  if (state.status === 'loading') return <Pending>{t('explain.thinking')}</Pending>;
  if (state.status === 'error') return <AiProblem error={state.error} onRetry={props.onRetry} />;
  return (
    <div className={styles.answer}>
      <p className={styles.asked}>
        {rich('explain.youAsked', { question: <JaText text={question} /> })}
      </p>
      <AnswerNote key={state.value.answer} value={state.value} scope={props.scope} />
    </div>
  );
}

/**
 * A question box scoped to a sentence, or to one word in it (A4), typed or dictated. Only the
 * last answer stays: it is a question about this sentence, not a chat.
 */
export function AskField(scope: AnswerScope) {
  const { context, surface } = scope;
  const t = useT();
  const [state, start] = useAiState<Answer>();
  const [question, setQuestion] = useState('');
  const ask = (client: AiClient, text: string) => {
    setQuestion(text);
    const scope = surface
      ? ({ scope: 'word', surface } as const)
      : ({ scope: 'sentence' } as const);
    start(() => client.answerQuestion({ ...scope, sentence: context, question: text }));
  };
  const about = surface ? t('explain.askAbout', { surface }) : t('explain.askAboutSentence');
  return (
    <div className={styles.ask}>
      <AskAnswer
        state={state}
        question={question}
        scope={scope}
        onRetry={(client) => ask(client, question)}
      />
      <AiAskInput
        label={about}
        placeholder={`${about}…`}
        onAsk={ask}
        dictateLabel={t('explain.askByVoice')}
      />
    </div>
  );
}

/** The question box under a session sentence (A4, read.html). */
export function AskBox({ sentence, surface }: AskSlotProps) {
  return <AskField context={contextOf(sentence)} sentenceId={sentence.id} surface={surface} />;
}
