import { useRef } from 'react';
import type { PackLanguage, PackProgress } from '../../domain/repos.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { CheckIcon } from '../../ui/icons.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import type { InstallState } from './use-pack-install.ts';
import type { PackQueue } from './use-pack-queue.ts';
import styles from './wizard-chrome.module.css';

const STAGE = {
  words: 'onboarding.stageWords',
  kanji: 'onboarding.stageKanji',
  sentences: 'onboarding.stageSentences',
  grammar: 'onboarding.stageGrammar',
  clusters: 'onboarding.stageClusters',
  units: 'onboarding.stageUnits',
  glosses: 'onboarding.stageGlosses',
  translations: 'onboarding.stageTranslations',
} as const satisfies Record<Exclude<PackProgress['stage'], 'done'>, string>;

const languageName = (t: Translate, language: PackLanguage) =>
  language === 'fr' ? t('ui.packLanguageFr') : t('ui.packLanguageEs');

/** "Now: kanji, 1,200 of 3,062": the part being loaded. */
function stageText(t: Translate, progress: PackProgress | undefined): string {
  if (!progress || progress.stage === 'done') return t('onboarding.dictionaryStarting');
  const stage = t(STAGE[progress.stage]);
  return t('onboarding.dictionaryNow', { stage, loaded: progress.loaded, total: progress.total });
}

/** The dictionary download (D135): what it is for, how far, and the part loading now. */
function Loading({ progress }: { progress: PackProgress | undefined }) {
  const t = useT();
  const share = progress?.overall ?? 0;
  const title = t('onboarding.backgroundLoading');
  return (
    <div className={styles.loading}>
      <div className={styles.loadingTop}>
        <span>{title}</span>
        <span className={styles.percent}>{t('ui.percent', { n: Math.round(share * 100) })}</span>
      </div>
      <ProgressLine value={share} label={title} />
      <span className={styles.now} aria-live="polite">
        {stageText(t, progress)}
      </span>
    </div>
  );
}

function Retry({ text, onRetry }: { text: string; onRetry: () => void }) {
  const t = useT();
  return (
    <div className={styles.background} role="alert">
      <span>{text}</span>
      <button type="button" className={styles.retry} onClick={onRetry}>
        {t('onboarding.tryAgain')}
      </button>
    </div>
  );
}

/** Once the dictionary is in while the wizard is open: a quiet line that it is. */
function Loaded() {
  const t = useT();
  return (
    <div className={styles.loaded} role="status">
      <CheckIcon />
      <span>{t('onboarding.dictionaryReady')}</span>
    </div>
  );
}

export interface DownloadProps {
  install: InstallState;
  onInstall: () => void;
  queue: PackQueue;
}

/**
 * The background download (D134, D135): the dictionary with its progress, a retry if it fails,
 * then one line once it is in. The meanings in the chosen language follow it without a word
 * (D136); only a failure shows, with a retry.
 */
export function DownloadStatus({ install, onInstall, queue }: DownloadProps) {
  const t = useT();
  const seen = useRef(false);
  if (install.phase === 'loading') {
    seen.current = true;
    return <Loading progress={install.progress} />;
  }
  if (install.phase === 'error') {
    return <Retry text={t('onboarding.dictionaryFailed')} onRetry={onInstall} />;
  }
  if (install.phase !== 'done') return null;
  if (queue.pack.phase === 'error' && queue.language) {
    const text = t('onboarding.packFailed', { language: languageName(t, queue.language) });
    return <Retry text={text} onRetry={queue.retryPack} />;
  }
  return seen.current ? <Loaded /> : null;
}
