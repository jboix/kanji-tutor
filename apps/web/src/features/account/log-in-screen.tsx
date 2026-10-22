import { type ReactNode, useState } from 'react';
import type { CloudPort } from '../../domain/cloud.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { KeyIcon, MailIcon, PhoneIcon } from '../../ui/icons.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { useServices } from '../../ui/services.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { EmailWay } from './email-way.tsx';
import { LinkWay } from './link-way.tsx';
import styles from './log-in.module.css';
import { PasskeyWay } from './passkey-way.tsx';

type WayId = 'link' | 'passkey' | 'email';

interface Way {
  id: WayId;
  title: PlainKey;
  detail: PlainKey;
  icon: ReactNode;
  panel: (cloud: CloudPort) => ReactNode;
}

/** The three ways in, most common first: another device, a passkey, an emailed code. */
const WAYS: Way[] = [
  {
    id: 'link',
    title: 'account.linkPhone',
    detail: 'account.linkPhoneDetail',
    icon: <PhoneIcon />,
    panel: (cloud) => <LinkWay cloud={cloud} />,
  },
  {
    id: 'passkey',
    title: 'account.passkey',
    detail: 'account.passkeyDetail',
    icon: <KeyIcon />,
    panel: (cloud) => <PasskeyWay cloud={cloud} />,
  },
  {
    id: 'email',
    title: 'account.emailCode',
    detail: 'account.emailCodeDetail',
    icon: <MailIcon />,
    panel: (cloud) => <EmailWay cloud={cloud} />,
  },
];

function WayList({ onChoose }: { onChoose: (id: WayId) => void }) {
  const t = useT();
  return (
    <ul className={styles.list}>
      {WAYS.map((way) => (
        <li key={way.id}>
          <button type="button" className={styles.row} onClick={() => onChoose(way.id)}>
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
  );
}

/**
 * Log in: bring the progress saved on another device. Choosing a way opens its steps in place;
 * once in, the app starts again on the progress it brought.
 */
export function LogInScreen() {
  const t = useT();
  const { cloud } = useServices();
  const [chosen, setChosen] = useState<WayId | undefined>(undefined);
  const way = WAYS.find((w) => w.id === chosen);
  const back = <BackButton parent={paths.onboarding} label={t('account.backToWelcome')} />;
  const title = way ? t(way.title) : t('account.logInTitle');
  return (
    <Screen topBar={<TopBar start={back} title={title} />}>
      {!way && <p className={styles.lead}>{t('account.logInLead')}</p>}
      {!way && <WayList onChoose={setChosen} />}
      {way && cloud && way.panel(cloud)}
      {way && (
        <button type="button" className={styles.back} onClick={() => setChosen(undefined)}>
          {t('account.otherWays')}
        </button>
      )}
    </Screen>
  );
}
