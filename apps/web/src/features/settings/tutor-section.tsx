import type { Settings, TutorMode } from '../../domain/types.ts';
import { AiPressSeal } from '../../ui/ai-action.tsx';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

const MODES = [
  { value: 'on-ask', label: 'settings.tutorOnAsk' },
  { value: 'auto-mistakes', label: 'settings.tutorAuto' },
] as const satisfies readonly { value: TutorMode; label: PlainKey }[];

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

/**
 * When the tutor runs (A13): only from "Ask the tutor" buttons (the default), or also once under
 * every wrong answer. Skips are never explained automatically. One line explains the mark on
 * every press that sends a request, and on text the tutor wrote (A18).
 */
export function TutorSection({ settings, onPatch }: Props) {
  const { t, rich } = useI18n();
  return (
    <section className={styles.section} aria-label={t('settings.tutor')}>
      <span className={styles.label} aria-hidden="true">
        {t('settings.tutor')}
      </span>
      <fieldset className={styles.choices}>
        <legend className="visually-hidden">{t('settings.tutor')}</legend>
        {MODES.map((mode) => (
          <label key={mode.value} className={styles.choice}>
            <input
              type="radio"
              name="tutor"
              value={mode.value}
              checked={(settings.tutor ?? 'on-ask') === mode.value}
              onChange={() => void onPatch({ tutor: mode.value })}
            />
            {t(mode.label)}
          </label>
        ))}
      </fieldset>
      <p className={styles.hint}>{t('settings.tutorHint')}</p>
      <p className={styles.hint}>{rich('settings.tutorMark', { seal: <AiPressSeal /> })}</p>
    </section>
  );
}
