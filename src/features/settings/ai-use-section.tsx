import { useEffect, useState } from 'react';
import type { AiLogEntry } from '../../domain/types.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';
import chartStyles from './ai-charts.module.css';
import {
  chartsStart,
  type DayUse,
  perDay,
  perTask,
  type TaskUse,
  type TokenUse,
  tokenUse,
} from './ai-charts.ts';
import { CallsByTask, CallsPerDay, CostPerDay, TokensChart } from './ai-charts.tsx';
import {
  type AiUseSummary,
  costByModel,
  type ModelUse,
  startOfMonth,
  summariseAiUse,
} from './ai-use.ts';
import { ConfirmRow } from './confirm-row.tsx';
import styles from './settings.module.css';

interface AiUse extends AiUseSummary {
  byModel: ModelUse[];
  days: DayUse[];
  tasks: TaskUse[];
  tokens: TokenUse;
}

/** This month's totals, and the last 30 days for the charts (A16). */
function aiUse(entries: readonly AiLogEntry[], at: number): AiUse {
  const month = entries.filter((e) => e.at >= startOfMonth(new Date(at)));
  const recent = entries.filter((e) => e.at >= chartsStart(at));
  return {
    ...summariseAiUse(month),
    byModel: costByModel(month),
    days: perDay(recent, at),
    tasks: perTask(recent),
    tokens: tokenUse(recent),
  };
}

function useAiUse(now: () => number) {
  const { repos } = useServices();
  const [use, setUse] = useState<AiUse>();
  useEffect(() => {
    const at = now();
    const from = Math.min(startOfMonth(new Date(at)), chartsStart(at));
    void repos.aiLog.since(from).then((rows) => setUse(aiUse(rows, at)));
  }, [repos, now]);
  return use;
}

/** The last 30 days as charts (A16). */
function Charts({ use }: { use: AiUse }) {
  return (
    <div className={chartStyles.charts}>
      <CallsPerDay days={use.days} />
      <CostPerDay days={use.days} />
      <CallsByTask rows={use.tasks} />
      <TokensChart use={use.tokens} />
    </div>
  );
}

/** Calls and estimated cost per model, priced at each call's date (A12). */
/** "3 calls · $4.00" in the learner's language. */
function useCallsCost(): (calls: number, costUsd: number) => string {
  const { t, format } = useI18n();
  return (calls, costUsd) =>
    t('settingsAi.callsCost', {
      calls: t('settingsAi.calls', { n: calls }),
      cost: format.cost(costUsd),
    });
}

function ByModel({ rows }: { rows: ModelUse[] }) {
  const t = useT();
  const callsCost = useCallsCost();
  if (rows.length === 0) return null;
  return (
    <dl className={styles.stats} aria-label={t('settingsAi.byModel')}>
      {rows.map((row) => (
        <div key={row.model} className={styles.stat}>
          <dt>{row.model}</dt>
          <dd>{callsCost(row.calls, row.costUsd)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Stats({ summary }: { summary: AiUseSummary }) {
  const { t, format } = useI18n();
  const count = (value: number) => format.number(value);
  const rows: [string, string][] = [
    [t('settingsAi.statCalls'), count(summary.calls)],
    [t('settingsAi.statCached'), count(summary.cached)],
    [t('settingsAi.statTokensIn'), count(summary.inputTokens)],
    [t('settingsAi.statTokensOut'), count(summary.outputTokens)],
    [t('settingsAi.statCachedTokens'), count(summary.cachedTokens)],
    [t('settingsAi.statCost'), format.cost(summary.costUsd)],
  ];
  if (summary.failed > 0) rows.splice(1, 0, [t('settingsAi.statFailed'), count(summary.failed)]);
  return (
    <dl className={styles.stats}>
      {rows.map(([term, value]) => (
        <div key={term} className={styles.stat}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type ClearStep = 'idle' | 'confirm' | 'done';

/** Clears the tutor's saved answers after one confirmation in place: they cost requests again. */
function ClearCache() {
  const { repos } = useServices();
  const [step, setStep] = useState<ClearStep>('idle');
  const t = useT();
  const clear = async () => {
    await repos.aiCache.clear();
    setStep('done');
  };
  if (step === 'confirm') {
    return (
      <ConfirmRow
        confirmLabel={t('settingsAi.clearCacheDo')}
        onConfirm={() => void clear()}
        onCancel={() => setStep('idle')}
      >
        {t('settingsAi.clearCacheConfirm')}
      </ConfirmRow>
    );
  }
  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => setStep('confirm')}
        disabled={step === 'done'}
      >
        {t('settingsAi.clearCache')}
      </button>
      {step === 'done' && (
        <p className={styles.status} role="status">
          {t('settingsAi.cacheCleared')}
        </p>
      )}
    </>
  );
}

/** Calls, cached answers, tokens and estimated cost this month (A9). */
export function AiUseSection({ now = Date.now }: { now?: () => number }) {
  const summary = useAiUse(now);
  const t = useT();
  const callsCost = useCallsCost();
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>
        <span className={styles.label}>{t('settingsAi.useTitle')}</span>
        <span className={styles.meta}>{summary && callsCost(summary.calls, summary.costUsd)}</span>
      </summary>
      <div className={styles.detailsBody}>
        {summary && <Stats summary={summary} />}
        {summary && <ByModel rows={summary.byModel} />}
        {summary && <Charts use={summary} />}
        <ClearCache />
        <p className={styles.hint}>{t('settingsAi.useHint')}</p>
      </div>
    </details>
  );
}
