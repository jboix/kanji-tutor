/** The quiet level-up suggestion on Today (P4). */
import { useState } from 'react';
import { type LevelUp, moveUpLevel, snoozeLevelUp } from '../../domain/services/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './today.module.css';

/**
 * "You know 82% of N5. Move to N4?" with Not now (P4). Moves only when chosen; both stay quiet,
 * so Continue stays the screen's one filled button.
 */
export function LevelUpRow({ levelUp, onChange }: { levelUp: LevelUp; onChange: () => void }) {
  const { repos } = useServices();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const act = (run: () => Promise<void>) => {
    setBusy(true);
    void run().then(onChange);
  };
  return (
    <section className={styles.levelUp} aria-label={t('today.yourLevel')}>
      <p className={styles.text}>
        {t('today.levelUp', {
          percent: levelUp.percent,
          level: levelUp.level,
          next: levelUp.next,
        })}
      </p>
      <div className={styles.levelUpActions}>
        <PillButton
          variant="secondary"
          disabled={busy}
          onClick={() => act(() => moveUpLevel(repos, levelUp.next))}
        >
          {t('today.moveTo', { level: levelUp.next })}
        </PillButton>
        <PillButton
          variant="text"
          disabled={busy}
          onClick={() => act(() => snoozeLevelUp(repos, Date.now()))}
        >
          {t('today.notNow')}
        </PillButton>
      </div>
    </section>
  );
}
