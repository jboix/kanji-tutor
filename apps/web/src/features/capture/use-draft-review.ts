/**
 * The review of pages just read, before anything is saved: the lesson they make (matched against
 * the dictionary and catalogue), its items described, and the learner's edits: the title, a
 * page's kind, a line checked or fixed. Save stores the lesson and its lines.
 */
import { useCallback, useEffect, useState } from 'react';
import type { PageKind, ScannedLesson } from '../../domain/scan-types.ts';
import {
  type BuiltScan,
  buildScan,
  describeScanItems,
  emptyScan,
  learnerLevelOf,
  type PageDraft,
  type ScanItemView,
  saveScan,
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
  const lesson = result?.scan.lesson;
  const name = title ?? lesson?.title ?? '';
  const save = useCallback(async () => {
    if (!result) return undefined;
    const scan = { ...result.scan, lesson: { ...result.scan.lesson, title: name } };
    await saveScan(services.repos, scan, Date.now());
    return scan.lesson.id;
  }, [result, name, services.repos]);
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
  };
  return { model, save };
}
