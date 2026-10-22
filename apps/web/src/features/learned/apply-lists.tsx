import { Link } from 'react-router';
import type { JlptList } from '../../domain/services/index.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import styles from './learned.module.css';
import { applyLine } from './learned-copy.ts';
import { type ApplyPhase, useApplyList } from './use-learned.ts';

const LISTS: readonly JlptList[] = ['n5', 'n4'];

function Status({ phase }: { phase: ApplyPhase }) {
  const t = useT();
  if (phase.phase === 'running') {
    return (
      <p className={styles.muted} aria-live="polite">
        {t('learned.marking', { list: phase.list.toUpperCase() })}
      </p>
    );
  }
  if (phase.phase === 'failed') {
    return (
      <p className={styles.muted} role="alert">
        {t('learned.failed')}
      </p>
    );
  }
  if (phase.phase !== 'done') return null;
  return (
    <p className={styles.muted} role="status">
      {t('learned.result', {
        list: phase.list.toUpperCase(),
        text: applyLine(t, phase.result.marked, phase.result.already),
      })}
    </p>
  );
}

/** Apply the N5 or N4 list again at any time (P2): safe to repeat, never lowers a level. */
export function ApplyLists({ onApplied }: { onApplied: () => void }) {
  const { t, rich } = useI18n();
  const [phase, apply] = useApplyList(onApplied);
  return (
    <section className={styles.apply} aria-labelledby="learned-apply">
      <SectionLabel>
        <span id="learned-apply">{t('learned.applyHeading')}</span>
      </SectionLabel>
      <p className={styles.hint}>
        {rich('learned.applyHint', {
          link: <Link to={paths.knownImport}>{t('learned.importPage')}</Link>,
        })}
      </p>
      <div className={styles.applyRow}>
        {LISTS.map((list) => (
          <PillButton
            key={list}
            variant="secondary"
            disabled={phase.phase === 'running'}
            onClick={() => void apply(list)}
          >
            {t('learned.markList', { list: list.toUpperCase() })}
          </PillButton>
        ))}
      </div>
      <Status phase={phase} />
    </section>
  );
}
