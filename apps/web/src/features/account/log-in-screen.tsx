import type { ReactNode } from 'react';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { KeyIcon, MailIcon, PhoneIcon } from '../../ui/icons.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './log-in.module.css';

interface Way {
  id: string;
  title: PlainKey;
  detail: PlainKey;
  icon: ReactNode;
}

/** The three ways in, most common first: another device, a passkey, an emailed code. */
const WAYS: Way[] = [
  {
    id: 'link',
    title: 'account.linkPhone',
    detail: 'account.linkPhoneDetail',
    icon: <PhoneIcon />,
  },
  { id: 'passkey', title: 'account.passkey', detail: 'account.passkeyDetail', icon: <KeyIcon /> },
  {
    id: 'email',
    title: 'account.emailCode',
    detail: 'account.emailCodeDetail',
    icon: <MailIcon />,
  },
];

/**
 * Log in from the welcome: bring the progress saved on another device. The cloud-save server is
 * not there yet, so the ways are shown but cannot be chosen, and the note says so.
 */
export function LogInScreen() {
  const t = useT();
  const back = <BackButton parent={paths.onboarding} label={t('account.backToWelcome')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('account.logInTitle')} />}>
      <p className={styles.lead}>{t('account.logInLead')}</p>
      <ul className={styles.list}>
        {WAYS.map((way) => (
          <li key={way.id}>
            <button type="button" className={styles.row} disabled>
              <span className={styles.icon} aria-hidden="true">
                {way.icon}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{t(way.title)}</span>
                <span className={styles.detail}>{t(way.detail)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{t('account.notYet')}</p>
    </Screen>
  );
}
