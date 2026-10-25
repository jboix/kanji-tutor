/**
 * A saved scanned lesson, from storage only, so it opens offline. A capture converted into a
 * lesson is matched the first time it opens. Its title, a page's kind and a misread line are
 * edited in place.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Repos } from '../../domain/repos.ts';
import type { PageKind, ScannedLesson } from '../../domain/scan-types.ts';
import {
  describeScanItems,
  learnerLevelOf,
  rematchScan,
  renameScan,
  type ScanItemView,
  withPageKind,
} from '../../domain/services/index.ts';
import type { Lang } from '../../lang/types.ts';
import { useServices } from '../../ui/services.tsx';
import type { CheckLine, ReviewModel } from './use-draft-review.ts';

interface Loaded {
  lesson: ScannedLesson;
  views: ScanItemView[];
}

export type SavedState = { status: 'loading' } | { status: 'missing' } | { status: 'ready' };

async function matched(repos: Repos, lesson: ScannedLesson): Promise<ScannedLesson> {
  if (!lesson.unmatched) return lesson;
  const level = learnerLevelOf(await repos.settings.get());
  const next = await rematchScan(repos, lesson, level);
  await repos.scans.put(next);
  return next;
}

async function load(repos: Repos, id: string): Promise<Loaded | undefined> {
  const stored = await repos.scans.get(id);
  if (!stored) return undefined;
  const lesson = await matched(repos, stored);
  return { lesson, views: await describeScanItems(repos, lesson) };
}

/** The lesson with one line fixed and checked, its sentence retokenized, its items matched. */
async function withLine(
  repos: Repos,
  lang: Lang,
  lesson: ScannedLesson,
  at: CheckLine,
  text: string,
) {
  const line = lesson.pages[at.page]?.lines[at.line];
  if (!line) return lesson;
  const sentence = await repos.sentences.get(line.sentenceId);
  const tokens = await lang.tokenize(text);
  if (sentence) await repos.sentences.put({ ...sentence, text, tokens, verified: true });
  const pages = lesson.pages.map((page, p) =>
    p !== at.page
      ? page
      : {
          ...page,
          lines: page.lines.map((l, i) => (i === at.line ? { ...l, text, verified: true } : l)),
        },
  );
  const level = learnerLevelOf(await repos.settings.get());
  return rematchScan(repos, { ...lesson, pages }, level);
}

const unchecked = (lesson: ScannedLesson): CheckLine[] =>
  lesson.pages.flatMap((page, p) =>
    page.lines.flatMap((line, l) => (line.verified ? [] : [{ page: p, line: l, text: line.text }])),
  );

function useLoaded(id: string) {
  const { repos } = useServices();
  const [state, setState] = useState<SavedState>({ status: 'loading' });
  const [data, setData] = useState<Loaded>();
  useEffect(() => {
    let live = true;
    void load(repos, id).then((loaded) => {
      if (!live) return;
      setData(loaded);
      setState({ status: loaded ? 'ready' : 'missing' });
    });
    return () => {
      live = false;
    };
  }, [repos, id]);
  const store = useCallback(
    async (lesson: ScannedLesson) => {
      await repos.scans.put(lesson);
      setData({ lesson, views: await describeScanItems(repos, lesson) });
    },
    [repos],
  );
  return { state, data, store };
}

/** The saved lesson `id` as a review model, once loaded. */
export function useSavedScan(id: string) {
  const { repos, lang } = useServices();
  const { state, data, store } = useLoaded(id);
  const [title, setTitle] = useState<string>();
  if (!data) return { state, model: undefined, commitTitle: () => undefined };
  const { lesson } = data;
  const model: ReviewModel = {
    lesson,
    views: data.views,
    title: title ?? lesson.title,
    setTitle,
    setKind: (page: number, kind: PageKind) =>
      void store({ ...withPageKind(lesson, page, kind), updatedAt: Date.now() }),
    check: unchecked(lesson),
    fixLine: async (at, text) => store(await withLine(repos, lang, lesson, at, text)),
  };
  const commitTitle = () => {
    if (title === undefined) return;
    void renameScan(repos, lesson.id, title, Date.now()).then((next) => {
      if (next) void store(next);
      setTitle(undefined);
    });
  };
  return { state, model, commitTitle };
}
