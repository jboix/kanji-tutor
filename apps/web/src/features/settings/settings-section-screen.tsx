import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { BackButton } from '../../ui/back-button.tsx';
import { BottomNav } from '../../ui/bottom-nav.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useInstallWay } from '../../ui/install-prompt.ts';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { applyTheme } from '../../ui/theme.ts';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './settings.module.css';
import { type Category, categoryById } from './settings-categories.tsx';
import { useSettings } from './use-settings.ts';

function Sections({ category }: { category: Category }) {
  const { settings, patch, reload, replace } = useSettings();
  const [generation, setGeneration] = useState(0);
  const navigate = useNavigate();
  const onImported = async () => {
    applyTheme((await reload()).theme);
    setGeneration((value) => value + 1);
  };
  const onWelcomeAgain = () => {
    void patch({ onboarded: false, onboardingStep: '' }).then(() => navigate(paths.onboarding));
  };
  if (!settings) return null;
  return (
    <>{category.render({ settings, patch, replace, onImported, onWelcomeAgain, generation })}</>
  );
}

/**
 * One Settings category (IA5), sliding in from the right (not with reduced motion). Back
 * returns to the list; an unknown category, or Install once installed, goes to the list.
 */
export function SettingsSectionScreen() {
  const { section } = useParams();
  const category = categoryById(section);
  const t = useT();
  const installed = useInstallWay() === 'installed';
  // Install has nothing to offer once installed, even when opened from a link.
  if (!category || (installed && category.id === 'install')) {
    return <Navigate to={paths.settings} replace />;
  }
  const back = <BackButton parent={paths.settings} label={t('settings.backToList')} />;
  return (
    <Screen
      topBar={<TopBar start={back} title={t(category.title)} />}
      footer={<BottomNav install={false} />}
    >
      <div className={styles.slide}>
        <Sections category={category} />
      </div>
    </Screen>
  );
}
