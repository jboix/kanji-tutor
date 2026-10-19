/**
 * Offers the language pack of the chosen language (N9) where the language is picked: the wizard
 * and Settings. Without it, glosses and translations stay in English, marked "(en)".
 */
import { useI18n } from './i18n/i18n.tsx';
import styles from './language-pack-offer.module.css';
import type { UiLanguage } from './languages.ts';
import { PillButton } from './pill-button.tsx';
import { type LanguagePackState, useLanguagePack } from './use-language-pack.ts';

type Text = ReturnType<typeof useI18n>;

function packName(t: Text['t'], language: UiLanguage): string {
  return language === 'fr' ? t('ui.packLanguageFr') : t('ui.packLanguageEs');
}

function stateText({ t, format }: Text, state: LanguagePackState, language: string): string {
  if (state.phase === 'idle') {
    const size = format.number(state.bytes / 1e6, { maximumFractionDigits: 1 });
    return t('ui.packMissing', { language, size });
  }
  if (state.phase === 'loading') {
    const { loaded = 0, total = 0 } = state.progress ?? {};
    return total > 0 ? t('ui.packLoading', { loaded, total }) : t('ui.packStarting');
  }
  if (state.phase === 'error') return t('ui.packFailed');
  return t('ui.packInstalled', { language });
}

/**
 * The pack's state and an Install button; nothing for English, an installed pack, or before the
 * dictionary is in (`ready` false, or no packs installed yet).
 */
export function LanguagePackOffer({ language, ready }: { language: UiLanguage; ready?: boolean }) {
  const i18n = useI18n();
  const [state, install] = useLanguagePack(language, ready);
  if (state.phase === 'none' || state.phase === 'installed') return null;
  const name = packName(i18n.t, language);
  const canInstall = state.phase === 'idle' || state.phase === 'error';
  return (
    <div className={styles.offer}>
      <p className={styles.text} role="status">
        {stateText(i18n, state, name)}
      </p>
      {canInstall && (
        <PillButton variant="secondary" onClick={() => void install()}>
          {i18n.t('ui.packInstall', { language: name })}
        </PillButton>
      )}
    </div>
  );
}
