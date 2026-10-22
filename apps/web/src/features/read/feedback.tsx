import type { SessionCard } from '../../domain/session-types.ts';
import { AnswerState, answerLook } from '../../ui/answer-state.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Ja, StruckAnswer } from '../../ui/ja.tsx';
import { useSlot } from '../../ui/slots.tsx';
import styles from './read.module.css';
import { diffParts, SLIP } from './read-copy.ts';
import { SaidAnswer } from './said-answer.tsx';
import { SessionCopy } from './session-copy.tsx';
import type { Answered } from './session-state.ts';

function Expected({ answered }: { answered: Answered }) {
  const { grade } = answered;
  const [before, diff, after] = diffParts(grade.expected, grade.given);
  return (
    <p className={styles.line}>
      <span className={styles.muted}>
        <SessionCopy k="expected" />
      </span>
      <span lang="ja" className={styles.answer}>
        {before}
        <b className={styles.diff}>{diff}</b>
        {after}
      </span>
    </p>
  );
}

function YouWrote({ answered }: { answered: Answered }) {
  return (
    <p className={styles.line}>
      <span className={styles.muted}>
        <SessionCopy k="youWrote" />
      </span>
      <StruckAnswer>{answered.grade.given || answered.answer}</StruckAnswer>
    </p>
  );
}

interface FeedbackProps {
  card: SessionCard;
  answered: Answered;
  onOpenWord: (tokenIndex: number) => void;
}

/** A right answer: "Read as よみ" on the green card, under "Right" (U2, W-answered). */
function ReadAs({ answered }: { answered: Answered }) {
  return (
    <p className={styles.line}>
      <span className={styles.cardText}>
        <SessionCopy k="readAs" />
      </span>
      <span lang="ja" className={styles.answer}>
        {answered.grade.expected}
      </span>
    </p>
  );
}

/** The miss card's title: "Almost: long vowel" for a near-miss, else "Not quite" (W-error). */
function MissTitle({ answered }: { answered: Answered }) {
  const t = useT();
  const { grade } = answered;
  if (grade.verdict !== 'near-miss') return <>{t('readSession.notQuite')}</>;
  const slip = SLIP[grade.errorType ?? 'other'];
  return <>{slip ? t('readSession.almost', { slip: t(slip) }) : t('readSession.almostPlain')}</>;
}

/**
 * A right answer in a less usual reading (D56): "Also correct. にほんじん is the more common
 * reading.", the preferred reading in Klee One, in the same green state.
 */
function VariantNote({ answered }: { answered: Answered }) {
  const t = useT();
  const preferred = answered.grade.variantOf;
  if (!preferred) return null;
  return (
    <p className={styles.line} data-testid="variant-note">
      <span className={styles.muted}>
        {t('readSession.alsoCorrect')} <Ja>{preferred}</Ja> {t('readSession.moreCommonReading')}
      </span>
    </p>
  );
}

/** "I don't know" (L4): the reading, laid out like a miss, with neutral copy. */
function HereItIs({ answered }: { answered: Answered }) {
  return (
    <p className={styles.line}>
      <span className={styles.muted}>
        <SessionCopy k="hereItIs" />
      </span>
      <span lang="ja" className={styles.answer}>
        {answered.grade.expected}
      </span>
    </p>
  );
}

function MissLines({ answered }: { answered: Answered }) {
  const { grade } = answered;
  if (answered.mode === 'voice') return <SaidAnswer grade={grade} />;
  return (
    <>
      <YouWrote answered={answered} />
      {grade.verdict === 'near-miss' && <Expected answered={answered} />}
    </>
  );
}

/**
 * What teaches after a miss or a skip: the mistake slot (A1), which gets `grade.skipped` to tell
 * the two apart, and the teaching card (teach slot, L1/L4): first under a skip, after the
 * mistake note under a miss.
 */
function AnswerTeaching({ card, answered, onOpenWord }: FeedbackProps) {
  const Mistake = useSlot('mistakeExplanation');
  const Teaching = useSlot('teachingCard');
  const { target, answer, grade } = answered;
  const teaching = Teaching && <Teaching card={card} target={target} grade={grade} />;
  const mistake = Mistake && (
    <Mistake card={card} target={target} answer={answer} grade={grade} onOpenWord={onOpenWord} />
  );
  return grade.skipped ? (
    <>
      {teaching}
      {mistake}
    </>
  ) : (
    <>
      {mistake}
      {teaching}
    </>
  );
}

/**
 * After an answer (R5, U2, D105): the green card with "Right" and "Read as" when right; when
 * not, the crimson card with what was written, struck (with a short shake), and the expected
 * reading for a near-miss, then the teaching slot. A skip (L4) shows the reading on a quiet card.
 */
export function Feedback(props: FeedbackProps) {
  const { answered } = props;
  const look = answerLook(answered.grade);
  if (look === 'correct') {
    return (
      <AnswerState look={look} title={<SessionCopy k="right" />}>
        <ReadAs answered={answered} />
        <VariantNote answered={answered} />
      </AnswerState>
    );
  }
  return (
    <>
      <AnswerState look={look} title={look === 'wrong' && <MissTitle answered={answered} />}>
        {look === 'skipped' ? <HereItIs answered={answered} /> : <MissLines answered={answered} />}
      </AnswerState>
      <AnswerTeaching {...props} />
    </>
  );
}
