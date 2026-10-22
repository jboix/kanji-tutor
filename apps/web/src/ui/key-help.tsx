import type { ReactNode } from 'react';
import { useI18n, useT } from './i18n/i18n.tsx';
import styles from './key-help.module.css';

const AI_STUDIO = 'https://aistudio.google.com/apikey';
const TERMS = 'https://ai.google.dev/gemini-api/terms';

function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
      {children}
    </a>
  );
}

function Steps() {
  const { t, rich } = useI18n();
  const link = <External href={AI_STUDIO}>aistudio.google.com/apikey</External>;
  return (
    <ol className={styles.steps}>
      <li>{rich('ui.keyOpen', { link })}</li>
      <li>{t('ui.keySignIn')}</li>
      <li>{t('ui.keyTerms')}</li>
      <li>{t('ui.keyCreate')}</li>
      <li>{t('ui.keyPaste')}</li>
    </ol>
  );
}

function GoodToKnow() {
  const { t, rich } = useI18n();
  const link = <External href={TERMS}>{t('ui.keyTermsLink')}</External>;
  return (
    <ul className={styles.notes}>
      <li>{rich('ui.keyFreeTier', { link })}</li>
      <li>{t('ui.keyStays')}</li>
      <li>{t('ui.keyRestrict')}</li>
      <li>{t('ui.keyLeaks')}</li>
    </ul>
  );
}

/** How to get a Gemini key (P6): why, the AI Studio steps and what to know about it. */
export function KeyHelp() {
  const t = useT();
  return (
    <div className={styles.help}>
      <p className={styles.why}>
        <strong>{t('ui.keyWhyTitle')}</strong> {t('ui.keyWhy')}
      </p>
      <Steps />
      <p className={styles.label}>{t('ui.keyGoodToKnow')}</p>
      <GoodToKnow />
    </div>
  );
}

/** The same help, folded under "How to get a key" (Settings, next to the key field). */
export function KeyHelpDisclosure() {
  const t = useT();
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>{t('ui.keyHowTo')}</summary>
      <KeyHelp />
    </details>
  );
}
