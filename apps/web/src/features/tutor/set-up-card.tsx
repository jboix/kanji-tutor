import { useState } from 'react';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { KeyHelp } from '../../ui/key-help.tsx';
import { paths } from '../../ui/paths.ts';
import { PillLink } from '../../ui/pill-button.tsx';
import { TutorCardHeading } from '../../ui/tutor.tsx';
import styles from './tutor.module.css';

/** "Where do I get a key?": the welcome's key help, in a sheet. */
function WhereKey() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={styles.whereKey} onClick={() => setOpen(true)}>
        {t('tutor.whereKey')}
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t('tutor.keySheet')}
        header={<h2 className={styles.sheetTitle}>{t('tutor.keySheet')}</h2>}
      >
        <KeyHelp />
      </BottomSheet>
    </>
  );
}

/** In place of "Ask the tutor" while no key is set: one step to set the tutor up. */
export function SetUpCard() {
  const t = useT();
  return (
    <section className={styles.setUp} aria-labelledby="tutor-set-up">
      <TutorCardHeading
        id="tutor-set-up"
        title={t('tutor.setUpTitle')}
        line={t('tutor.setUpLine')}
        unset
      />
      <p className={styles.setUpBody}>{t('tutor.setUpBody')}</p>
      <PillLink to={paths.settingsSection('tutor')} block>
        {t('tutor.setUp')}
      </PillLink>
      <WhereKey />
    </section>
  );
}
