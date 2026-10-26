/** Choice drills (R8): "Which kanji fits?" (待/持) and the grammar cloze. */
import type { ReactNode } from 'react';
import {
  type ClozeDrill,
  KANJI_BLANK,
  type KanjiChoice,
  type LookalikeDrill,
  PATTERN_BLANK,
} from '../../domain/drills/index.ts';
import { answerSpan, readingLabel } from '../../domain/services/index.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { AnswerState, answerLook } from '../../ui/answer-state.tsx';
import { Chip } from '../../ui/chip.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { StruckAnswer } from '../../ui/ja.tsx';
import { TapSentence } from '../../ui/word-tap.tsx';
import { type MaskedSentence, maskSentence } from '../../ui/word-tap-data.ts';
import styles from './drill.module.css';
import read from './read.module.css';
import { DRILL_PROMPT } from './read-copy.ts';
import type { DrillAnswer } from './use-drill.ts';

/**
 * "Fits 待" in green with a check when right (U2); after "You chose 持" (struck, with a shake)
 * when wrong; after "Here it is:" when skipped (L4).
 */
function ChoiceFeedback({ answer, note }: { answer: DrillAnswer; note?: ReactNode }) {
  const { grade } = answer;
  const look = answerLook(grade);
  const t = useT();
  return (
    <AnswerState look={look}>
      {look === 'wrong' && (
        <p className={read.line}>
          <span className={read.muted}>{t('drills.youChose')}</span>
          <StruckAnswer>{grade.given}</StruckAnswer>
        </p>
      )}
      <p className={read.line}>
        <span className={read.muted}>
          {look === 'skipped' ? t('readSession.hereItIs') : t('drills.fits')}
        </span>
        <span lang="ja" className={read.answer}>
          {grade.expected}
        </span>
        {note}
      </p>
    </AnswerState>
  );
}

/** The sentence with its blank, before the answer: the blank and its pieces shut. */
function Masked({ masked }: { masked: MaskedSentence }) {
  return (
    <TapSentence
      sentence={masked.sentence}
      target={[masked.blank]}
      locked={masked.locked}
      beforeAnswer
    />
  );
}

/** Each choice with its dictionary readings (KANJIDIC), shown once answered. */
function KanjiReadings({ choices }: { choices: readonly KanjiChoice[] }) {
  const t = useT();
  return (
    <ul className={styles.readings} aria-label={t('drills.readings')}>
      {choices.map((choice) => (
        <li key={choice.char} className={styles.reading}>
          <span lang="ja" className={styles.kanji}>
            {choice.char}
          </span>
          <span lang="ja" className={styles.kana}>
            {choice.readings.map(readingLabel).join('、')}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The sentence with the kanji blanked; once answered, the sentence itself with furigana. */
export function LookalikeView({
  drill,
  answer,
}: {
  drill: LookalikeDrill;
  answer: DrillAnswer | undefined;
}) {
  const masked = maskSentence(drill.sentence, drill.at, drill.at + 1, KANJI_BLANK);
  const t = useT();
  return (
    <>
      <p className={styles.prompt}>
        {t(DRILL_PROMPT.lookalike)}
        {drill.confused && ` · ${t('drills.swappedRecently')}`}
      </p>
      {answer ? (
        <TapSentence
          sentence={drill.sentence}
          target={answerSpan(drill.sentence, drill.tokenIndex)}
          furigana={[drill.tokenIndex]}
        />
      ) : (
        <Masked masked={masked} />
      )}
      {answer && <ChoiceFeedback answer={answer} />}
      {answer && <KanjiReadings choices={drill.choices} />}
    </>
  );
}

/** Token indices a character range of the sentence covers. */
function covered(drill: ClozeDrill): number[] {
  return drill.sentence.tokens.flatMap((t, i) =>
    t.start < drill.end && t.start + t.surface.length > drill.start ? [i] : [],
  );
}

/** The sentence with the pattern blanked; once answered, the pattern underlined. */
export function ClozeView({
  drill,
  answer,
}: {
  drill: ClozeDrill;
  answer: DrillAnswer | undefined;
}) {
  const masked = maskSentence(drill.sentence, drill.start, drill.end, PATTERN_BLANK);
  const meaning = <span className={read.muted}>· {drill.meaning}</span>;
  const t = useT();
  return (
    <>
      <p className={styles.prompt}>{t(DRILL_PROMPT.cloze)}</p>
      {answer ? (
        <TapSentence sentence={drill.sentence} target={covered(drill)} />
      ) : (
        <Masked masked={masked} />
      )}
      {answer && <ChoiceFeedback answer={answer} note={drill.meaning ? meaning : undefined} />}
    </>
  );
}

export interface Choice {
  value: string;
  label: string;
}

/**
 * The choices as answer chips (52 px, the soft fill): side by side for kanji, stacked for patterns. Choices in
 * the learner's language (meanings) are not Japanese, so they keep the interface font.
 */
export function ChoiceActions(props: {
  choices: readonly Choice[];
  stacked: boolean;
  onChoose: (value: string) => void;
  ja?: boolean;
}) {
  const ja = props.ja !== false;
  const t = useT();
  return (
    <ActionBar>
      <fieldset className={props.stacked ? styles.stack : styles.choices}>
        <legend className="visually-hidden">{t('drills.choices')}</legend>
        {props.choices.map((choice) => (
          <Chip
            key={choice.value}
            className={styles.answerChip}
            onClick={() => props.onChoose(choice.value)}
          >
            {ja ? (
              <span lang="ja" className={props.stacked ? styles.pattern : styles.choice}>
                {choice.label}
              </span>
            ) : (
              <span className={styles.meaningChoice}>{choice.label}</span>
            )}
          </Chip>
        ))}
      </fieldset>
    </ActionBar>
  );
}
