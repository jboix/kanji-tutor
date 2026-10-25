import { useReducer, useState } from 'react';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import type { KanjiDrawSlotProps } from '../../ui/slots.tsx';
import { DrawingPad } from './drawing-pad.tsx';
import styles from './handwrite.module.css';
import { EMPTY_INK, inkReducer } from './ink.ts';
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

/** A box per kanji: the ones drawn show how they were read, the current one is ringed. */
function Boxes({ kanji, drawn }: { kanji: readonly string[]; drawn: readonly string[] }) {
  const t = useT();
  const label = t('handwrite.kanjiOf', { n: drawn.length + 1, total: kanji.length });
  const boxes = kanji.map((char, i) => ({ id: `${i}${char}`, i, shown: drawn[i] ?? '' }));
  return (
    <ol className={styles.boxes} aria-label={label}>
      {boxes.map(({ id, i, shown }) => (
        <li
          key={id}
          lang="ja"
          className={cx(
            styles.box,
            i < drawn.length && styles.boxDone,
            i === drawn.length && styles.boxCurrent,
          )}
        >
          {shown}
        </li>
      ))}
    </ol>
  );
}

function Note({ status }: { status: 'loading' | 'ready' | 'failed' }) {
  const t = useT();
  if (status === 'loading') return <StatusLine>{t('handwrite.recognizerLoading')}</StatusLine>;
  if (status === 'failed') return <StatusLine>{t('handwrite.recognizerFailed')}</StatusLine>;
  return null;
}

/**
 * "Write the kanji" (the `kanjiDraw` slot): the word's kanji drawn one after the other on the
 * pad, each read offline as it is left, and the whole handed back after the last.
 */
export function KanjiAnswer({ kanji, onAnswer }: KanjiDrawSlotProps) {
  const [ink, dispatch] = useReducer(inkReducer, EMPTY_INK);
  const [drawn, setDrawn] = useState<string[]>([]);
  const { status, recognizer } = useRecognizer();
  const t = useT();
  const last = drawn.length + 1 >= kanji.length;
  const next = () => {
    if (!recognizer || ink.strokes.length === 0) return;
    const all = [...drawn, readDrawing(recognizer, ink.strokes, kanji[drawn.length] ?? '')];
    dispatch({ type: 'clear' });
    if (all.length >= kanji.length) onAnswer(all.join(''));
    else setDrawn(all);
  };
  return (
    <div className={styles.answer}>
      {kanji.length > 1 && <Boxes kanji={kanji} drawn={drawn} />}
      <DrawingPad ink={ink} dispatch={dispatch} compact />
      <Note status={status} />
      <PillButton block disabled={!recognizer || ink.strokes.length === 0} onClick={next}>
        {t(last ? 'exercises.check' : 'handwrite.nextKanji')}
      </PillButton>
    </div>
  );
}
