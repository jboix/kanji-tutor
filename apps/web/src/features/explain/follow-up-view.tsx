import { useState } from 'react';
import type { FollowUpResult } from '../../ai/types.ts';
import { translationIn } from '../../domain/localized.ts';
import type { Sentence } from '../../domain/types.ts';
import { AiAction, type AiRun } from '../../ui/ai-action.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { TutorMark } from '../../ui/tutor-mark.tsx';
import { AiProblem, Pending } from './ai-status.tsx';
import type { ChipOutcome } from './chip-actions.ts';
import styles from './explain.module.css';
import { ImmersionFooter, JaText } from './ja-text.tsx';
import { UncheckedReadings } from './unchecked-readings.tsx';
import type { AiState } from './use-ai.ts';

type Quiz = NonNullable<FollowUpResult['quiz']>;

/** A one-question check: no score and no praise, just the right option. */
function QuizView({ quiz }: { quiz: Quiz }) {
  const { t, rich } = useI18n();
  const [picked, setPicked] = useState<number>();
  const right = quiz.options[quiz.answerIndex] ?? '';
  return (
    <div className={styles.quiz}>
      <Ja variant="line">{quiz.question}</Ja>
      <ChipRow>
        {quiz.options.map((option, i) => (
          <Chip key={option} lang="ja" aria-pressed={picked === i} onClick={() => setPicked(i)}>
            {option}
          </Chip>
        ))}
      </ChipRow>
      {picked !== undefined && (
        <p className={styles.status} role="status">
          {picked === quiz.answerIndex
            ? t('explain.quizRight')
            : rich('explain.quizAnswer', { answer: <Ja>{right}</Ja> })}
        </p>
      )}
    </div>
  );
}

function FollowUpNote({ result }: { result: FollowUpResult }) {
  const t = useT();
  return (
    <AiBlock
      size="sm"
      label={t('explain.followUpLabel')}
      readings={result.readings}
      detail={<UncheckedReadings readings={result.readings} />}
    >
      <JaText text={result.text} immersion={result.immersion} />
      <ImmersionFooter immersion={result.immersion} />
      {result.example && (
        <>
          <Ja variant="line">{result.example.text}</Ja>
          <span className={styles.gloss}>{result.example.translation}</span>
        </>
      )}
      {result.quiz && <QuizView quiz={result.quiz} />}
    </AiBlock>
  );
}

function AddedSentences({ added }: { added: Sentence[] }) {
  const t = useT();
  if (added.length === 0) {
    return (
      <p className={styles.status} role="status">
        {t('explain.noneAdded')}
      </p>
    );
  }
  return (
    <div className={styles.added} role="status">
      <p className={styles.status}>{t('explain.added')}</p>
      <ul className={styles.sentences}>
        {added.map((sentence) => (
          <li key={sentence.id}>
            <Ja variant="line">{sentence.text}</Ja>
            <span className={styles.gloss}>{sentence.translation}</span>
            <TutorMark of={sentence} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A pack sentence's translation in the learner's language, or the English one marked (N9). */
function PackTranslation({ sentence }: { sentence: Sentence }) {
  const { language } = useI18n();
  const { value, fallback } = translationIn(sentence, language);
  if (!value) return null;
  return (
    <span className={styles.gloss}>
      {value}
      <EnMark english={fallback} />
    </span>
  );
}

/** Sentences with the word already in the packs: app data, no seal (A15). */
function PackExamples({
  sentences,
  onWriteNew,
}: {
  sentences: Sentence[];
  onWriteNew?: AiRun | undefined;
}) {
  const t = useT();
  return (
    <div className={styles.added} role="status">
      <p className={styles.status}>
        {sentences.length > 0 ? t('explain.fromSentences') : t('explain.noOtherSentence')}
      </p>
      <ul className={styles.sentences}>
        {sentences.map((sentence) => (
          <li key={sentence.id}>
            <Ja variant="line">{sentence.text}</Ja>
            <PackTranslation sentence={sentence} />
            <TutorMark of={sentence} />
          </li>
        ))}
      </ul>
      {onWriteNew && (
        <ChipRow>
          <AiAction label={t('explain.writeNew')} run={onWriteNew} />
        </ChipRow>
      )}
    </div>
  );
}

function Outcome({
  outcome,
  onWriteNew,
}: {
  outcome: ChipOutcome;
  onWriteNew?: AiRun | undefined;
}) {
  const t = useT();
  if (outcome.type === 'followUp') return <FollowUpNote result={outcome.result} />;
  if (outcome.type === 'sentences') return <AddedSentences added={outcome.added} />;
  if (outcome.type === 'examples') {
    return <PackExamples sentences={outcome.sentences} onWriteNew={onWriteNew} />;
  }
  return (
    <p className={styles.status} role="status">
      {t('explain.kept')}
    </p>
  );
}

/** What the last tapped chip produced, below the explanation. */
export function ChipOutcomeView(props: {
  state: AiState<ChipOutcome>;
  rest?: string;
  onWriteNew?: AiRun | undefined;
  /** Runs the chip again after a rate limit (A14). */
  onRetry?: AiRun | undefined;
}) {
  const { state, rest } = props;
  if (state.status === 'idle') return null;
  if (state.status === 'loading') return <Pending />;
  if (state.status === 'error')
    return <AiProblem error={state.error} onRetry={props.onRetry} {...(rest ? { rest } : {})} />;
  return <Outcome outcome={state.value} onWriteNew={props.onWriteNew} />;
}
