import { useState } from 'react';
import { acceptPlan } from '../../domain/services/index.ts';
import type { PlanLine } from '../../domain/types.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { useServices } from '../../ui/services.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './plan.module.css';
import { localPlanLines } from './plan-copy.ts';
import { type PlanDraft, PlanEditor } from './plan-editor.tsx';
import { useWeek, type WeekData } from './use-week.ts';

function PlanRows({ lines }: { lines: readonly PlanLine[] }) {
  return (
    <ul className={styles.rows}>
      {lines.map((line) => (
        <li key={`${line.when}|${line.what}`} className={styles.row}>
          <span className={styles.when}>{line.when}</span>
          <span className={styles.what}>
            <JaRuns text={line.what} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function usePlan(data: WeekData, now: number) {
  const { repos } = useServices();
  const t = useT();
  const { mix } = data.proposal;
  const start = data.saved ?? { mix, lines: localPlanLines(t, mix, data.report) };
  const [plan, setPlan] = useState<PlanDraft>({ lines: start.lines, mix: start.mix });
  const [accepted, setAccepted] = useState(data.saved?.status === 'accepted');
  const [editing, setEditing] = useState(false);
  const save = async (next: PlanDraft) => {
    await acceptPlan(repos, { now, letter: data.saved?.letter ?? [], thisWeek: true, ...next });
    setPlan(next);
    setAccepted(true);
    setEditing(false);
  };
  return { plan, accepted, editing, setEditing, save };
}

function PlanBody({ data, now }: { data: WeekData; now: number }) {
  const t = useT();
  const { plan, accepted, editing, setEditing, save } = usePlan(data, now);
  if (editing) {
    const cancel = () => setEditing(false);
    const onSave = (next: PlanDraft) => void save(next);
    return <PlanEditor plan={plan} report={data.report} onSave={onSave} onCancel={cancel} />;
  }
  return (
    <>
      <PlanRows lines={plan.lines} />
      <div className={styles.actions}>
        {accepted ? (
          <p className={styles.confirm} role="status">
            {t('plan.followed')}
          </p>
        ) : (
          <PillButton grow={1} onClick={() => void save(plan)}>
            {t('plan.usePlan')}
          </PillButton>
        )}
        <PillButton variant="secondary" onClick={() => setEditing(true)}>
          {t('plan.changeIt')}
        </PillButton>
      </div>
    </>
  );
}

/**
 * This week's plan (A7, IA6), opened from Today's "Change": proposed from the week's real
 * mistakes, followed by sessions from the moment it is saved. Back returns to Today.
 */
export function PlanScreen({ now: fixed }: { now?: number }) {
  const [now] = useState(() => fixed ?? Date.now());
  const data = useWeek(now);
  const t = useT();
  const back = <BackButton parent={paths.today} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('plan.title')} />}>
      <section className={styles.plan}>
        <p className={styles.lead}>{t('plan.lead')}</p>
        {data && <PlanBody data={data} now={now} />}
      </section>
    </Screen>
  );
}
