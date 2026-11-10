import { useMemo, useReducer, useState } from 'react';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import type { KanjiDrawSlotProps } from '../../ui/slots.tsx';
import { DrawingPad } from './drawing-pad.tsx';
import styles from './handwrite.module.css';
import { EMPTY_INK, inkReducer } from './ink.ts';
import { isLastToDraw, type KanjiSteps, leaveOpen, nextToDraw, startSteps } from './kanji-steps.ts';
import type { Recognizer, Stroke } from './recognizer/index.ts';
import { StatusLine } from './status-line.tsx';
import { useRecognizer } from './use-recognition.ts';

/**
 * A drawing counts as the kanji meant when the recognizer ranks it this high: a fair drawing of
 * 待 can come second to 持, while a real swap rarely leaves the one meant in the top three.
 */
export const MATCH_RANK = 3;

/** The kanji a drawing stands for: the one meant when ranked close, else the best guess. */
export function readDrawing(recognizer: Recognizer, strokes: readonly Stroke[], meant: string) {
  const ranked = recognizer.recognize([...strokes], MATCH_RANK);
  if (ranked.some((c) => c.char === meant)) return meant;
  return ranked[0]?.char ?? '？';
}

interface BoxProps {
  n: number;
  shown: string;
  current: boolean;
  onOpen: () => void;
}

/** One kanji's box: ringed while open, and once drawn a button that opens it again. */
function Box({ n, shown, current, onOpen }: BoxProps) {
  const t = useT();
  if (current || shown === '') {
    return (
      <li
        className={cx(styles.box, current && styles.boxCurrent)}
        aria-current={current || undefined}
      >
        <span lang="ja">{shown}</span>
      </li>
    );
  }
  return (
    <li>
      <button
        type="button"
        className={cx(styles.box, styles.boxDone)}
        aria-label={t('handwrite.redrawKanji', { n, char: shown })}
        onClick={onOpen}
      >
        <span lang="ja">{shown}</span>
      </button>
    </li>
  );
}

interface BoxesProps {
  kanji: readonly string[];
  steps: KanjiSteps;
  live: string;
  onOpen: (i: number) => void;
}

/** A box per kanji: drawn ones show how they read and open again on a tap. */
function Boxes({ kanji, steps, live, onOpen }: BoxesProps) {
  const t = useT();
  const total = kanji.length;
  const boxes = kanji.map((char, i) => ({ id: `${i}${char}`, i }));
  return (
    <ol className={styles.boxes} aria-label={t('handwrite.kanjiOf', { n: steps.at + 1, total })}>
      {boxes.map(({ id, i }) => (
        <Box
          key={id}
          n={i + 1}
          shown={i === steps.at ? live : (steps.read[i] ?? '')}
          current={i === steps.at}
          onOpen={() => onOpen(i)}
        />
      ))}
    </ol>
  );
}

/** What the drawing on the pad reads as, while drawing, or why nothing reads yet. */
function Note({ status, live }: { status: 'loading' | 'ready' | 'failed'; live: string }) {
  const t = useT();
  if (status === 'loading') return <StatusLine>{t('handwrite.recognizerLoading')}</StatusLine>;
  if (status === 'failed') return <StatusLine>{t('handwrite.recognizerFailed')}</StatusLine>;
  if (live === '') return null;
  return (
    <StatusLine>
      {t('handwrite.readsAs')} <span lang="ja">{live}</span>
    </StatusLine>
  );
}

/** The word's kanji, each with its strokes kept: leaving one reads it, any can be opened again. */
function useKanjiDrawing(kanji: readonly string[], onAnswer: (answer: string) => void) {
  const [ink, dispatch] = useReducer(inkReducer, EMPTY_INK);
  const [steps, setSteps] = useState(() => startSteps(kanji.length));
  const { status, recognizer } = useRecognizer();
  const meant = kanji[steps.at] ?? '';
  const live = useMemo(
    () => (recognizer && ink.strokes.length > 0 ? readDrawing(recognizer, ink.strokes, meant) : ''),
    [recognizer, ink.strokes, meant],
  );
  const open = (left: KanjiSteps, i: number) => {
    dispatch({ type: 'load', strokes: left.strokes[i] ?? [] });
    setSteps({ ...left, at: i });
  };
  const left = () => leaveOpen(steps, ink.strokes, live);
  const next = () => {
    if (live === '') return;
    const i = nextToDraw(left());
    if (i === undefined) onAnswer(left().read.join(''));
    else open(left(), i);
  };
  const reopen = (i: number) => i !== steps.at && open(left(), i);
  return { ink, dispatch, steps, status, live, next, reopen };
}

/**
 * "Write the kanji" (the `kanjiDraw` slot): the word's kanji drawn one after the other on the
 * pad. What the drawing reads as shows while drawing, a kanji drawn before opens again from its
 * box, and the whole is handed back after the last.
 */
export function KanjiAnswer({ kanji, onAnswer }: KanjiDrawSlotProps) {
  const { ink, dispatch, steps, status, live, next, reopen } = useKanjiDrawing(kanji, onAnswer);
  const t = useT();
  const last = isLastToDraw(steps);
  return (
    <div className={styles.answer}>
      {kanji.length > 1 && <Boxes kanji={kanji} steps={steps} live={live} onOpen={reopen} />}
      <DrawingPad ink={ink} dispatch={dispatch} compact />
      <Note status={status} live={live} />
      <PillButton block disabled={live === ''} onClick={next}>
        {t(last ? 'exercises.check' : 'handwrite.nextKanji')}
      </PillButton>
    </div>
  );
}
