/**
 * Sentence building (S4): the meaning, the sentence as built so far, and the pieces left. A
 * tapped piece goes to the end of the sentence; a tapped piece in the sentence goes back.
 * "Check" grades the order once every piece is placed.
 */
import { useCallback, useState } from 'react';
import type { BuildDrill } from '../../domain/drills/index.ts';
import { translationIn } from '../../domain/localized.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { AnswerState, answerLook } from '../../ui/answer-state.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { StruckAnswer } from '../../ui/ja.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { TapSentence } from '../../ui/word-tap.tsx';
import styles from './drill.module.css';
import read from './read.module.css';
import type { DrillAnswer } from './use-drill.ts';

/** The pieces placed so far, by index into `drill.pieces`. */
export interface BuildOrder {
  placed: number[];
  place: (piece: number) => void;
  remove: (at: number) => void;
}

/** The order being built; reset for each drill by its key. */
export function useBuildOrder(): BuildOrder {
  const [placed, setPlaced] = useState<number[]>([]);
  const place = useCallback(
    (piece: number) => setPlaced((list) => (list.includes(piece) ? list : [...list, piece])),
    [],
  );
  const remove = useCallback(
    (at: number) => setPlaced((list) => list.filter((_, i) => i !== at)),
    [],
  );
  return { placed, place, remove };
}

/** The built text: the pieces in the order placed. */
export const builtText = (drill: BuildDrill, placed: readonly number[]) =>
  placed.map((i) => drill.pieces[i] ?? '').join('');

function Meaning({ drill }: { drill: BuildDrill }) {
  const { language } = useI18n();
  const local = translationIn(drill.sentence, language);
  return (
    <p className={styles.meaningCue}>
      {local.value}
      <EnMark english={local.fallback} />
    </p>
  );
}

function Built({ drill, order }: { drill: BuildDrill; order: BuildOrder }) {
  const t = useT();
  return (
    <ol className={styles.built} aria-label={t('exercises.yourSentence')}>
      {order.placed.map((piece, at) => {
        const text = drill.pieces[piece] ?? '';
        return (
          <li key={piece}>
            <button
              type="button"
              className={styles.tile}
              lang="ja"
              aria-label={t('exercises.removePiece', { piece: text })}
              onClick={() => order.remove(at)}
            >
              {text}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Right or not, and the order given when not: the sentence above is the answer. */
function BuildOutcome({ answer }: { answer: DrillAnswer }) {
  const look = answerLook(answer.grade);
  const t = useT();
  return (
    <AnswerState look={look}>
      <p className={read.line}>
        {look === 'wrong' && (
          <>
            <span className={read.muted}>{t('drills.youChose')}</span>
            <StruckAnswer>{answer.answer}</StruckAnswer>
          </>
        )}
        {look === 'skipped' && <span className={read.muted}>{t('readSession.hereItIs')}</span>}
      </p>
    </AnswerState>
  );
}

/** The meaning and the sentence so far; once answered, the sentence itself and the outcome. */
export function BuildView(props: {
  drill: BuildDrill;
  order: BuildOrder;
  answer: DrillAnswer | undefined;
}) {
  const { drill, answer } = props;
  const t = useT();
  return (
    <>
      <p className={styles.prompt}>{t('exercises.promptBuild')}</p>
      <Meaning drill={drill} />
      {answer ? (
        <TapSentence sentence={drill.sentence} target={[]} />
      ) : (
        <Built drill={drill} order={props.order} />
      )}
      {answer && <BuildOutcome answer={answer} />}
    </>
  );
}

/** The pieces left as tiles, and Check once all are placed. */
export function BuildActions(props: {
  drill: BuildDrill;
  order: BuildOrder;
  onAnswer: (built: string) => void;
}) {
  const { drill, order } = props;
  const t = useT();
  const left = drill.shuffled.filter((piece) => !order.placed.includes(piece));
  return (
    <ActionBar>
      <fieldset className={styles.bank}>
        <legend className="visually-hidden">{t('exercises.pieces')}</legend>
        {left.map((piece) => (
          <button
            key={piece}
            type="button"
            className={styles.tile}
            lang="ja"
            onClick={() => order.place(piece)}
          >
            {drill.pieces[piece]}
          </button>
        ))}
      </fieldset>
      <PillButton
        disabled={left.length > 0}
        onClick={() => props.onAnswer(builtText(drill, order.placed))}
      >
        {t('exercises.check')}
      </PillButton>
    </ActionBar>
  );
}
