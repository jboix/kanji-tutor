/**
 * "To look at again" on the session end (W-end; D116): each missed sentence with its word in the
 * miss crimson and its reading, what was written struck through and why, and missed exercises.
 * The first two show; "See all N" opens the rest in place.
 */
import { useEffect, useRef, useState } from 'react';
import { answerSpan } from '../../domain/services/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { ErrorType } from '../../domain/types.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { RuledSentence } from '../../ui/ruled-sentence.tsx';
import styles from './session-end.module.css';
import { delay } from './session-end-parts.tsx';
import type { Missed } from './session-review.ts';
import type { Answered } from './session-state.ts';

/** Why a near-miss or miss was off, when the grader knows it. */
const REASON: Partial<Record<ErrorType, PlainKey>> = {
  'long-vowel': 'sessionEnd.longVowel',
  sokuon: 'sessionEnd.sokuon',
  rendaku: 'sessionEnd.rendaku',
  'wrong-kanji': 'sessionEnd.wrongKanji',
};

/** "You wrote ~~しょかい~~ · a long vowel", or "You didn't know it" after a skip. */
function WhatWasWritten({ answered }: { answered: Answered }) {
  const { t, rich } = useI18n();
  const { grade } = answered;
  if (grade.skipped) return <span className={styles.why}>{t('sessionEnd.didntKnow')}</span>;
  const answer = (
    <del lang="ja" className={styles.struck}>
      {grade.given || answered.answer}
    </del>
  );
  const wrote = rich('sessionEnd.youWrote', { answer });
  const reason = REASON[grade.errorType ?? 'other'];
  return (
    <span className={styles.why}>
      {reason ? rich('sessionEnd.becauseOf', { wrote, reason: t(reason) }) : wrote}
    </span>
  );
}

function MissedReading({ card, answered }: { card: SessionCard; answered: Answered }) {
  const span = answerSpan(card.sentence, answered.target.tokenIndex);
  return (
    <>
      <RuledSentence
        sentence={card.sentence}
        size="callout"
        ruled={false}
        target={span}
        result="missed"
        furigana={span}
      />
      <WhatWasWritten answered={answered} />
    </>
  );
}

const EXERCISE: Record<'passage' | 'question' | 'exercise', PlainKey> = {
  passage: 'sessionEnd.missedPassage',
  question: 'sessionEnd.missedQuestion',
  exercise: 'sessionEnd.missedExercise',
};

/** A sentence worth showing again: a real one, not a drill's word list (`drill:` ids). */
const shows = (card: SessionCard) =>
  !card.passage && card.sentence.tokens.length > 0 && !card.sentence.id.startsWith('drill:');

function MissedExercise({ card }: { card: SessionCard }) {
  const t = useT();
  const kind = card.passage ? 'passage' : card.question ? 'question' : 'exercise';
  return (
    <>
      {shows(card) && <RuledSentence sentence={card.sentence} size="callout" ruled={false} />}
      <span className={styles.why}>{t(EXERCISE[kind])}</span>
    </>
  );
}

function MissedEntry({ missed, at }: { missed: Missed; at: number }) {
  return (
    <li
      className={`${styles.missed} ${styles.rise}`}
      style={delay(at)}
      data-missed={missed.kind}
      data-sentence={missed.card.sentence.id}
      data-reading={missed.kind === 'reading' ? missed.answered.target.readings[0] : undefined}
      tabIndex={-1}
    >
      {missed.kind === 'reading' ? (
        <MissedReading card={missed.card} answered={missed.answered} />
      ) : (
        <MissedExercise card={missed.card} />
      )}
    </li>
  );
}

/** Two first, or all of them when there are only three. */
const FIRST = 2;

const keyOf = (missed: Missed) =>
  missed.kind === 'reading'
    ? `${missed.index}:${missed.answered.target.tokenIndex}`
    : `${missed.index}`;

/** "To look at again", hidden when nothing was missed. */
export function LookAgain({ missed, at }: { missed: readonly Missed[]; at: number }) {
  const t = useT();
  const [all, setAll] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  // "See all" goes away once pressed: focus moves on to the first entry it opened.
  useEffect(() => {
    if (all) (list.current?.children[FIRST] as HTMLElement | undefined)?.focus();
  }, [all]);
  if (missed.length === 0) return null;
  const open = all || missed.length <= FIRST + 1;
  const shown = open ? missed : missed.slice(0, FIRST);
  return (
    <section className={styles.section} aria-labelledby="end-again">
      <h2 id="end-again" className={`${styles.label} ${styles.rise}`} style={delay(at)}>
        {t('sessionEnd.lookAgain')}
      </h2>
      <ul className={styles.missedList} ref={list}>
        {shown.map((m, i) => (
          <MissedEntry key={keyOf(m)} missed={m} at={all ? 0 : at + 0.15 * (i + 1)} />
        ))}
      </ul>
      {!open && (
        <button
          type="button"
          className={`${styles.seeAll} ${styles.rise}`}
          style={delay(at + 0.4)}
          aria-expanded={false}
          onClick={() => setAll(true)}
        >
          {t('sessionEnd.seeAll', { n: missed.length })}
        </button>
      )}
    </section>
  );
}
