import type { ReactNode } from 'react';
import { learnerLevelOf } from '../../domain/services/index.ts';
import type { Settings } from '../../domain/types.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { languageName } from '../../ui/languages.ts';
import { volumeOf } from '../../ui/volume-slider.tsx';
import { knownText } from './known-text.ts';
import { Lead, Note, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import { START_LISTS, type StartChoice, type StepId } from './steps.ts';
import styles from './wizard.module.css';

const START_TEXT = {
  zero: 'onboarding.summaryZero',
  n5: 'onboarding.summaryN5',
  n4: 'onboarding.summaryN4',
  n3: 'onboarding.summaryN3',
} as const satisfies Record<StartChoice, string>;

function aiText(t: Translate, settings: Settings): string {
  if (!settings.apiKey) return t('onboarding.summaryNoKey');
  return t('onboarding.summaryKey');
}

function feelText(t: Translate, settings: Settings): string {
  const volume = volumeOf(settings);
  const sounds = volume === 0 ? t('onboarding.soundsOff') : t('onboarding.soundsAt', { n: volume });
  const furigana =
    settings.furigana === 'all' ? t('onboarding.furiganaOnAll') : t('onboarding.furiganaOnNew');
  return t('onboarding.summaryFeel', { sounds, furigana });
}

interface Row {
  step: StepId;
  label: string;
  value: ReactNode;
}

function rows(t: Translate, { wizard, settings }: StepProps): Row[] {
  const start = t(START_TEXT[wizard.draft.start]);
  const level = t('onboarding.summaryLevel', { start, level: learnerLevelOf(settings) });
  const lesson = settings.currentLesson ? (
    <span>
      <JaRuns text={settings.currentLesson} />
    </span>
  ) : (
    t('onboarding.none')
  );
  const language = wizard.draft.language;
  return [
    {
      step: 'language',
      label: t('onboarding.rowLanguage'),
      value: <span lang={language}>{languageName(language)}</span>,
    },
    { step: 'start', label: t('onboarding.rowStart'), value: level },
    { step: 'class', label: t('onboarding.rowClass'), value: lesson },
    {
      step: 'class',
      label: t('onboarding.rowKnown'),
      value: knownText(t, { ...wizard.known, pending: [...START_LISTS[wizard.draft.start]] }),
    },
    { step: 'ai', label: t('onboarding.rowAi'), value: aiText(t, settings) },
    { step: 'feel', label: t('onboarding.rowFeel'), value: feelText(t, settings) },
  ];
}

/** Every choice with a "Change" that jumps back to its step (P5). */
export function StepSummary(props: StepProps) {
  const { t, language } = useI18n();
  return (
    <>
      <StepHeading>{t('onboarding.summaryHeading')}</StepHeading>
      <Lead>{t('onboarding.summaryLead')}</Lead>
      <dl className={styles.summary}>
        {rows(t, props).map((row) => (
          <div key={row.label} className={styles.summaryRow}>
            <dt className={styles.summaryLabel}>{row.label}</dt>
            <dd className={styles.summaryValue}>{row.value}</dd>
            <dd className={styles.summaryChange}>
              <button
                type="button"
                className={styles.change}
                aria-label={t('onboarding.changeRow', {
                  row: row.label.toLocaleLowerCase(language),
                })}
                onClick={() => void props.wizard.jump(row.step)}
              >
                {t('onboarding.change')}
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <Note>{t('onboarding.summaryBar')}</Note>
    </>
  );
}
