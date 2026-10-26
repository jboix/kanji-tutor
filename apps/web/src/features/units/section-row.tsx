/**
 * One lesson section on a unit page: a round badge (a check once done, its number otherwise),
 * its name and sample, its parts done or "Again" once done, and a tap to open it. The section to
 * do next is a tonal card with a straight line of its parts; badges are never filled with the
 * accent.
 */
import type { ReactNode } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon, RefreshIcon, TickIcon } from '../../ui/icons.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import styles from './section-row.module.css';

export type SectionState = 'done' | 'now' | 'later';

export interface SectionRowProps {
  /** Its place in the lesson, from 1. */
  order: number;
  state: SectionState;
  /** "言葉 · Words". */
  name: ReactNode;
  /** A Japanese sample of what it holds, on one line. */
  sample?: string | undefined;
  /** A plain line in its place when there is no Japanese to sample. */
  detail: string;
  /** Its parts done, shown as "1 of 2". */
  count?: { done: number; total: number } | undefined;
  /** A quiet word in place of the count, e.g. "Done". */
  aside?: string | undefined;
  onClick: () => void;
}

function Badge({ order, state }: Pick<SectionRowProps, 'order' | 'state'>) {
  return (
    <span className={styles.badge} data-state={state} aria-hidden="true">
      {state === 'done' ? <TickIcon /> : order}
    </span>
  );
}

function Lines({ name, sample, detail, count, state }: SectionRowProps) {
  const t = useT();
  return (
    <span className={styles.lines}>
      <span className={styles.name}>{name}</span>
      {sample ? (
        <span lang="ja" className={styles.sample}>
          {sample}
        </span>
      ) : (
        <span className={styles.detail}>{detail}</span>
      )}
      {state === 'now' && count && (
        <span className={styles.bar}>
          <ProgressLine
            inline
            value={count.total > 0 ? count.done / count.total : 0}
            label={t('ui.progressOf', { line: t('ui.partOf', count) })}
          />
        </span>
      )}
    </span>
  );
}

/** The row's end: "Again" once the section is done ("Done" for a screen reader), else its parts. */
function Tail({ state, count, aside }: SectionRowProps) {
  const t = useT();
  if (state === 'done') {
    return (
      <span className={styles.again}>
        <span className="visually-hidden">{aside} · </span>
        <RefreshIcon />
        {t('units.sectionAgain')}
      </span>
    );
  }
  return (
    <>
      <span className={styles.count}>{count ? t('ui.partOf', count) : aside}</span>
      <span className={styles.chevron}>
        <ChevronIcon />
      </span>
    </>
  );
}

/** The row (see the module comment); the badge sits beside the button, out of its name. */
export function SectionRow(props: SectionRowProps) {
  const { order, state, onClick } = props;
  return (
    <div className={styles.row} data-state={state}>
      <Badge order={order} state={state} />
      <button type="button" className={styles.button} onClick={onClick}>
        <Lines {...props} />
        <Tail {...props} />
      </button>
    </div>
  );
}
