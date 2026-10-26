import { useMemo } from 'react';
import { AiAction, AiAskInput } from '../../ui/ai-action.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { ChevronIcon } from '../../ui/icons.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { type LastConversation, loadLastConversation } from '../../ui/last-conversation.ts';
import type { TutorTopic } from '../../ui/slots.tsx';
import { type Tutor, TutorCardHeading, useTutor } from '../../ui/tutor.tsx';
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

/** "Carry on · yesterday" over the last question: reopens that conversation, with no request. */
function CarryOn({ last, tutor }: { last: LastConversation; tutor: Tutor }) {
  const { t } = useI18n();
  const when = whenLine(t, daysBetween(last.at, Date.now()));
  return (
    <button type="button" className={styles.carry} onClick={() => tutor.carryOn(last)}>
      <span className={styles.carryText}>
        <span className={styles.carryWhen}>{t('tutor.carryOn', { when })}</span>
        <span className={styles.carryQuestion}>
          <JaRuns text={last.turns.at(-1)?.question ?? last.topic.about} />
        </span>
      </span>
      <span className={styles.chevron} aria-hidden="true">
        <ChevronIcon />
      </span>
    </button>
  );
}

/** The general topic: nothing on screen, any question about Japanese. */
function useGeneralTutor(): Tutor | undefined {
  const t = useT();
  const topic = useMemo<TutorTopic>(
    () => ({ about: t('tutor.about'), sentence: { text: '' }, general: true }),
    [t],
  );
  const starters = [t('tutor.starterParticles'), t('tutor.starterSay'), t('tutor.starterQuiz')];
  return useTutor({ topic, starters });
}

function Starters({ tutor }: { tutor: Tutor }) {
  return (
    <div className={styles.starters}>
      {tutor.starters.map((question) => (
        <AiAction
          key={question}
          label={question}
          content={<JaRuns text={question} />}
          run={(client) => tutor.open({ client, question })}
        />
      ))}
    </div>
  );
}

/**
 * "Ask the tutor": a question field, suggested questions and the last conversation to carry on.
 * Every question opens the tutor's conversation sheet on a general topic.
 */
export function AskCard() {
  const t = useT();
  const tutor = useGeneralTutor();
  if (!tutor) return null;
  // Read on each render, so a conversation just had shows once its sheet closes.
  const last = loadLastConversation();
  return (
    <section className={styles.ask} aria-labelledby="tutor-ask">
      <TutorCardHeading id="tutor-ask" title={t('tutor.askTitle')} />
      <AiAskInput
        label={t('tutor.askLabel')}
        placeholder={t('tutor.askPlaceholder')}
        onAsk={(client, question) => tutor.open({ client, question })}
        dictateLabel={t('tutor.askByVoice')}
      />
      <Starters tutor={tutor} />
      {last && <CarryOn last={last} tutor={tutor} />}
      {tutor.sheet}
    </section>
  );
}
