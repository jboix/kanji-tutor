import { useT } from '../../ui/i18n/i18n.tsx';
import { useInstallWay } from '../../ui/install-prompt.ts';
import { KanaNote } from './kana-note.tsx';
import { Lead, Note, StepHeading } from './step-parts.tsx';
import styles from './wizard.module.css';

/** What the app is, in three lines (P5), that it needs kana (P8), and where to install it (N1b). */
export function StepWelcome() {
  const t = useT();
  const installed = useInstallWay() === 'installed';
  return (
    <>
      <p className={styles.mark} lang="ja">
        読む
      </p>
      <StepHeading>{t('onboarding.welcomeHeading')}</StepHeading>
      <ul className={styles.lines}>
        <li>{t('onboarding.welcomeLine1')}</li>
        <li>{t('onboarding.welcomeLine2')}</li>
        <li>{t('onboarding.welcomeLine3')}</li>
      </ul>
      <KanaNote />
      <Lead>{t('onboarding.welcomeLead')}</Lead>
      {!installed && <Note>{t('onboarding.welcomeInstall')}</Note>}
    </>
  );
}
