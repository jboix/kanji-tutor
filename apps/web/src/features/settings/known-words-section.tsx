import { Link } from 'react-router';
import { LEARNER_LEVELS, learnerLevelOf } from '../../domain/services/index.ts';
import type { LearnerLevel, Settings } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

const LEVELS = LEARNER_LEVELS.map((level) => ({ value: String(level), label: `N${level}` }));

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

/** The learner's level (P4) and the entry points to the import (K6) and progress (P3). */
export function KnownWordsSection({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <>
      <section className={styles.section} aria-label={t('settings.level')}>
        <span className={styles.label} aria-hidden="true">
          {t('settings.level')}
        </span>
        <SegmentedControl
          label={t('settings.level')}
          options={LEVELS}
          value={String(learnerLevelOf(settings))}
          onChange={(value) => onPatch({ learnerLevel: Number(value) as LearnerLevel })}
        />
        <p className={styles.hint}>{t('settings.levelHint')}</p>
        <Link to={paths.placement} className={styles.button}>
          {t('settings.findLevel')}
        </Link>
      </section>
      <section className={styles.section}>
        <h2 className={styles.label}>{t('settings.knownWords')}</h2>
        <p className={styles.hint}>{t('settings.knownHint')}</p>
        <Link to={paths.knownImport} className={styles.button}>
          {t('settings.markKnown')}
        </Link>
        <Link to={paths.learned} className={styles.button}>
          {t('settings.learned')}
        </Link>
      </section>
    </>
  );
}
