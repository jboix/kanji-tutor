import type { Formats } from '../../ui/i18n/format.ts';
import type { Translate } from '../../ui/i18n/types.ts';

/** "840 KB", "12.4 MB", "2.1 GB": one decimal above a megabyte, in the learner's language. */
export function formatBytes(bytes: number, t: Translate, format: Formats): string {
  const mb = bytes / 1_000_000;
  const one = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (mb < 1) return t('settings.sizeKb', { size: Math.max(1, Math.round(bytes / 1000)) });
  if (mb < 1000) return t('settings.sizeMb', { size: one(mb) });
  return t('settings.sizeGb', { size: one(mb / 1000) });
}

/** The usage line, or undefined when the browser gives no estimate. */
export function usageText(
  estimate: { usage?: number; quota?: number },
  t: Translate,
  format: Formats,
): string | undefined {
  if (estimate.usage === undefined) return undefined;
  const used = formatBytes(estimate.usage, t, format);
  if (!estimate.quota) return t('settings.storageUsed', { used });
  return t('settings.storageUsedOf', { used, quota: formatBytes(estimate.quota, t, format) });
}
