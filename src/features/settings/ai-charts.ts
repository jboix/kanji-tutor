/** The numbers behind the AI use charts (A16): per day, per task and per kind of token. */
import type { AiLogEntry } from '../../domain/types.ts';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { entryCost } from './ai-use.ts';

/** Days the per-day charts cover, today included. */
export const CHART_DAYS = 30;

export interface DayUse {
  /** Local midnight, epoch ms; the charts show it as "18 Oct" in the learner's language. */
  start: number;
  /** Requests that reached Gemini. */
  real: number;
  /** Answers served from the local cache. */
  cached: number;
  costUsd: number;
}

export interface TaskUse {
  task: string;
  real: number;
  cached: number;
}

export interface TokenUse {
  /** Input tokens Gemini read in full. */
  fresh: number;
  /** Input tokens Gemini served from its implicit cache. */
  cached: number;
  output: number;
}

function dayStart(at: number): number {
  const date = new Date(at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Local midnight `days - 1` days before today: where the charts start. */
export function chartsStart(now: number, days = CHART_DAYS): number {
  const today = new Date(dayStart(now));
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1)).getTime();
}

function emptyDays(now: number, days: number): DayUse[] {
  const first = new Date(chartsStart(now, days));
  return Array.from({ length: days }, (_, i) => {
    const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i).getTime();
    return { start, real: 0, cached: 0, costUsd: 0 };
  });
}

/** One row per day of the last `days` days, oldest first, empty days included. */
export function perDay(entries: readonly AiLogEntry[], now: number, days = CHART_DAYS): DayUse[] {
  const rows = emptyDays(now, days);
  const byStart = new Map(rows.map((row) => [row.start, row]));
  for (const entry of entries) {
    const row = byStart.get(dayStart(entry.at));
    if (!row) continue;
    if (entry.cached) row.cached += 1;
    else row.real += 1;
    row.costUsd += entryCost(entry);
  }
  return rows;
}

/** Plain names of the tasks, for the "calls by task" chart. */
const TASK_LABELS: Readonly<Record<string, PlainKey>> = {
  explainMistake: 'settingsAi.taskExplainMistake',
  explainWord: 'settingsAi.taskExplainWord',
  breakdownSentence: 'settingsAi.taskBreakdownSentence',
  answerQuestion: 'settingsAi.taskAnswerQuestion',
  followUp: 'settingsAi.taskFollowUp',
  correctSentence: 'settingsAi.taskCorrectSentence',
  extractFromImage: 'settingsAi.taskExtractFromImage',
  transcribeReading: 'settingsAi.taskTranscribeReading',
  weeklyNotes: 'settingsAi.taskWeeklyNotes',
  generateSentences: 'settingsAi.taskGenerateSentences',
  describeKanji: 'settingsAi.taskDescribeKanji',
  recognizeHandwriting: 'settingsAi.taskRecognizeHandwriting',
  explainSentence: 'settingsAi.taskExplainSentence',
  memoryHook: 'settingsAi.taskMemoryHook',
  paraphraseQuestion: 'settingsAi.taskParaphraseQuestion',
  assessLevel: 'settingsAi.taskAssessLevel',
};

/** The message key naming a task, if it has one; unknown tasks show their own name. */
export function taskLabelKey(task: string): PlainKey | undefined {
  return TASK_LABELS[task];
}

/** Calls per task, most first (ties by task name); tasks never used are left out. */
export function perTask(entries: readonly AiLogEntry[]): TaskUse[] {
  const byTask = new Map<string, TaskUse>();
  for (const entry of entries) {
    const row = byTask.get(entry.task) ?? { task: entry.task, real: 0, cached: 0 };
    if (entry.cached) row.cached += 1;
    else row.real += 1;
    byTask.set(entry.task, row);
  }
  const total = (row: TaskUse) => row.real + row.cached;
  return [...byTask.values()].sort((a, b) => total(b) - total(a) || a.task.localeCompare(b.task));
}

/** Input tokens read in full, input tokens from Gemini's cache, and output tokens. */
export function tokenUse(entries: readonly AiLogEntry[]): TokenUse {
  const use: TokenUse = { fresh: 0, cached: 0, output: 0 };
  for (const entry of entries) {
    if (entry.cached) continue;
    const cached = Math.min(entry.cachedTokens ?? 0, entry.inputTokens);
    use.fresh += entry.inputTokens - cached;
    use.cached += cached;
    use.output += entry.outputTokens;
  }
  return use;
}
