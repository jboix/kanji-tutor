import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '../domain/types.ts';
import { useBackupReminderShown } from './backup-reminder.tsx';
import { Chip } from './chip.tsx';
import { useI18n } from './i18n/i18n.tsx';
import { IconButton } from './icon-button.tsx';
import { CloseIcon, ShareIcon } from './icons.tsx';
import styles from './install-banner.module.css';
import { type InstallWay, promptInstall, useInstallWay } from './install-prompt.ts';
import { useServices } from './services.tsx';

/** "Not now" lasts until the next app open: sessionStorage clears when the app is closed. */
export const INSTALL_NOT_NOW_KEY = 'kanji-tutor.install-not-now';

/** What decides whether the install banner shows (N1d). */
export interface InstallBannerState {
  way: InstallWay;
  settings: Settings | undefined;
  notNow: boolean;
  backupShown: boolean;
}

/**
 * The banner shows only to an onboarded learner in a browser tab, until it is closed or the app
 * installed, and not while "Not now" holds or the backup reminder is showing (N1d).
 */
export function showsInstallBanner(state: InstallBannerState): boolean {
  const { way, settings, notNow, backupShown } = state;
  if (!settings?.onboarded || settings.installBannerClosed === true) return false;
  return way !== 'installed' && !notNow && !backupShown;
}

/** Reads "Not now" for this app open; storage may be blocked, which counts as not set. */
export function readNotNow(): boolean {
  try {
    return sessionStorage.getItem(INSTALL_NOT_NOW_KEY) === '1';
  } catch {
    return false;
  }
}

function writeNotNow(): void {
  try {
    sessionStorage.setItem(INSTALL_NOT_NOW_KEY, '1');
  } catch {
    // Blocked storage: the banner still hides for the rest of this screen's life.
  }
}

function useInstallBanner() {
  const { repos } = useServices();
  const way = useInstallWay();
  const backupShown = useBackupReminderShown();
  const [settings, setSettings] = useState<Settings>();
  const [notNow, setNotNow] = useState(readNotNow);
  useEffect(() => {
    void repos.settings.get().then(setSettings);
  }, [repos]);
  const close = useCallback(async () => {
    setSettings(await repos.settings.patch({ installBannerClosed: true }));
  }, [repos]);
  const installed = way === 'installed' && settings?.onboarded === true;
  useEffect(() => {
    if (installed && settings?.installBannerClosed !== true) void close();
  }, [installed, settings, close]);
  const later = useCallback(() => {
    writeNotNow();
    setNotNow(true);
  }, []);
  return { way, visible: showsInstallBanner({ way, settings, notNow, backupShown }), close, later };
}

function InstallHow({ way }: { way: InstallWay }) {
  const { t, rich } = useI18n();
  if (way === 'ios') {
    const icon = (
      <span className={styles.icon} role="img" aria-label={t('settings.installShare')}>
        <ShareIcon />
      </span>
    );
    return <p className={styles.text}>{rich('settings.installIos', { icon })}</p>;
  }
  if (way === 'prompt') return null;
  return <p className={styles.text}>{t('settings.installMenu')}</p>;
}

/**
 * A quiet install offer on the top-level screens (N1d): the browser's Install button where it
 * offers one, the Share steps on iOS, the browser menu elsewhere. "Not now" hides it until the
 * next open; the close button hides it for good. Settings → Install keeps the steps.
 */
export function InstallBanner() {
  const { way, visible, close, later } = useInstallBanner();
  const { t } = useI18n();
  if (!visible) return null;
  return (
    <aside className={styles.banner} aria-label={t('ui.installLabel')}>
      <div className={styles.body}>
        <p className={styles.lead}>{t('ui.installLead')}</p>
        <InstallHow way={way} />
        <div className={styles.actions}>
          {way === 'prompt' && (
            <Chip onClick={() => void promptInstall()}>{t('settings.installButton')}</Chip>
          )}
          <Chip onClick={later}>{t('ui.installNotNow')}</Chip>
        </div>
      </div>
      <IconButton size={36} muted aria-label={t('ui.installClose')} onClick={() => void close()}>
        <CloseIcon />
      </IconButton>
    </aside>
  );
}
