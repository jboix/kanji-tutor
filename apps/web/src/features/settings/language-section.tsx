import type { Settings } from '../../domain/types.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { LanguagePackOffer } from '../../ui/language-pack-offer.tsx';
import { languageOf, UI_LANGUAGES, type UiLanguage } from '../../ui/languages.ts';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { SettingField } from './setting-field.tsx';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

/**
 * The interface and explanation language (N7b, N10): the whole UI switches at once, and a missing
 * French or Spanish pack can be installed from here (N9).
 */
export function LanguageSection({ settings, onPatch }: Props) {
  const { t, setLanguage } = useI18n();
  const language = languageOf(settings.uiLanguage);
  const choose = async (uiLanguage: UiLanguage) => {
    await onPatch({ uiLanguage });
    await setLanguage(uiLanguage);
  };
  return (
    <section className={styles.section} aria-label={t('settings.language')}>
      <SettingField
        label={t('settings.language')}
        hint={t('settings.languageHint')}
        status={<LanguagePackOffer language={language} />}
      >
        <SegmentedControl
          label={t('settings.language')}
          options={UI_LANGUAGES}
          value={language}
          onChange={(value) => void choose(value)}
        />
      </SettingField>
    </section>
  );
}
