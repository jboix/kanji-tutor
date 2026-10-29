import { createContext, use } from 'react';
import styles from './explain-new.module.css';
import { useT } from './i18n/i18n.tsx';

/** What an intro card explains: a grammar point, or a new word and its kanji. */
export type ExplainKind = 'grammar' | 'kanji';

/** A session's "explain new … first" choices, live, and the way to change them (L7). */
export interface ExplainNew {
  on: Readonly<Record<ExplainKind, boolean>>;
  set: (kind: ExplainKind, on: boolean) => void;
}

/** Provided by a session; an intro shown elsewhere has no box to tick. */
export const ExplainNewContext = createContext<ExplainNew | undefined>(undefined);

const LABEL = {
  grammar: 'ui.skipGrammarIntros',
  kanji: 'ui.skipKanjiIntros',
} as const;

/**
 * Under an intro card, or the same intro opened from a "New" chip: a box to stop these intros
 * from here on. Ticked, it says how to bring them back, and the chip's sheet shows it ticked so
 * it can be unticked there.
 */
export function ExplainToggle({ kind }: { kind: ExplainKind }) {
  const t = useT();
  const explain = use(ExplainNewContext);
  if (!explain) return null;
  const skipped = !explain.on[kind];
  return (
    <div className={styles.toggle}>
      <label className={styles.label}>
        <input type="checkbox" checked={skipped} onChange={() => explain.set(kind, skipped)} />
        {t(LABEL[kind])}
      </label>
      {skipped && <p className={styles.note}>{t('ui.skipIntrosNote')}</p>}
    </div>
  );
}
