/**
 * Scanned lessons in storage: keys, the conversion of older captures, and saving a lesson with
 * its lines as sentences. A scanned lesson is practised on its own: nothing in it enters the
 * daily sessions until the learner practises it, and then only through the FSRS reviews.
 */
import { isoWeek } from '../ids.ts';
import type { Repos } from '../repos.ts';
import type {
  HandoutQuestion,
  LegacyCapture,
  ScanItem,
  ScannedLesson,
  ScanPage,
} from '../scan-types.ts';
import type { Sentence } from '../types.ts';

/** Id of a scanned line's sentence: stable, so saving twice overwrites. */
export function scanSentenceId(lessonId: string, page: number, line: number): string {
  return `capture:${lessonId}:${page}.${line}`;
}

/** The key of an item in a lesson's progress: `kanji:晴`, `word:<JMdict id>`, `grammar:<id>`. */
export function scanItemKey(item: Pick<ScanItem, 'kind' | 'ref' | 'text'>): string {
  return `${item.kind}:${item.ref ?? item.text}`;
}

/** The key of a handout question in a lesson's progress. */
export function questionKey(question: Pick<HandoutQuestion, 'id'>): string {
  return `question:${question.id}`;
}

/** Longest title made from a line, in characters. */
const TITLE_CHARS = 20;

/** A title from the first line, cut to {@link TITLE_CHARS} characters. */
export function titleFromLines(lines: readonly string[]): string {
  const first = [...(lines[0] ?? '').replace(/[。．.、,]+$/u, '')];
  return first.length > TITLE_CHARS ? `${first.slice(0, TITLE_CHARS).join('')}…` : first.join('');
}

/**
 * A capture from before scanned lessons as a scanned lesson of one page (nothing lost): its
 * photo, lines and sentences, lesson tag and added items. Its items are matched when it is
 * first opened (`unmatched`).
 */
export function scanFromCapture(capture: LegacyCapture): ScannedLesson {
  const lines = capture.lines.map((text, i) => ({
    text,
    verified: true,
    sentenceId: capture.sentenceIds[i] ?? `capture:${capture.id}:${i}`,
  }));
  const page: ScanPage = { kind: 'mixed', lines };
  if (capture.photo) page.photo = capture.photo;
  const lesson: ScannedLesson = {
    id: capture.id,
    createdAt: capture.createdAt,
    updatedAt: capture.createdAt,
    title: titleFromLines(capture.lines),
    suggestedTitle: '',
    week: capture.week,
    pages: [page],
    items: [],
    questions: [],
    practised: {},
    unmatched: true,
  };
  if (capture.lesson) lesson.lesson = capture.lesson;
  if (capture.addedItemIds.length > 0) lesson.addedItemIds = [...capture.addedItemIds];
  return lesson;
}

/** What a new lesson starts from: an id, the time and the class lesson tag. */
export interface NewScan {
  id: string;
  now: number;
  lesson?: string | undefined;
}

/** An empty scanned lesson, to which pages are added. */
export function emptyScan({ id, now, lesson }: NewScan): ScannedLesson {
  const scan: ScannedLesson = {
    id,
    createdAt: now,
    updatedAt: now,
    title: '',
    suggestedTitle: '',
    week: isoWeek(new Date(now)),
    pages: [],
    items: [],
    questions: [],
    practised: {},
  };
  if (lesson) scan.lesson = lesson;
  return scan;
}

/** A lesson with its line sentences, as `buildScan` makes it and `saveScan` stores it. */
export interface BuiltScan {
  lesson: ScannedLesson;
  sentences: Sentence[];
}

/** Stores the lesson and its lines' sentences; an empty title falls back to the suggestion. */
export async function saveScan(repos: Repos, built: BuiltScan, now: number): Promise<void> {
  const { lesson } = built;
  const title = lesson.title.trim() || lesson.suggestedTitle || titleFromLines(firstLines(lesson));
  await repos.sentences.putMany(built.sentences);
  await repos.scans.put({ ...lesson, title, updatedAt: now });
}

function firstLines(lesson: ScannedLesson): string[] {
  return lesson.pages.flatMap((page) => page.lines.map((line) => line.text));
}

/** Renames a saved lesson; an empty name keeps the current one. */
export async function renameScan(repos: Repos, id: string, title: string, now: number) {
  const lesson = await repos.scans.get(id);
  const name = title.trim();
  if (!lesson || !name || name === lesson.title) return lesson;
  const renamed = { ...lesson, title: name, updatedAt: now };
  await repos.scans.put(renamed);
  return renamed;
}

/** The lesson with one page's kind changed. */
export function withPageKind(lesson: ScannedLesson, page: number, kind: ScanPage['kind']) {
  const pages = lesson.pages.map((p, i) => (i === page ? { ...p, kind } : p));
  return { ...lesson, pages };
}
