import { useId, useState } from 'react';
import { MODEL_CHOICES, PRICES, priceFor } from '../../ai/index.ts';
import { DEFAULT_TEACHER_MODEL_ID, teacherModelOf } from '../../domain/defaults.ts';
import type { Settings } from '../../domain/types.ts';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import type { Formats } from '../../ui/i18n/format.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
  now?: () => number;
}

/** The last day before an exclusive `until` date, e.g. "2027-01-01" → "2026-12-31". */
const lastDay = (until: string) =>
  new Date(Date.parse(until) - 86_400_000).toISOString().slice(0, 10);

/** "About $0.75 in and $3.75 out per million tokens", plus a dated change when one is ahead. */
export function priceHint(modelId: string, now: number, t: Translate, format: Formats): string {
  const price = priceFor(modelId, now);
  if (!price) return t('settings.priceUnknown');
  const usd = (value: number) => format.cost(value);
  const prices = { input: usd(price.input), output: usd(price.output) };
  const next = PRICES[modelId]?.find((period) => period.until && now < Date.parse(period.until));
  const later = next?.until ? priceFor(modelId, Date.parse(next.until)) : undefined;
  if (!next?.until || !later) return t('settings.price', prices);
  const date = lastDay(next.until);
  return t('settings.priceChange', {
    ...prices,
    date,
    nextInput: usd(later.input),
    nextOutput: usd(later.output),
  });
}

interface PickerProps {
  label: string;
  current: string;
  hint: string;
  now: number;
  onUse: (model: string) => Promise<void>;
}

function ModelPicker({ label, current, hint, now, onUse }: PickerProps) {
  const id = useId();
  const [draft, setDraft] = useState(current);
  const { t, format } = useI18n();
  const use = async (model: string) => {
    setDraft(model);
    await onUse(model);
  };
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          className={styles.input}
          value={draft}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="button"
          className={styles.button}
          disabled={!draft.trim() || draft.trim() === current}
          onClick={() => use(draft.trim())}
        >
          {t('settings.modelUse')}
        </button>
      </div>
      <ChipRow>
        {MODEL_CHOICES.map((model) => (
          <Chip key={model} aria-pressed={model === current} onClick={() => use(model)}>
            {model}
          </Chip>
        ))}
      </ChipRow>
      <p className={styles.hint}>
        {hint} {priceHint(current, now, t, format)}
      </p>
    </div>
  );
}

/** Fast and teacher models: a listed one or any other ID (N3, A12, D34). */
export function ModelSection({ settings, onPatch, now = Date.now }: Props) {
  const at = now();
  const { t } = useI18n();
  return (
    <section className={styles.section} aria-label={t('settings.models')}>
      <ModelPicker
        label={t('settings.fastModel')}
        current={settings.modelId}
        hint={t('settings.fastHint')}
        now={at}
        onUse={(model) => onPatch({ modelId: model })}
      />
      <ModelPicker
        label={t('settings.teacherModel')}
        current={teacherModelOf(settings)}
        hint={t('settings.teacherHint', { model: DEFAULT_TEACHER_MODEL_ID })}
        now={at}
        onUse={(model) => onPatch({ teacherModelId: model })}
      />
    </section>
  );
}
