import { useEffect, useState } from 'react';
import type { CloudPort } from '../../domain/cloud.ts';
import { CloudErrorText } from '../../ui/cloud-error-text.tsx';
import { deviceName } from '../../ui/device-name.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { reopenApp, useCloudAction } from '../../ui/use-cloud-action.ts';
import styles from './log-in.module.css';

/** One code, shown while this device asks whether it was let in; it stops when left. */
function LinkAttempt({ cloud, onRetry }: { cloud: CloudPort; onRetry: () => void }) {
  const t = useT();
  const { error, run } = useCloudAction();
  const [code, setCode] = useState<string | undefined>(undefined);
  useEffect(() => {
    const stop = new AbortController();
    void (async () => {
      const started = await run(
        () => cloud.startLink(deviceName(navigator.userAgent)),
        (link) => setCode(link.code),
      );
      if (started && !stop.signal.aborted)
        await run(() => cloud.waitForLink(stop.signal), reopenApp);
    })();
    return () => stop.abort();
  }, [cloud, run]);
  return (
    <>
      {code && (
        <p className={styles.code} aria-live="polite">
          {code}
        </p>
      )}
      {!error && <p className={styles.message}>{t('account.linkWaiting')}</p>}
      <CloudErrorText error={error} className={styles.error} />
      {error && (
        <PillButton variant="secondary" onClick={onRetry}>
          {t('account.linkNewCode')}
        </PillButton>
      )}
    </>
  );
}

/**
 * Link from the signed-in phone: this device shows a code, the phone types it and lets it in,
 * and this device, asking every few seconds, gets its session and the progress. Leaving the
 * screen stops the asking; an expired code offers a new one.
 */
export function LinkWay({ cloud }: { cloud: CloudPort }) {
  const t = useT();
  const [attempt, setAttempt] = useState(0);
  return (
    <div className={styles.panel}>
      <p className={styles.message}>{t('account.linkSteps')}</p>
      <LinkAttempt key={attempt} cloud={cloud} onRetry={() => setAttempt((n) => n + 1)} />
    </div>
  );
}
