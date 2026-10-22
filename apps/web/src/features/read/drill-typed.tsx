/** Typed drills (R8): one kanji in several words (生), and guessing a family member's on'yomi. */
import type { FamilyDrill, ReadingItem, ReadingsDrill } from '../../domain/drills/index.ts';
import type { Grade } from '../../domain/types.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { AnswerInput } from '../../ui/answer-input.tsx';
import { AnswerState, answerLook } from '../../ui/answer-state.tsx';
import { cx } from '../../ui/cx.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja, StruckAnswer } from '../../ui/ja.tsx';
import { TapText, TapWord } from '../../ui/word-tap.tsx';
import styles from './drill.module.css';
import read from './read.module.css';
import { useFocus } from './read-actions.tsx';
import { DRILL_PROMPT, SLIP } from './read-copy.ts';
import type { DrillAnswer } from './use-drill.ts';

/**
 * The reading after an answer (U2): green with a check when right, after the struck answer (with
 * a shake) when not, and after "Here it is:" when skipped (L4).
 */
function GradeLine({ answer, label }: { answer: DrillAnswer; label: string }) {
  const { grade } = answer;
  const look = answerLook(grade);
  const slip = SLIP[grade.errorType ?? 'other'];
  const t = useT();
  return (
    <AnswerState look={look}>
      <span className={read.line}>
        {look === 'wrong' && <StruckAnswer>{grade.given || answer.answer}</StruckAnswer>}
        <span className={read.muted}>{look === 'skipped' ? t('readSession.hereItIs') : label}</span>
        <span lang="ja" className={styles.answer}>
          {grade.expected}
        </span>
        {grade.verdict === 'near-miss' && slip && <span className={read.muted}>· {t(slip)}</span>}
      </span>
    </AnswerState>
  );
}

function WordRow(props: { item: ReadingItem; current: boolean; answer: DrillAnswer | undefined }) {
  const t = useT();
  return (
    <li className={cx(styles.word, props.current && styles.current)}>
      <span lang="ja" className={styles.form}>
        {props.answer ? (
          <TapWord
            form={props.item.form}
            wordId={props.item.wordId}
            reading={props.item.readings[0]}
          />
        ) : (
          props.item.form
        )}
      </span>
      {props.answer && <GradeLine answer={props.answer} label={t('readSession.readAs')} />}
    </li>
  );
}

/** The words, the current one underlined, each with its reading once answered. */
export function ReadingsView(props: {
  drill: ReadingsDrill;
  step: number;
  answers: DrillAnswer[];
}) {
  const { drill, step, answers } = props;
  const t = useT();
  return (
    <>
      <p className={styles.prompt}>
        {t(DRILL_PROMPT.readings)} · <Ja>{drill.kanji}</Ja>
      </p>
      <ol className={styles.words}>
        {drill.items.map((item, i) => (
          <WordRow key={item.wordId} item={item} current={i === step} answer={answers[i]} />
        ))}
      </ol>
    </>
  );
}

function Member({ char, label, guess }: { char: string; label: string; guess?: boolean }) {
  return (
    <span className={cx(styles.member, guess && styles.guess)}>
      <span lang="ja" className={styles.memberChar}>
        {char}
      </span>
      <span className={styles.memberLabel}>{label}</span>
    </span>
  );
}

function FamilyReveal({ drill, grade }: { drill: FamilyDrill; grade: Grade }) {
  const t = useT();
  return (
    <>
      <GradeLine
        answer={{ answer: grade.given, grade: { ...grade, expected: drill.sound } }}
        label={t('drills.read')}
      />
      {drill.word && (
        <p className={read.line}>
          <span className={read.muted}>{t('drills.asWord')}</span>
          <TapText text={drill.word.form} id={`${drill.itemId}:word`} />
          <Ja>{drill.word.reading}</Ja>
        </p>
      )}
    </>
  );
}

/** The known members, the one to guess, and the hint (kanji.html "guess it"). */
export function FamilyView({
  drill,
  answer,
}: {
  drill: FamilyDrill;
  answer: DrillAnswer | undefined;
}) {
  const { t, rich } = useI18n();
  return (
    <>
      <p className={styles.prompt}>{t(DRILL_PROMPT.family)}</p>
      <div className={styles.family}>
        {drill.known.map((char) => (
          <Member key={char} char={char} label={t('drills.known')} />
        ))}
        <Member
          char={drill.guess}
          label={answer ? drill.sound : t('drills.guessIt')}
          guess={!answer}
        />
      </div>
      {answer ? (
        <FamilyReveal drill={drill} grade={answer.grade} />
      ) : (
        <p className={styles.text}>
          {rich('drills.familyHint', {
            guess: <Ja>{drill.guess}</Ja>,
            part: <Ja>{drill.part}</Ja>,
          })}
        </p>
      )}
    </>
  );
}

/** The typed answer with live kana (R3), focused when it appears. */
export function TypedActions(props: {
  label: string;
  placeholder: string;
  onAnswer: (v: string) => void;
}) {
  const box = useFocus('input', props.label);
  return (
    <ActionBar>
      <div ref={box}>
        <AnswerInput
          label={props.label}
          placeholder={props.placeholder}
          onSubmit={props.onAnswer}
        />
      </div>
    </ActionBar>
  );
}
