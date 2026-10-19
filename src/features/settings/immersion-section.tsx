import { useEffect, useState } from 'react';
import { immersionMode } from '../../domain/immersion.ts';
import type { LearnerOverview } from '../../domain/learner-view.ts';
import { createLearnerView } from '../../domain/services/learner-profile.ts';
import type { ImmersionMode, ImmersionSetting, Settings } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { languageOf, type UiLanguage } from '../../ui/languages.ts';
import { useServices } from '../../ui/services.tsx';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

const MODES = [
  { value: 'auto', label: 'settings.immersionAuto' },
  { value: 'native', label: 'settings.immersionNative' },
  { value: 'mixed', label: 'settings.immersionMixed' },
  { value: 'japanese', label: 'settings.immersionJapanese' },
] as const satisfies readonly { value: ImmersionSetting; label: PlainKey }[];

/** The language's name in the interface language ("French", "français"). */
const LANGUAGE_NAMES: Record<UiLanguage, PlainKey> = {
  en: 'settings.languageEn',
  fr: 'settings.languageFr',
  es: 'settings.languageEs',
};

/** The learner's level and coverage, for what Auto means today (M1). */
function useLearner(): LearnerOverview | undefined {
  const { repos } = useServices();
  const [learner, setLearner] = useState<LearnerOverview>();
  useEffect(() => {
    let live = true;
    createLearnerView(repos)
      .getLearnerProfile()
      .then((view) => live && setLearner(view))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [repos]);
  return learner;
}

function AutoLine({ learner, language }: { learner?: LearnerOverview; language: UiLanguage }) {
  const t = useT();
  if (!learner) return null;
  const mode: ImmersionMode = immersionMode(learner, 'auto');
  const name = t(LANGUAGE_NAMES[language]);
  const where =
    mode === 'japanese'
      ? t('settings.autoJapanese')
      : t(mode === 'mixed' ? 'settings.autoMixed' : 'settings.autoNative', { language: name });
  return <p className={styles.hint}>{t('settings.autoLine', { level: learner.level, where })}</p>;
}

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

/**
 * Settings → Tutor → "Explanations in" (M1, D51): Auto, the learner's language, mixed or
 * Japanese. Japanese is written at the learner's level; new words get furigana and a gloss.
 */
export function ImmersionSection({ settings, onPatch }: Props) {
  const learner = useLearner();
  const current = settings.immersion ?? 'auto';
  const t = useT();
  return (
    <section className={styles.section} aria-label={t('settings.explanationsIn')}>
      <span className={styles.label} aria-hidden="true">
        {t('settings.explanationsIn')}
      </span>
      <fieldset className={styles.choices}>
        <legend className="visually-hidden">{t('settings.explanationsIn')}</legend>
        {MODES.map((mode) => (
          <label key={mode.value} className={styles.choice}>
            <input
              type="radio"
              name="immersion"
              value={mode.value}
              checked={current === mode.value}
              onChange={() => void onPatch({ immersion: mode.value })}
            />
            {t(mode.label)}
          </label>
        ))}
      </fieldset>
      <AutoLine {...(learner ? { learner } : {})} language={languageOf(settings.uiLanguage)} />
      <p className={styles.hint}>{t('settings.immersionHint')}</p>
    </section>
  );
}
