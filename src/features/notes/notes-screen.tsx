import { useState } from 'react';
import type { WeekReport } from '../../domain/services/index.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { KeptNotes } from './kept-notes.tsx';
import { LetterDivider, LetterView } from './letter-view.tsx';
import styles from './notes.module.css';
import { rangeLine } from './notes-copy.ts';
import { useLetter } from './use-letter.ts';
import { useReport } from './use-report.ts';

function WeekBody({ report }: { report: WeekReport }) {
  const { letter, ask, peek } = useLetter(report);
  const { format } = useI18n();
  return (
    <>
      <p className={styles.range}>{rangeLine(format, report.start, report.end)}</p>
      <LetterView letter={letter} onAsk={ask} peek={peek} />
      <LetterDivider letter={letter} />
    </>
  );
}

/**
 * Weekly notes (notes.html, A7, A13), under Learn (IA4, IA6): a plain letter on this week from
 * the real review stats (the tutor writes it only when asked) and the explanations kept in
 * notes. This week's plan is on Today.
 */
export function NotesScreen({ now: fixed }: { now?: number }) {
  const [now] = useState(() => fixed ?? Date.now());
  const report = useReport(now);
  const t = useT();
  const back = <BackButton parent={paths.learn} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('notes.thisWeek')} />}>
      {report === undefined ? (
        <p className={styles.why}>{t('notes.counting')}</p>
      ) : (
        <WeekBody report={report} />
      )}
      <KeptNotes />
    </Screen>
  );
}
