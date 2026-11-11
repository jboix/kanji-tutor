/**
 * The review of pages just read, before anything is saved: the lesson they make (matched against
 * the dictionary and catalogue), its items described, and the learner's edits: the title, a
 * page's kind, a line checked or fixed, and what to keep of it. Save stores the lesson and its
 * lines.
 */
import { useCallback, useEffect, useState } from 'react';
import type { PageKind, ScannedLesson } from '../../domain/scan-types.ts';
import {
  type BuiltScan,
  buildScan,
  describeScanItems,
  emptyScan,
  keysOfKinds,
  learnerLevelOf,
  type PageDraft,
  type ScanItemView,
  saveScan,
  withKept,
  withPageKind,
} from '../../domain/services/index.ts';
import { type Services, useServices } from '../../ui/services.tsx';
import type { ReadPages } from './use-scan-import.ts';

/** A line that may be misread, by page and line index in the lesson. */
export interface CheckLine {
  page: number;
  line: number;
  text: string;
}

/** What the review screen shows and edits, for pages just read or a saved lesson. */
export interface ReviewModel {
  lesson: ScannedLesson;
  views: ScanItemView[] | undefined;
  title: string;
  setTitle: (title: string) => void;
  setKind: (page: number, kind: PageKind) => void;
  /** Lines to check; fixing one marks it checked. */
  check: CheckLine[];
  fixLine: (at: CheckLine, text: string) => Promise<void>;
  /** Keeps these items or questions (by key) in the lesson's practice, or leaves them out. */
  setKept: (keys: readonly string[], kept: boolean) => void;
}

/** The keys of the kinds not wanted (`ReadPages.skip`), among what the pages just read brought. */
function skipped(lesson: ScannedLesson, offset: number, skip: ReadPages['skip']): string[] {
  const items = lesson.items.filter((item) => item.page >= offset);
  const questions = lesson.questions.filter((question) => question.page >= offset);
  return keysOfKinds({ items, questions }, skip);
}

/** What the learner ticked or unticked in the review: key → kept. */
type Choices = Readonly<Record<string, boolean>>;

/** The lesson as built, with the learner's ticks over what starts kept or left out. */
function chosen(lesson: ScannedLesson, choices: Choices): ScannedLesson {
  const keys = (kept: boolean) => Object.keys(choices).filter((key) => choices[key] === kept);
  return withKept(withKept(lesson, keys(true), true), keys(false), false);
}

/** The ticks, kept apart from the built lesson: it is built again when a line or a kind changes. */
function useChoices() {
  const [choices, setChoices] = useState<Choices>({});
  const setKept = useCallback((keys: readonly string[], kept: boolean) => {
    setChoices((now) => ({ ...now, ...Object.fromEntries(keys.map((key) => [key, kept])) }));
  }, []);
  return { choices, setKept };
}

async function built(services: Services, base: ScannedLesson, pages: readonly PageDraft[]) {
  const level = learnerLevelOf(await services.repos.settings.get());
  const scan = await buildScan(services.repos, { base, pages, level });
  return { scan, views: await describeScanItems(services.repos, scan.lesson) };
}

/** The unverified lines of the pages just read (a saved lesson's are checked on its own page). */
function toCheck(lesson: ScannedLesson, offset: number): CheckLine[] {
  return lesson.pages
    .slice(offset)
    .flatMap((page, p) =>
      page.lines.flatMap((line, l) =>
        line.verified ? [] : [{ page: offset + p, line: l, text: line.text }],
      ),
    );
}

function fixed(drafts: PageDraft[], at: CheckLine, offset: number, line: PageDraft['lines'][0]) {
  return drafts.map((draft, p) =>
    p === at.page - offset
      ? { ...draft, lines: draft.lines.map((old, l) => (l === at.line ? line : old)) }
      : draft,
  );
}

function useBuilt(services: Services, read: ReadPages, now: number) {
  const [base, setBase] = useState(() => read.into ?? emptyScan({ id: crypto.randomUUID(), now }));
  const [drafts, setDrafts] = useState(read.pages);
  const [result, setResult] = useState<{ scan: BuiltScan; views: ScanItemView[] }>();
  useEffect(() => {
    let live = true;
    void built(services, base, drafts).then((next) => live && setResult(next));
    return () => {
      live = false;
    };
  }, [services, base, drafts]);
  const offset = base.pages.length;
  const setKind = (page: number, kind: PageKind) => {
    if (page < offset) setBase(withPageKind(base, page, kind));
    else setDrafts(drafts.map((d, i) => (i === page - offset ? { ...d, kind } : d)));
  };
  const fixLine = async (at: CheckLine, text: string) => {
    const line = { text, verified: true, tokens: await services.lang.tokenize(text) };
    setDrafts(fixed(drafts, at, offset, line));
  };
  return { offset, result, setKind, fixLine };
}

/** The review of `read` (see the module comment); undefined until the pages are matched. */
export function useDraftReview(read: ReadPages, now: number) {
  const services = useServices();
  const { offset, result, setKind, fixLine } = useBuilt(services, read, now);
  const [title, setTitle] = useState<string>();
  const { choices, setKept } = useChoices();
  const made =
    result && withKept(result.scan.lesson, skipped(result.scan.lesson, offset, read.skip), false);
  const lesson = made && chosen(made, choices);
  const name = title ?? lesson?.title ?? '';
  const save = useCallback(async () => {
    if (!(result && lesson)) return undefined;
    const scan = { ...result.scan, lesson: { ...lesson, title: name } };
    await saveScan(services.repos, scan, Date.now());
    return scan.lesson.id;
  }, [result, lesson, name, services.repos]);
  if (!(lesson && result)) return undefined;
  const check = toCheck(lesson, offset);
  const model: ReviewModel = {
    lesson,
    views: result.views,
    title: name,
    setTitle,
    setKind,
    check,
    fixLine,
    setKept,
  };
  return { model, save };
}
