import { useEffect, useId, useRef, useState } from 'react';
import type { OutlineKind, SessionOutline } from '../domain/services/index.ts';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import styles from './session-progress.module.css';

export interface SessionProgressProps {
  /** Zero-based index of the current card. */
  current: number;
  total: number;
  /** What is done and left; when given, the bar opens it on a press (R13). */
  outline?: SessionOutline | undefined;
}

/** Up to this many cards, one dash each; longer sessions get one continuous bar. */
const MAX_DASHES = 12;
const KINDS: readonly OutlineKind[] = ['reading', 'exercises', 'passages'];
const KIND_KEY = {
  reading: 'ui.outlineReading',
  exercises: 'ui.outlineExercises',
  passages: 'ui.outlinePassages',
} as const;

function Track({ done, total, large }: { done: number; total: number; large?: boolean }) {
  const share = total === 0 ? 0 : (done / total) * 100;
  return (
    <span className={cx(styles.track, large && styles.large)}>
      <span className={styles.fill} style={{ width: `${share}%` }} />
    </span>
  );
}

function Bar({ current, total }: { current: number; total: number }) {
  if (total > MAX_DASHES) return <Track done={current} total={total} />;
  return (
    <span className={styles.dashes}>
      {Array.from({ length: total }, (_, n) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: dashes are positions, never reordered
          key={n}
          className={cx(styles.dash, n < current && styles.done, n === current && styles.current)}
        />
      ))}
    </span>
  );
}

function Panel({ outline, id }: { outline: SessionOutline; id: string }) {
  const t = useT();
  const kinds = KINDS.filter((kind) => outline.kinds[kind].total > 0);
  const toMeet = [
    outline.newWords > 0 && t('ui.outlineNewWords', { n: outline.newWords }),
    outline.newGrammar > 0 && t('ui.outlineNewGrammar', { n: outline.newGrammar }),
  ].filter((line): line is string => typeof line === 'string');
  return (
    <div id={id} role="dialog" aria-label={t('ui.outlineTitle')} className={styles.panel}>
      <p className={styles.head}>
        <span className={styles.big}>
          {outline.current}
          <span className={styles.of}>/{outline.total}</span>
        </span>
        {outline.minutes > 0 && <span>{t('ui.outlineMinutes', { n: outline.minutes })}</span>}
      </p>
      <Track done={outline.current - 1} total={outline.total} large />
      <ul className={styles.kinds}>
        {kinds.map((kind) => (
          <li key={kind} className={styles.kind}>
            <span>{t(KIND_KEY[kind])}</span>
            <span className={styles.count}>
              {outline.kinds[kind].done}/{outline.kinds[kind].total}
            </span>
            <Track done={outline.kinds[kind].done} total={outline.kinds[kind].total} />
          </li>
        ))}
      </ul>
      {toMeet.length > 0 && <p className={styles.meet}>{toMeet.join(' · ')}</p>}
    </div>
  );
}

/** Closes the panel on Escape or a press outside it, and puts focus back on the bar. */
function useDismiss(open: boolean, close: () => void, root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close();
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, close, root]);
}

/**
 * Where the session is (read.html top bar): one dash per card for short sessions, a continuous
 * bar for long ones, and the count. A press shows a small panel of what is done and left (R13).
 */
export function SessionProgress({ current, total, outline }: SessionProgressProps) {
  const t = useT();
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  useDismiss(open, () => setOpen(false), root);
  const number = Math.min(current + 1, total);
  const label = t('ui.sentenceOf', { current: number, total });
  return (
    <span ref={root} className={styles.root}>
      <button
        type="button"
        className={styles.progress}
        aria-label={`${number}/${total}, ${outline ? t('ui.outlineOpen', { label }) : label}`}
        aria-expanded={outline ? open : undefined}
        aria-controls={open ? id : undefined}
        disabled={!outline}
        onClick={() => setOpen((was) => !was)}
      >
        <Bar current={current} total={total} />
        <span className={styles.count} aria-hidden>
          {number}/{total}
        </span>
      </button>
      {open && outline && <Panel outline={outline} id={id} />}
    </span>
  );
}
