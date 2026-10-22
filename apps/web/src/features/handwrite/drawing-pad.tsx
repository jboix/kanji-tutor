import { type Dispatch, type PointerEvent, useRef } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { CloseIcon, UndoIcon } from '../../ui/icons.tsx';
import styles from './handwrite.module.css';
import { type Ink, type InkAction, paintedStrokes } from './ink.ts';
import type { Point } from './recognizer/geometry.ts';
import { useInkCanvas } from './use-ink-canvas.ts';

function localPoint(canvas: HTMLCanvasElement, event: { clientX: number; clientY: number }): Point {
  const rect = canvas.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top];
}

/** Coalesced points when the browser offers them (smoother pen and finger lines). */
function movePoints(event: PointerEvent<HTMLCanvasElement>): Point[] {
  const canvas = event.currentTarget;
  const native = event.nativeEvent;
  const events = native.getCoalescedEvents?.() ?? [];
  return (events.length > 0 ? events : [native]).map((e) => localPoint(canvas, e));
}

function usePointerInk(dispatch: Dispatch<InkAction>) {
  const down = useRef(false);
  return {
    onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
      if (!event.isPrimary || event.button > 0) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      down.current = true;
      dispatch({ type: 'down', point: localPoint(event.currentTarget, event) });
    },
    onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
      if (down.current && event.isPrimary) dispatch({ type: 'move', points: movePoints(event) });
    },
    onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
      if (!down.current || !event.isPrimary) return;
      down.current = false;
      dispatch({ type: 'up' });
    },
    onPointerCancel() {
      down.current = false;
      dispatch({ type: 'cancel' });
    },
  };
}

/** The guide square with dashed centre lines (handwrite.html), behind the ink. */
function Guide() {
  return (
    <svg className={styles.guide} width="250" height="250" viewBox="0 0 250 250" aria-hidden="true">
      <rect x="0.5" y="0.5" width="249" height="249" className={styles.guideBox} />
      <line x1="125" y1="0" x2="125" y2="250" className={styles.guideLine} />
      <line x1="0" y1="125" x2="250" y2="125" className={styles.guideLine} />
    </svg>
  );
}

export interface DrawingPadProps {
  ink: Ink;
  dispatch: Dispatch<InkAction>;
}

/** The drawing canvas: pointer input (touch, pen, mouse), undo and clear (I4). */
export function DrawingPad({ ink, dispatch }: DrawingPadProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useInkCanvas(canvas, paintedStrokes(ink));
  const count = ink.strokes.length;
  const t = useT();
  return (
    <div className={styles.pad}>
      <Guide />
      <canvas
        ref={canvas}
        className={styles.canvas}
        role="img"
        aria-label={t('handwrite.pad')}
        {...usePointerInk(dispatch)}
      />
      <p className="visually-hidden" aria-live="polite">
        {t('handwrite.strokes', { n: count })}
      </p>
      {count > 0 && (
        <div className={styles.clear}>
          <IconButton
            look="soft"
            aria-label={t('handwrite.clear')}
            onClick={() => dispatch({ type: 'clear' })}
          >
            <CloseIcon />
          </IconButton>
        </div>
      )}
      <div className={styles.undo}>
        <IconButton
          look="soft"
          aria-label={t('handwrite.undo')}
          disabled={count === 0}
          onClick={() => dispatch({ type: 'undo' })}
        >
          <UndoIcon />
        </IconButton>
      </div>
    </div>
  );
}
