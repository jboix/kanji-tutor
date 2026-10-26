/**
 * A question from a scanned handout (scans/Practice): where it is printed, with the page's photo
 * a tap away, the question to answer by choice or typed, and then the tutor's answer, marked as
 * the tutor's since the handout prints none, with its explanation. A free answer is marked by the
 * learner against the tutor's. The tutor is in reach before and after the answer.
 */
import { type ReactNode, useId, useMemo, useState } from 'react';
import type { HandoutQuestion } from '../../domain/scan-types.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { Grade } from '../../domain/types.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { AnswerState, answerLook } from '../../ui/answer-state.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { Ja, StruckAnswer } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { PhotoSheet } from '../../ui/photo-sheet.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TutorChip, TutorNext, useTutor } from '../../ui/tutor.tsx';
import { ChoiceActions } from './drill-choices.tsx';
import styles from './handout.module.css';
import { HandoutStem } from './handout-stem.tsx';
import read from './read.module.css';
import type { DrillResult } from './session-state.ts';
import { SkipButton } from './skip-button.tsx';
import { type HandoutControls, useHandout, useHandoutPage } from './use-handout.ts';

const TYPE_LABELS: Readonly<Record<HandoutQuestion['type'], PlainKey>> = {
  'choose-form': 'capture.typeChooseForm',
  particle: 'capture.typeParticle',
  reading: 'capture.typeReading',
  'write-kanji': 'capture.typeWriteKanji',
  reorder: 'capture.typeReorder',
  free: 'capture.typeFree',
};

/** The question's number as printed, else its place on the page. */
const numberOf = (q: HandoutQuestion) => q.number ?? q.id.split('-')[1] ?? '';

function useHandoutTutor(question: HandoutQuestion) {
  const t = useT();
  const options = useMemo(
    () => ({
      topic: { about: question.stem, sentence: { text: question.stem } },
      starters: [t('read.tutorHandoutWhy'), t('read.tutorHandout')],
    }),
    [question.stem, t],
  );
  return useTutor(options);
}

/** "From your handout · page 3, question 4" and "See the page". */
function Source({ lessonId, question }: { lessonId: string; question: HandoutQuestion }) {
  const t = useT();
  const page = useHandoutPage(lessonId, question.page);
  const [open, setOpen] = useState(false);
  const n = question.page + 1;
  return (
    <div className={styles.source}>
      <p className={read.muted}>{t('read.handoutFrom', { page: n, n: numberOf(question) })}</p>
      <button type="button" className={styles.link} onClick={() => setOpen(true)}>
        {t('read.seePage')}
      </button>
      {open && (
        <PhotoSheet
          photo={page?.photo}
          text={page?.lines.map((line) => line.text).join('\n')}
          label={t('read.pageOfHandout', { n })}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/** The tutor's answer and why, in the AI box; noted when its reading is not verified. */
function TutorAnswer({ question }: { question: HandoutQuestion }) {
  const t = useT();
  const detail = (
    <>
      <span>{t('read.noAnswerPrinted')}</span>
      {!question.answerVerified && <span> {t('read.answerUnverified')}</span>}
    </>
  );
  return (
    <AiBlock
      size="sm"
      label={t('read.answerFromTutor')}
      detail={detail}
      readings={question.readings}
    >
      <p className={styles.answer}>
        <Ja>{question.answer}</Ja>
      </p>
      <p className={read.cardText}>
        <JaRuns text={question.explanation} />
      </p>
    </AiBlock>
  );
}

function Result({ grade }: { grade: Grade }) {
  const t = useT();
  const look = answerLook(grade);
  return (
    <AnswerState look={look}>
      {look === 'wrong' && grade.given && (
        <p className={read.line}>
          <span className={read.muted}>{t('drills.youChose')}</span>
          <StruckAnswer>{grade.given}</StruckAnswer>
        </p>
      )}
    </AnswerState>
  );
}

/** A free answer, written before the tutor's shows. */
function FreeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT();
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={read.muted}>
        {t('read.yourAnswer')}
      </label>
      <textarea
        id={id}
        lang="ja"
        rows={3}
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

/** A typed answer and Check, or a free one and "Show the tutor's answer". */
function TypedActions({ controls, free }: { controls: HandoutControls; free: boolean }) {
  const t = useT();
  const id = useId();
  const [value, setValue] = useState('');
  return (
    <ActionBar>
      {free ? (
        <FreeField value={value} onChange={setValue} />
      ) : (
        <div className={styles.field}>
          <label htmlFor={id} className="visually-hidden">
            {t('read.yourAnswer')}
          </label>
          <input
            id={id}
            lang="ja"
            className={styles.input}
            value={value}
            placeholder={t('read.yourAnswer')}
            onChange={(event) => setValue(event.currentTarget.value)}
          />
        </div>
      )}
      <PillButton block disabled={!free && !value.trim()} onClick={() => controls.answer(value)}>
        {free ? t('read.showTutorAnswer') : t('read.check')}
      </PillButton>
      {!free && <SkipButton onSkip={controls.skip} />}
    </ActionBar>
  );
}

/** "I had it right" and "Not quite", once the tutor's answer to a free question shows. */
function MarkActions({ controls }: { controls: HandoutControls }) {
  const t = useT();
  return (
    <ActionBar>
      <p className={read.muted}>{t('read.markYours')}</p>
      <div className={styles.marks}>
        <PillButton variant="secondary" onClick={() => controls.mark(false)}>
          {t('read.notQuite')}
        </PillButton>
        <PillButton onClick={() => controls.mark(true)}>{t('read.hadItRight')}</PillButton>
      </div>
    </ActionBar>
  );
}

function AnswerFooter({
  question,
  controls,
}: {
  question: HandoutQuestion;
  controls: HandoutControls;
}) {
  if (controls.revealed) return <MarkActions controls={controls} />;
  const choices = question.type === 'free' ? [] : question.choices;
  if (choices.length > 0) {
    const options = choices.map((choice) => ({ value: choice, label: choice }));
    return (
      <ChoiceActions
        choices={options}
        stacked={choices.some((c) => c.length > 3)}
        onChoose={controls.answer}
      />
    );
  }
  return <TypedActions controls={controls} free={question.type === 'free'} />;
}

export interface HandoutScreenProps {
  card: SessionCard;
  topBar: ReactNode;
  onDone: (result: DrillResult) => void;
}

/** One handout question as a session screen (see the module comment). */
export function HandoutScreen({ card, topBar, onDone }: HandoutScreenProps) {
  const t = useT();
  const question = card.handout as HandoutQuestion;
  const lessonId = card.scan?.lessonId ?? '';
  const controls = useHandout(lessonId, question);
  const tutor = useHandoutTutor(question);
  const { grade } = controls;
  const next = () => onDone({ kind: 'handout', right: grade?.verdict === 'correct' });
  const footer = grade ? (
    <ActionBar>
      <TutorNext tutor={tutor}>
        <PillButton block onClick={next}>
          {t('common.next')}
        </PillButton>
      </TutorNext>
    </ActionBar>
  ) : (
    <AnswerFooter question={question} controls={controls} />
  );
  return (
    <Screen topBar={topBar} footer={footer} gap={22} enter={false}>
      <Source lessonId={lessonId} question={question} />
      <p className={styles.prompt}>
        {question.instruction ? (
          <JaRuns text={question.instruction} />
        ) : (
          t(TYPE_LABELS[question.type])
        )}
      </p>
      <HandoutStem
        question={question}
        answered={Boolean(grade) || controls.revealed}
        right={grade?.verdict === 'correct'}
      />
      {!grade && tutor && <TutorChip tutor={tutor} label={t('read.askTutorHandout')} />}
      {grade && <Result grade={grade} />}
      {(grade || controls.revealed) && <TutorAnswer question={question} />}
    </Screen>
  );
}
