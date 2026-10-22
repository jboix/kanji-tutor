/** This week's plan on Today (IA6): one line, and "Change" to the plan screen. */
import { Link } from 'react-router';
import { FOCUSABLE } from '../../domain/services/index.ts';
import type { SessionMix } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { FOCUS_LABEL } from './plan-copy.ts';
import styles from './today.module.css';
import { useWeek } from './use-week.ts';

/** "15 minutes a day · focus: long vowels". */
function useMixLine(): (mix: SessionMix) => string {
  const t = useT();
  return (mix) => {
    const line = t('today.planMinutes', { minutes: t('today.minutes', { n: mix.dailyMinutes }) });
    const focus = FOCUSABLE.flatMap((type) => {
      const key = FOCUS_LABEL[type];
      return key && (mix.focusErrorTypes[type] ?? 0) > 0 ? [t(key).toLowerCase()] : [];
    });
    return focus.length === 0 ? line : t('today.planFocus', { line, focus: focus.join(', ') });
  };
}

/** The plan in effect this week, or a line saying there is none; Change opens the editor. */
export function WeekPlanLine({ now }: { now: number }) {
  const t = useT();
  const week = useWeek(now);
  const mixLine = useMixLine();
  const saved = week?.saved?.status === 'accepted' ? week.saved : undefined;
  return (
    <section className={styles.planRow} aria-labelledby="plan-title">
      <div className={styles.planText}>
        <h2 id="plan-title" className={styles.planTitle}>
          {t('today.planTitle')}
        </h2>
        <span className={styles.small}>
          {saved ? mixLine(saved.mix) : week ? t('today.planNone') : ' '}
        </span>
      </div>
      <Link to={paths.plan} className={styles.change} aria-label={t('today.planChangeLabel')}>
        <span>{t('today.planChange')}</span>
      </Link>
    </section>
  );
}
