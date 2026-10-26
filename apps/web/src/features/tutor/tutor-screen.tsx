import { Link } from 'react-router';
import { BottomNav } from '../../ui/bottom-nav.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { modelName, type TutorSetup, useTutorSetup } from '../../ui/use-tutor-setup.ts';
import { AskCard } from './ask-card.tsx';
import { ClassSection } from './class-section.tsx';
import { SetUpCard } from './set-up-card.tsx';
import styles from './tutor.module.css';

/** "Gemini 3.5 Flash-Lite · your key", and the way to the tutor's settings. */
function ModelLine({ setup }: { setup: TutorSetup }) {
  const t = useT();
  const model = modelName(setup.modelId);
  return (
    <Link to={paths.settingsSection('tutor')} className={styles.model}>
      <span className={styles.modelDot} aria-hidden="true" />
      <span className={styles.modelName}>{setup.ownKey ? t('tutor.model', { model }) : model}</span>
      <span className={styles.modelLink}>{t('tutor.settings')}</span>
    </Link>
  );
}

/**
 * The Tutor tab: ask the tutor anything, carry on the last conversation, and bring in what you
 * study in class (scanned lessons, a sentence of your own, the week's words). Without a key, one
 * card to set the tutor up, and what needs it says so. Each sub-screen's back returns here.
 */
export function TutorScreen() {
  const t = useT();
  const setup = useTutorSetup();
  return (
    <Screen footer={<BottomNav />} gap={22}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('tutor.title')}</h1>
        <p className={styles.lead}>{t('tutor.lead')}</p>
      </header>
      {setup && (setup.ready ? <AskCard /> : <SetUpCard />)}
      {setup && <ClassSection ready={setup.ready} />}
      {setup?.ready && <ModelLine setup={setup} />}
    </Screen>
  );
}
