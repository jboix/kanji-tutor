/**
 * Offers the language pack of the chosen language (N9) where the language is picked: the wizard
 * and Settings. Without it, glosses and translations stay in English, marked "(en)".
 */
import { useI18n } from './i18n/i18n.tsx';
import styles from './language-pack-offer.module.css';
import type { UiLanguage } from './languages.ts';
import { PillButton } from './pill-button.tsx';
import { ProgressLine } from './progress-line.tsx';
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
  if (state.phase === 'loading') return t('ui.packLoading', { language });
  if (state.phase === 'error') return t('ui.packFailed');
  return t('ui.packInstalled', { language });
}

/** The install's progress: a bar over the whole pack and its percentage (D137). */
function Progress({ text, share }: { text: string; share: number }) {
  const { t } = useI18n();
  return (
    <div className={styles.progress}>
      <div className={styles.top}>
        <span className={styles.text}>{text}</span>
        <span className={styles.percent}>{t('ui.percent', { n: Math.round(share * 100) })}</span>
      </div>
      <ProgressLine value={share} label={text} />
    </div>
  );
}

/**
 * The pack's state and an Install button; nothing for English, an installed pack, or before the
 * dictionary is in (`ready` false, or no packs installed yet). While it installs, a progress bar.
 */
export function LanguagePackOffer({ language, ready }: { language: UiLanguage; ready?: boolean }) {
  const i18n = useI18n();
  const [state, install] = useLanguagePack(language, ready);
  if (state.phase === 'none' || state.phase === 'installed') return null;
  const name = packName(i18n.t, language);
  const canInstall = state.phase === 'idle' || state.phase === 'error';
  if (state.phase === 'loading') {
    const text = stateText(i18n, state, name);
    return (
      <div className={styles.offer}>
        <Progress text={text} share={state.progress?.overall ?? 0} />
      </div>
    );
  }
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
