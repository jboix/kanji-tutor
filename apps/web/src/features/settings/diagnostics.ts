/**
 * Diagnostics for reporting a problem: this build and device, the settings (never the API key),
 * how much is stored, the tutor's recent requests with their timings and errors, and the app's
 * last errors. As text to paste into a message, or as a file that also holds the tutor's last
 * raw replies. Written in English for whoever reads the report; no photos.
 */
import { type RawReply, recentReplies } from '../../ai/index.ts';
import type { Repos } from '../../domain/repos.ts';
import type { AiLogEntry, Settings } from '../../domain/types.ts';
import { BUILD } from '../../ui/app-update.ts';
import { type LoggedError, recentErrors } from '../../ui/error-log.ts';

/** The requests shown: the last ones of the past week. */
const REQUESTS = 30;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface Diagnostics {
  at: number;
  build: typeof BUILD;
  device: { userAgent: string; installed: boolean; online: boolean; screen: string };
  settings: Omit<Settings, 'apiKey'> & { apiKey: 'set' | 'none' };
  stored: { items: number; scans: number; wildPhotos: number; notes: number };
  requests: AiLogEntry[];
  errors: LoggedError[];
}

function device(): Diagnostics['device'] {
  const installed = globalThis.matchMedia?.('(display-mode: standalone)').matches ?? false;
  return {
    userAgent: navigator.userAgent,
    installed,
    online: navigator.onLine,
    screen: `${globalThis.innerWidth}×${globalThis.innerHeight}`,
  };
}

async function stored(repos: Repos): Promise<Diagnostics['stored']> {
  const [items, scans, wildPhotos, notes] = await Promise.all([
    repos.items.count(),
    repos.scans.count(),
    repos.wildPhotos.count(),
    repos.notes.count(),
  ]);
  return { items, scans, wildPhotos, notes };
}

/** Everything the report holds, read now. */
export async function collectDiagnostics(repos: Repos, now = Date.now()): Promise<Diagnostics> {
  const { apiKey, ...settings } = await repos.settings.get();
  const requests = (await repos.aiLog.since(now - WEEK_MS)).slice(-REQUESTS);
  return {
    at: now,
    build: BUILD,
    device: device(),
    settings: { ...settings, apiKey: apiKey ? 'set' : 'none' },
    stored: await stored(repos),
    requests,
    errors: recentErrors(),
  };
}

const time = (at: number) => new Date(at).toISOString().replace('T', ' ').slice(0, 19);

function requestLine(entry: AiLogEntry): string {
  const took = entry.ms === undefined ? '' : ` ${(entry.ms / 1000).toFixed(1)} s`;
  const tokens = entry.cached ? ' cached' : ` ${entry.inputTokens}→${entry.outputTokens} tokens`;
  const outcome = entry.ok ? 'ok' : `failed${entry.error ? ` (${entry.error})` : ''}`;
  return `  ${time(entry.at)} ${entry.task} ${entry.model} ${outcome}${took}${tokens}`;
}

function errorLine(error: LoggedError): string {
  const stack = error.stack ? `\n${error.stack.replace(/^/gm, '      ')}` : '';
  return `  ${time(error.at)} [${error.where}] ${error.message}${stack}`;
}

function settingsLine(settings: Diagnostics['settings']): string {
  const teacher = settings.teacherModelId ?? 'default';
  const level = `N${settings.learnerLevel ?? 5}`;
  const packs = [settings.packVersion ?? 'none', ...(settings.packLanguages ?? [])].join(' + ');
  const tutor = `key ${settings.apiKey}, models ${settings.modelId} / ${teacher}`;
  return `Settings: ${settings.uiLanguage ?? 'en'}, ${level}, ${tutor}, dictionary ${packs}`;
}

/** The report as text to paste: the file's contents but the raw replies and the full settings. */
export function diagnosticsText(report: Diagnostics): string {
  const { build, device: on, stored: kept } = report;
  const requests = report.requests.map(requestLine);
  const errors = report.errors.map(errorLine);
  return [
    `Kanji Tutor diagnostics, ${time(report.at)} UTC`,
    `Version ${build.version} (${build.id}), built ${build.at || 'locally'}`,
    `Device: ${on.userAgent}; ${on.installed ? 'installed' : 'in the browser'}; ${on.online ? 'online' : 'offline'}; ${on.screen}`,
    settingsLine(report.settings),
    `Stored: ${kept.items} items, ${kept.scans} scanned lessons, ${kept.wildPhotos} photos, ${kept.notes} notes`,
    `Tutor requests (last ${requests.length}):`,
    ...(requests.length > 0 ? requests : ['  none']),
    `Errors (last ${errors.length}):`,
    ...(errors.length > 0 ? errors : ['  none']),
  ].join('\n');
}

/** The report as a file: everything, with the tutor's last raw replies. */
export function diagnosticsFile(report: Diagnostics): string {
  const replies: readonly RawReply[] = recentReplies();
  return JSON.stringify({ app: 'kanji-tutor-diagnostics', ...report, replies }, null, 2);
}

/** `kanji-tutor-diagnostics-YYYY-MM-DD-HHMM.json`, in UTC. */
export function diagnosticsFileName(now: number): string {
  const stamp = new Date(now).toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  return `kanji-tutor-diagnostics-${stamp}.json`;
}
