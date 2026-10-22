import { useState } from 'react';
import {
  clampMinutes,
  FOCUS_SHARE,
  FOCUSABLE,
  MAX_MINUTES,
  MIN_MINUTES,
  type WeekReport,
} from '../../domain/services/index.ts';
import type { ErrorType, PlanLine, SessionMix } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import styles from './plan.module.css';
import { FOCUS_LABEL, localPlanLines } from './plan-copy.ts';

/** A plan being shown, edited or saved. */
export interface PlanDraft {
  lines: PlanLine[];
  mix: SessionMix;
}

interface Draft extends PlanDraft {
  /** Lines the learner typed into; the others follow the minutes and focus. */
  edited: ReadonlySet<number>;
  /** Stable React keys: the lines never move, but their text changes as it is typed. */
  ids: string[];
}

function startDraft(t: Translate, plan: PlanDraft, report: WeekReport): Draft {
  const generated = localPlanLines(t, plan.mix, report);
  const edited = new Set(
    plan.lines.flatMap((line, i) => {
      const own = generated[i];
      return own?.when === line.when && own.what === line.what ? [] : [i];
    }),
  );
  const ids = plan.lines.map((_, i) => `line-${i}`);
  return { ...structuredClone(plan), edited, ids };
}

/** New mix: lines the learner did not type into are rewritten to match it. */
function withMix(t: Translate, draft: Draft, mix: SessionMix, report: WeekReport): Draft {
  const generated = localPlanLines(t, mix, report);
  const lines = draft.lines.map((line, i) => (draft.edited.has(i) ? line : (generated[i] ?? line)));
  return { ...draft, mix, lines };
}

function withLine(draft: Draft, index: number, patch: Partial<PlanLine>): Draft {
  const lines = draft.lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
  return { ...draft, lines, edited: new Set([...draft.edited, index]) };
}

function toggled(mix: SessionMix, type: ErrorType): SessionMix {
  const focusErrorTypes = { ...mix.focusErrorTypes };
  if ((focusErrorTypes[type] ?? 0) > 0) delete focusErrorTypes[type];
  else focusErrorTypes[type] = FOCUS_SHARE;
  return { ...mix, focusErrorTypes };
}

function LineFields({ line, index, onChange }: LineFieldsProps) {
  const t = useT();
  return (
    <div className={styles.editRow}>
      <input
        className={styles.whenInput}
        aria-label={t('plan.whenLine', { line: index + 1 })}
        value={line.when}
        onChange={(e) => onChange(index, { when: e.target.value })}
      />
      <input
        className={styles.whatInput}
        aria-label={t('plan.whatLine', { line: index + 1 })}
        value={line.what}
        onChange={(e) => onChange(index, { what: e.target.value })}
      />
    </div>
  );
}

interface LineFieldsProps {
  line: PlanLine;
  index: number;
  onChange: (index: number, patch: Partial<PlanLine>) => void;
}

function MinutesStepper({ minutes, onStep }: { minutes: number; onStep: (by: number) => void }) {
  const t = useT();
  return (
    <div className={styles.setting}>
      <span>{t('plan.dailyMinutes')}</span>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.step}
          aria-label={t('plan.fewerMinutes')}
          disabled={minutes <= MIN_MINUTES}
          onClick={() => onStep(-5)}
        >
          −
        </button>
        <output className={styles.minutes} aria-label={t('plan.dailyMinutes')}>
          {minutes}
        </output>
        <button
          type="button"
          className={styles.step}
          aria-label={t('plan.moreMinutes')}
          disabled={minutes >= MAX_MINUTES}
          onClick={() => onStep(5)}
        >
          +
        </button>
      </div>
    </div>
  );
}

function FocusToggles({ mix, onToggle }: { mix: SessionMix; onToggle: (t: ErrorType) => void }) {
  const t = useT();
  const label = (type: ErrorType) => {
    const key = FOCUS_LABEL[type];
    return key ? t(key) : type;
  };
  return (
    <fieldset className={styles.focus}>
      <legend className={styles.legend}>{t('plan.focusLegend')}</legend>
      {FOCUSABLE.map((type) => (
        <label key={type} className={styles.toggle}>
          <input
            type="checkbox"
            aria-label={label(type)}
            checked={(mix.focusErrorTypes[type] ?? 0) > 0}
            onChange={() => onToggle(type)}
          />
          <span aria-hidden="true">
            <JaRuns text={label(type)} />
          </span>
        </label>
      ))}
    </fieldset>
  );
}

interface PlanEditorProps {
  plan: PlanDraft;
  report: WeekReport;
  onSave: (plan: PlanDraft) => void;
  onCancel: () => void;
}

/** "Change it": each line editable, the daily minutes and the focus slips. */
export function PlanEditor({ plan, report, onSave, onCancel }: PlanEditorProps) {
  const t = useT();
  const [draft, setDraft] = useState(() => startDraft(t, plan, report));
  const step = (by: number) =>
    setDraft((d) =>
      withMix(t, d, { ...d.mix, dailyMinutes: clampMinutes(d.mix.dailyMinutes + by) }, report),
    );
  const toggle = (type: ErrorType) => setDraft((d) => withMix(t, d, toggled(d.mix, type), report));
  const change = (i: number, patch: Partial<PlanLine>) => setDraft((d) => withLine(d, i, patch));
  return (
    <div className={styles.editor}>
      {draft.lines.map((line, i) => (
        <LineFields key={draft.ids[i]} line={line} index={i} onChange={change} />
      ))}
      <MinutesStepper minutes={draft.mix.dailyMinutes} onStep={step} />
      <FocusToggles mix={draft.mix} onToggle={toggle} />
      <div className={styles.actions}>
        <PillButton grow={1} onClick={() => onSave({ lines: draft.lines, mix: draft.mix })}>
          {t('plan.usePlan')}
        </PillButton>
        <PillButton variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </PillButton>
      </div>
    </div>
  );
}
