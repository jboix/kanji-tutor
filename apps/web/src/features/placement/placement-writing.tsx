import { useId, useState } from 'react';
import type { LearnerLevel } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import styles from './placement.module.css';
import { WRITING_PROMPT } from './placement-copy.ts';

/** The optional written answer (A11), at the level the questions ended on. */
export function PlacementWriting(props: { level: LearnerLevel; onDone: (text: string) => void }) {
  const [text, setText] = useState('');
  const id = useId();
  const t = useT();
  return (
    <section className={styles.card} aria-label={t('placement.writingLabel')}>
      <label htmlFor={id} className={styles.prompt}>
        {t('placement.writingPrompt')}{' '}
        <span lang="ja" className={styles.ja}>
          {WRITING_PROMPT[props.level]}
        </span>
      </label>
      <textarea
        id={id}
        lang="ja"
        className={styles.writing}
        rows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <p className={styles.muted}>{t('placement.writingNote')}</p>
      <div className={styles.row}>
        <PillButton onClick={() => props.onDone(text)} disabled={text.trim() === ''}>
          {t('common.done')}
        </PillButton>
        <PillButton variant="secondary" onClick={() => props.onDone('')}>
          {t('common.skip')}
        </PillButton>
      </div>
    </section>
  );
}
