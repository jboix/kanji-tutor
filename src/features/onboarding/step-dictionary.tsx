import type { PackProgress } from '../../domain/repos.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { LanguagePackOffer } from '../../ui/language-pack-offer.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import { Lead, Note, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import { type InstallState, sizeText, stageText } from './use-pack-install.ts';
import styles from './wizard.module.css';

function ratio(progress: PackProgress | undefined): number {
  if (!progress || progress.total === 0) return 0;
  return progress.loaded / progress.total;
}

/** The download's progress line and stage text ("Words 12,000 of 48,000"). */
export function DictionaryProgress({ progress }: { progress: PackProgress | undefined }) {
  const t = useT();
  return (
    <div className={styles.loading}>
      <ProgressLine value={ratio(progress)} label={t('onboarding.dictionaryLoading')} />
      <p className={styles.stage} aria-live="polite">
        {progress ? stageText(t, progress) : t('onboarding.starting')}
      </p>
    </div>
  );
}

function intro(t: Translate, state: InstallState): string {
  if (state.phase === 'idle' && state.bytes) {
    return t('onboarding.dictionaryOnceSize', { size: sizeText(t, state.bytes) });
  }
  return t('onboarding.dictionaryOnce');
}

function canLoad(state: InstallState): boolean {
  return state.phase === 'idle' || state.phase === 'error';
}

/**
 * The dictionary download (N4) with progress and a retry. Next opens once it has started: the
 * download goes on in the background while the next steps are filled in. Once it is in, the
 * chosen language's pack is offered here too (N9, D52).
 */
export function StepDictionary({ install, onInstall }: Pick<StepProps, 'install' | 'onInstall'>) {
  const { t, language } = useI18n();
  return (
    <>
      <StepHeading>{t('onboarding.dictionaryHeading')}</StepHeading>
      <Lead>{t('onboarding.dictionaryLead', { intro: intro(t, install) })}</Lead>
      {install.phase === 'loading' && <DictionaryProgress progress={install.progress} />}
      {install.phase === 'loading' && <Note>{t('onboarding.dictionaryGoOn')}</Note>}
      {install.phase === 'error' && <Note alert>{t('onboarding.dictionaryFailed')}</Note>}
      {canLoad(install) && (
        <button type="button" className={styles.primary} onClick={onInstall}>
          {install.phase === 'error' ? t('onboarding.tryAgain') : t('onboarding.dictionaryLoad')}
        </button>
      )}
      {install.phase === 'done' && <Note>{t('onboarding.dictionaryDone')}</Note>}
      <LanguagePackOffer language={language} ready={install.phase === 'done'} />
    </>
  );
}
