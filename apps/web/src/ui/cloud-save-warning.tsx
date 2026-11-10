import type { CloudPort } from '../domain/cloud.ts';
import { ActionRow } from './action-bar.tsx';
import styles from './cloud-save-warning.module.css';
import { useT } from './i18n/i18n.tsx';
import { paths } from './paths.ts';
import { PillButton, PillLink } from './pill-button.tsx';

/**
 * A warning while cloud saves are on but the last save failed: progress stays on this device and
 * is no longer kept online until a save goes through. It tries again by itself; "Try again" tries
 * now, and the cloud settings say more. It goes away once a save succeeds: no dismissing a
 * problem that is still there.
 */
export function CloudSaveWarning({ cloud }: { cloud: CloudPort }) {
  const t = useT();
  return (
    <aside className={styles.warning} role="status" aria-label={t('ui.cloudFailedLabel')}>
      <p className={styles.text}>
        <strong className={styles.head}>{t('ui.cloudFailedHead')}</strong> {t('ui.cloudFailedBody')}
      </p>
      <ActionRow>
        <PillButton variant="secondary" onClick={() => void cloud.saveNow()}>
          {t('ui.cloudFailedRetry')}
        </PillButton>
        <PillLink variant="secondary" to={paths.settingsSection('cloud')}>
          {t('ui.cloudFailedDetails')}
        </PillLink>
      </ActionRow>
    </aside>
  );
}
