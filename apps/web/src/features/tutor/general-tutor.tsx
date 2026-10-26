import { useMemo } from 'react';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { HistoryIcon } from '../../ui/icons.tsx';
import { type LastConversation, loadLastConversation } from '../../ui/last-conversation.ts';
import type { TutorTopic } from '../../ui/slots.tsx';
import { type Tutor, useTutor } from '../../ui/tutor.tsx';
import styles from './tutor.module.css';

const DAY_MS = 86_400_000;

/** Calendar days from `at` to `now`, in local time: 0 today, 1 yesterday. */
function daysBetween(at: number, now: number): number {
  const midnight = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((midnight(now) - midnight(at)) / DAY_MS));
}

/** "today", "yesterday", "3 days ago". */
function whenLine(t: Translate, days: number): string {
  if (days === 0) return t('tutor.whenToday');
  return days === 1 ? t('tutor.whenYesterday') : t('tutor.whenAgo', { n: days });
}

/**
 * The tutor on a general topic: nothing on screen, any question about Japanese. Its suggested
 * questions wait inside the sheet, as on every other screen.
 */
export function useGeneralTutor(): Tutor | undefined {
  const t = useT();
  const topic = useMemo<TutorTopic>(
    () => ({ about: t('tutor.about'), sentence: { text: '' }, general: true }),
    [t],
  );
  const starters = [t('tutor.starterParticles'), t('tutor.starterSay'), t('tutor.starterQuiz')];
  return useTutor({ topic, starters });
}

/** The history button: reopens the last conversation, with no request. None before there is one. */
export function HistoryButton({ tutor }: { tutor: Tutor }) {
  const { t } = useI18n();
  // Read on each render, so a conversation just had shows once its sheet closes.
  const last: LastConversation | undefined = loadLastConversation();
  if (!last) return null;
  const when = whenLine(t, daysBetween(last.at, Date.now()));
  const label = t('tutor.history', { when });
  return (
    <button
      type="button"
      className={styles.history}
      aria-label={label}
      title={label}
      onClick={() => tutor.carryOn(last)}
    >
      <HistoryIcon />
    </button>
  );
}
