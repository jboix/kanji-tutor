import { type FormEvent, useId, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { CloudPort } from '../../domain/cloud.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { CloudErrorText } from '../../ui/cloud-error-text.tsx';
import { deviceName } from '../../ui/device-name.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { useCloud } from '../../ui/use-cloud.ts';
import { reopenApp, useCloudAction } from '../../ui/use-cloud-action.ts';
import styles from './log-in.module.css';

function JoinForm({ cloud, onDone }: { cloud: CloudPort; onDone: () => void }) {
  const t = useT();
  const id = useId();
  const [params] = useSearchParams();
  const { busy, error, run } = useCloudAction();
  const [invite, setInvite] = useState(params.get('code') ?? '');
  const turnOn = (event: FormEvent) => {
    event.preventDefault();
    void run(() => cloud.turnOn(invite, deviceName(navigator.userAgent)), onDone);
  };
  return (
    <form className={styles.panel} onSubmit={turnOn}>
      <p className={styles.lead}>{t('account.joinLead')}</p>
      <label className={styles.field} htmlFor={`${id}-invite`}>
        {t('account.inviteLabel')}
        <input
          id={`${id}-invite`}
          className={styles.input}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          required
          value={invite}
          onChange={(event) => setInvite(event.target.value)}
        />
      </label>
      <PillButton block type="submit" disabled={busy}>
        {busy ? t('account.passkeyWaiting') : t('account.joinButton')}
      </PillButton>
      <CloudErrorText error={error} className={styles.error} />
    </form>
  );
}

/**
 * Turn on cloud saves, opened from an invite link (`?invite=` brings the app here) or from
 * Settings: the code, then a passkey for this device; this device's progress is the first save.
 */
export function JoinScreen() {
  const t = useT();
  const { cloud, state } = useCloud();
  const [done, setDone] = useState(false);
  const back = <BackButton parent={paths.today} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('account.joinTitle')} />}>
      {done || state.signedIn ? (
        <div className={styles.panel}>
          <p className={styles.lead}>{t(done ? 'account.joinDone' : 'account.joinAlready')}</p>
          <PillButton block onClick={reopenApp}>
            {t('account.joinContinue')}
          </PillButton>
        </div>
      ) : (
        cloud && <JoinForm cloud={cloud} onDone={() => setDone(true)} />
      )}
    </Screen>
  );
}
