import type { Question } from '../../domain/questions/index.ts';
import { AnswerState, answerLook, CheckMark } from '../../ui/answer-state.tsx';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Ja, StruckAnswer } from '../../ui/ja.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { TapText } from '../../ui/word-tap.tsx';
import styles from './question.module.css';
import { noteText, PROMPT_KEY } from './question-copy.ts';
import read from './read.module.css';
import type { QuestionAnswer } from './use-question.ts';

/** "問題 · 漢字読み" and the instruction in the learner's language (J7). */
export function QuestionHeader({ question }: { question: Question }) {
  const t = useT();
  return (
    <header className={styles.header}>
      <p className={styles.section}>
        <Ja>{question.section}</Ja>
      </p>
      <p className={styles.prompt}>{t(PROMPT_KEY[question.kind])}</p>
    </header>
  );
}

const JAPANESE = /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー〜・★々]+)/u;

/** The text cut into runs, each with its offset (a stable key) and whether it is Japanese. */
function runs(text: string) {
  let at = 0;
  const all = text.split(JAPANESE).map((part, i) => {
    const run = { part, at, ja: i % 2 === 1 };
    at += part.length;
    return run;
  });
  return all.filter((run) => run.part !== '');
}

/** English prose with its Japanese runs set in Klee One (notes such as "まて drops the っ"). */
export function MixedText({ text }: { text: string }) {
  return runs(text).map(({ part, at, ja }) =>
    ja ? <Ja key={at}>{part}</Ja> : <span key={at}>{part}</span>,
  );
}

export interface OptionListProps {
  question: Question;
  answer: QuestionAnswer | undefined;
  onChoose: (choice: number) => void;
  /** Options are words or phrases (not readings): their words open once answered (U5). */
  words?: boolean;
}

function optionState(question: Question, answer: QuestionAnswer | undefined, i: number) {
  if (!answer) return undefined;
  if (i === question.answer) return 'right';
  return i === answer.choice ? 'chosen' : 'other';
}

interface RowProps extends Omit<OptionListProps, 'words'> {
  at: number;
  text: string;
  open: boolean;
}

function OptionRow({ question, answer, onChoose, at, text, open }: RowProps) {
  const state = optionState(question, answer, at);
  const className = cx(styles.option, state && styles[state]);
  const check = state === 'right' && answer?.grade.verdict === 'correct' && <CheckMark />;
  const number = <span className={styles.number}>{at + 1}</span>;
  // Answered, with words to open: a row of tappable words, no longer a button around them.
  if (answer && open) {
    return (
      <div className={cx(className, styles.still)} data-option={state ?? ''}>
        {number}
        <span className={styles.optionText}>
          <TapText text={text} id={`${question.id}:option:${at}`} />
        </span>
        {check}
      </div>
    );
  }
  return (
    <button
      type="button"
      className={className}
      data-option={state ?? ''}
      // Locked with aria-disabled, not disabled: the options stay focusable, so the answered
      // card (which scrolls) keeps something to reach by keyboard (axe).
      aria-disabled={answer !== undefined}
      onClick={() => answer === undefined && onChoose(at)}
    >
      {number}
      <span lang="ja" className={styles.optionText}>
        {text}
      </span>
      {check}
    </button>
  );
}

/** The four options as numbered rows (1–4, as on the exam); locked once answered. */
export function OptionList({ words = false, ...props }: OptionListProps) {
  const t = useT();
  const wired = useSlot('wordSheet') !== undefined;
  const open = words && wired;
  return (
    <ol className={styles.options} aria-label={t('questions.options')}>
      {props.question.options.map((option, i) => (
        <li key={option.text}>
          <OptionRow {...props} at={i} text={option.text} open={open} />
        </li>
      ))}
    </ol>
  );
}

/** "You chose 2 もって" (struck) or "Here it is:", then the answer, in the U2 answer states. */
export function AnswerLine({ question, answer }: { question: Question; answer: QuestionAnswer }) {
  const look = answerLook(answer.grade);
  const right = question.options[question.answer]?.text ?? '';
  const t = useT();
  return (
    <AnswerState look={look}>
      {look === 'wrong' && (
        <p className={read.line}>
          <span className={read.muted}>{t('drills.youChose')}</span>
          <StruckAnswer>{answer.grade.given}</StruckAnswer>
        </p>
      )}
      <p className={read.line}>
        <span className={read.muted}>
          {t(look === 'skipped' ? 'readSession.hereItIs' : 'questions.answerIs')}
        </span>
        <span lang="ja" className={read.answer}>
          {question.answer + 1} {right}
        </span>
      </p>
    </AnswerState>
  );
}

/** Why each option is right or wrong (J7), the right one first. */
export function OptionNotes({ question }: { question: Question }) {
  const rows = question.options
    .map((option, i) => ({ option, i }))
    .sort((a, b) => Number(b.i === question.answer) - Number(a.i === question.answer));
  const t = useT();
  return (
    <ul className={styles.notes} aria-label={t('questions.whyEachOption')}>
      {rows.map(({ option, i }) => (
        <li
          key={option.text}
          className={cx(styles.note, i === question.answer && styles.noteRight)}
        >
          <span className={styles.number}>{i + 1}</span>
          <span className={styles.noteText}>
            <MixedText text={noteText(t, option.note)} />
          </span>
        </li>
      ))}
    </ul>
  );
}
