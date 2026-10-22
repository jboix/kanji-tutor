import { browserLanguages, resolveLanguage } from './language.ts';
import type { Settings } from './types.ts';

/** Fast default model; the user can change it in Settings. */
export const DEFAULT_MODEL_ID = 'gemini-3.5-flash-lite';

/** Teacher default model; a separate setting, e.g. for `gemini-3.8-flash`. */
export const DEFAULT_TEACHER_MODEL_ID = 'gemini-3.5-flash-lite';

/** The earlier fast default; stored settings still holding it move to the new default. */
const RETIRED_DEFAULT_MODEL_ID = 'gemini-2.5-flash-lite';

/** Settings used until the user changes something. */
export const DEFAULT_SETTINGS: Settings = {
  modelId: DEFAULT_MODEL_ID,
  furigana: 'new',
  theme: 'system',
  onboarded: false,
};

/** Days between backup reminders (N5). */
export const BACKUP_REMINDER_DAYS = 30;

/** Upgrades stored settings: the retired default model becomes the new one; choices are kept. */
export function migrateSettings(settings: Settings): Settings {
  if (settings.modelId !== RETIRED_DEFAULT_MODEL_ID) return settings;
  return { ...settings, modelId: DEFAULT_MODEL_ID };
}

/** The teacher model in use (A12). */
export function teacherModelOf(settings: Pick<Settings, 'teacherModelId'>): string {
  return settings.teacherModelId?.trim() || DEFAULT_TEACHER_MODEL_ID;
}

/**
 * The language the tutor writes its prose in (N10): the interface's, resolved the same way
 * (the stored choice, else the browser's when offered, else English).
 */
export function explanationLanguageOf(
  settings: Pick<Settings, 'uiLanguage'>,
  browser: readonly string[] = browserLanguages(),
): string {
  return resolveLanguage(settings.uiLanguage, browser);
}
