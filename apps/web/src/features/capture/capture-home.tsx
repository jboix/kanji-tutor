import { useState } from 'react';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './capture.module.css';
import { RecentCaptures } from './recent-captures.tsx';
import { PasteForm, PhotoButtons, StartStatus } from './start-controls.tsx';
import { useCaptureStart } from './use-capture-start.ts';

/** Capture, from the Add tab (IA3): start a capture, or open a recent one. Back goes to Add. */
export function CaptureHome() {
  const [now] = useState(() => Date.now());
  const { state, fromPhoto, fromText } = useCaptureStart();
  const busy = state.status === 'busy';
  const t = useT();
  const back = <BackButton parent={paths.add} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('capture.homeTitle')} />} gap={28}>
      <p className={styles.lead}>{t('capture.homeLead')}</p>
      <div className={styles.start}>
        <PhotoButtons onPhoto={(client, file) => void fromPhoto(client, file)} busy={busy} />
        <PasteForm onText={(text) => void fromText(text)} busy={busy} />
        <StartStatus state={state} />
      </div>
      <RecentCaptures now={now} />
    </Screen>
  );
}
