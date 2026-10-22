import type { CloudPort } from '../../domain/cloud.ts';
import { CloudErrorText } from '../../ui/cloud-error-text.tsx';
import { deviceName } from '../../ui/device-name.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { reopenApp, useCloudAction } from '../../ui/use-cloud-action.ts';
import styles from './log-in.module.css';

/** Log in with a passkey of this site: the device's own prompt, then the progress comes. */
export function PasskeyWay({ cloud }: { cloud: CloudPort }) {
  const t = useT();
  const { busy, error, run } = useCloudAction();
  const logIn = () => run(() => cloud.logInWithPasskey(deviceName(navigator.userAgent)), reopenApp);
  return (
    <div className={styles.panel}>
      <p className={styles.message}>{t('account.passkeyDetail')}</p>
      <PillButton block onClick={() => void logIn()} disabled={busy}>
        {busy ? t('account.passkeyWaiting') : t('account.passkeyButton')}
      </PillButton>
      <CloudErrorText error={error} className={styles.error} />
    </div>
  );
}
