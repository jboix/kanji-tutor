import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { BACKUP_REMINDER_DAYS } from '../domain/defaults.ts';
import type { Settings } from '../domain/types.ts';
import styles from './backup-reminder.module.css';
import { Chip } from './chip.tsx';
import { useT } from './i18n/i18n.tsx';
import type { Translate } from './i18n/types.ts';
import { type Services, useServices } from './services.tsx';

const DAY_MS = 86_400_000;

/** "Later" hides the reminder for this many days (N5). */
export const BACKUP_SNOOZE_DAYS = 7;

/**
 * True when there is reading history worth saving and the last backup is at least
 * `BACKUP_REMINDER_DAYS` old, unless the user snoozed the reminder (N5). Without any backup the
 * first reminder comes once the oldest review is `FIRST_REMINDER_DAYS` old, so a new learner is
 * not asked on day one. `dataSince` is the time of the oldest review, if any.
 */
export function needsBackupReminder(
  settings: Settings,
  now: number,
  dataSince: number | undefined,
): boolean {
  if (dataSince === undefined || !settings.onboarded) return false;
  if ((settings.backupReminderSnoozedUntil ?? 0) > now) return false;
  if (settings.lastBackupAt === undefined) return now - dataSince >= FIRST_REMINDER_DAYS * DAY_MS;
  return now - settings.lastBackupAt >= BACKUP_REMINDER_DAYS * DAY_MS;
}

/** Days of reading history before the first backup reminder. */
const FIRST_REMINDER_DAYS = 7;

/** The reminder line: plain facts and a question, never pressure. */
export function backupReminderText(t: Translate, settings: Settings, now: number): string {
  if (settings.lastBackupAt === undefined) return t('ui.backupNone');
  const days = Math.floor((now - settings.lastBackupAt) / DAY_MS);
  return t('ui.backupAgo', { n: days });
}

function download(text: string, name: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  URL.revokeObjectURL(url);
}

/** `kanji-tutor-backup-YYYY-MM-DD.json`, in local time (B1). */
export function backupFileName(now: number): string {
  const day = new Date(now);
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
  return `kanji-tutor-backup-${date}.json`;
}

/** Downloads a backup file and records when (K7). Returns the updated settings. */
export async function exportBackupFile(
  services: Pick<Services, 'backup' | 'repos'>,
  now = Date.now(),
): Promise<Settings> {
  const json = await services.backup.exportJson();
  download(json, backupFileName(now));
  return services.repos.settings.patch({ lastBackupAt: now });
}

function useReminder(now: () => number) {
  const services = useServices();
  const { repos } = services;
  const [settings, setSettings] = useState<Settings>();
  const [dataSince, setDataSince] = useState<number>();
  useEffect(() => {
    void Promise.all([repos.settings.get(), repos.reviews.since(0)]).then(([value, reviews]) => {
      setSettings(value);
      setDataSince(
        reviews.length > 0 ? Math.min(...reviews.map((review) => review.at)) : undefined,
      );
    });
  }, [repos]);
  const exportNow = useCallback(
    async () => setSettings(await exportBackupFile(services, now())),
    [services, now],
  );
  const later = useCallback(async () => {
    const until = now() + BACKUP_SNOOZE_DAYS * DAY_MS;
    setSettings(await repos.settings.patch({ backupReminderSnoozedUntil: until }));
  }, [repos, now]);
  return { settings, dataSince, exportNow, later };
}

/** Whether the reminder is on screen, so the install banner can wait its turn (N1d). */
const shown = { value: false, listeners: new Set<() => void>() };

function setShown(value: boolean): void {
  if (shown.value === value) return;
  shown.value = value;
  for (const listener of shown.listeners) listener();
}

function subscribeShown(listener: () => void): () => void {
  shown.listeners.add(listener);
  return () => shown.listeners.delete(listener);
}

/** True while a backup reminder is showing: one quiet banner at a time (N1d). */
export function useBackupReminderShown(): boolean {
  return useSyncExternalStore(subscribeShown, () => shown.value);
}

/**
 * A quiet, dismissible line suggesting a backup when one is due (N5). Renders nothing otherwise.
 * "Export now" downloads the file directly; "Later" hides it for a week.
 */
export function BackupReminder({ now = Date.now }: { now?: () => number }) {
  const { settings, dataSince, exportNow, later } = useReminder(now);
  const t = useT();
  const due = settings !== undefined && needsBackupReminder(settings, now(), dataSince);
  // Before the paint, so the install banner hides in the same frame: never two banners at once.
  useLayoutEffect(() => {
    setShown(due);
    return () => setShown(false);
  }, [due]);
  if (!settings || !due) return null;
  return (
    <aside className={styles.reminder} aria-label={t('ui.backupLabel')}>
      <p className={styles.text}>{backupReminderText(t, settings, now())}</p>
      <div className={styles.actions}>
        <Chip onClick={exportNow}>{t('ui.backupExport')}</Chip>
        <Chip onClick={later}>{t('ui.backupLater')}</Chip>
      </div>
    </aside>
  );
}
