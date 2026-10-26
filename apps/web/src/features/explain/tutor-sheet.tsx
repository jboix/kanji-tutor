/**
 * The tutor's conversation sheet (A4), opened from every 解 button: what it is about, the
 * questions asked and their answers, suggested questions and the ask box. Each question, typed,
 * dictated or a chip, is one request carrying the answers before it.
 */
import { useEffect, useRef } from 'react';
import { AiAction, AiAskInput, type AiRun } from '../../ui/ai-action.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { TutorQuestion, TutorSheetSlotProps } from '../../ui/slots.tsx';
import { TutorHeading } from '../../ui/tutor.tsx';
import { AiProblem, Pending } from './ai-status.tsx';
import { ImmersionFooter, JaText } from './ja-text.tsx';
import { useNoSpoil } from './no-spoil.tsx';
import styles from './tutor-sheet.module.css';
import { UncheckedReadings, unverified } from './unchecked-readings.tsx';
import { type Turn, useConversation } from './use-conversation.ts';

function Reply({ turn, onRetry }: { turn: Turn; onRetry: AiRun }) {
  const t = useT();
  const { clean } = useNoSpoil();
  const { state } = turn;
  if (state.status === 'loading') return <Pending>{t('explain.thinking')}</Pending>;
  if (state.status === 'error') return <AiProblem error={state.error} onRetry={onRetry} />;
  if (state.status !== 'done') return null;
  const value = clean(state.value);
  const detail = unverified(value.readings).length > 0 && (
    <UncheckedReadings readings={value.readings} />
  );
  return (
    <AiBlock
      size="sm"
      label={t('explain.answerLabel')}
      readings={value.readings}
      cached={state.cached}
      {...(detail ? { detail } : {})}
    >
      <JaText text={value.answer} immersion={value.immersion} />
      <ImmersionFooter immersion={value.immersion} />
    </AiBlock>
  );
}

function TurnView({ turn, onRetry }: { turn: Turn; onRetry: AiRun }) {
  return (
    <li className={styles.turn}>
      <p className={styles.question}>
        <JaText text={turn.question} emph={false} />
      </p>
      <Reply turn={turn} onRetry={onRetry} />
    </li>
  );
}

interface Suggestion {
  label: string;
  question: string;
}

/** The starters before any question; after an answer, ways to go on from it. */
function useSuggestions(starters: readonly string[], turns: readonly Turn[]): Suggestion[] {
  const t = useT();
  if (turns.length === 0) return starters.map((s) => ({ label: s, question: s }));
  if (turns.at(-1)?.state.status !== 'done') return [];
  return [
    { label: t('explain.tutorSimpler'), question: t('explain.tutorSimplerAsk') },
    { label: t('explain.tutorExample'), question: t('explain.tutorExampleAsk') },
  ];
}

/** Asks the question pressed outside the sheet, once, as it opens. */
function useFirst(
  first: TutorQuestion | undefined,
  ask: (client: TutorQuestion['client'], q: string) => void,
) {
  const asked = useRef(false);
  useEffect(() => {
    if (!first || asked.current) return;
    asked.current = true;
    ask(first.client, first.question);
  }, [first, ask]);
}

export function TutorSheet({ topic, starters, first, resume, onClose }: TutorSheetSlotProps) {
  const t = useT();
  const { turns, ask, retry } = useConversation(topic, resume);
  useFirst(first, ask);
  const suggestions = useSuggestions(starters, turns);
  return (
    <BottomSheet
      open
      onClose={onClose}
      label={t('explain.tutorLabel', { about: topic.about })}
      header={<TutorHeading about={topic.about} />}
    >
      {turns.length === 0 && <p className={styles.empty}>{t('explain.tutorEmpty')}</p>}
      <ol className={styles.thread} aria-live="polite">
        {turns.map((turn) => (
          <TurnView key={turn.id} turn={turn} onRetry={(client) => retry(client, turn)} />
        ))}
      </ol>
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((s) => (
            <AiAction key={s.label} label={s.label} run={(client) => ask(client, s.question)} />
          ))}
        </div>
      )}
      <AiAskInput
        label={t('explain.tutorAsk')}
        placeholder={t('explain.tutorPlaceholder')}
        onAsk={ask}
        dictateLabel={t('explain.askByVoice')}
      />
    </BottomSheet>
  );
}
