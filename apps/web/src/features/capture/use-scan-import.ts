/**
 * The import screen's state: the pages picked (photos or pasted text), where they go (a new
 * scanned lesson or an existing one), and reading them, one request per photo (A18).
 */
import { useEffect, useState } from 'react';
import type { AiClient } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import type { PageDraft } from '../../domain/services/index.ts';
import { useServices } from '../../ui/services.tsx';
import { type ImportPage, readPages } from './read-pages.ts';
import type { ReadProblem } from './scan-copy.ts';

export type ReadState =
  | { status: 'idle' }
  | { status: 'reading'; page: number; total: number }
  | { status: 'error'; problem: ReadProblem };

/** What the import hands to the review: the pages as read, and the lesson they go into. */
export interface ReadPages {
  pages: PageDraft[];
  /** The existing lesson they are added to; a new one when absent. */
  into?: ScannedLesson | undefined;
}

/** Lessons offered under "Add to", newest first. */
const ADD_TO = 3;

/** The newest lessons, and the one pages are added to when it is older. */
async function lessonsFor(repos: Repos, into: string | undefined) {
  const recent = await repos.scans.recent(ADD_TO);
  if (!into || recent.some((lesson) => lesson.id === into)) return recent;
  const lesson = await repos.scans.get(into);
  return lesson ? [lesson, ...recent] : recent;
}

function useRecentLessons(into: string | undefined): ScannedLesson[] {
  const { repos } = useServices();
  const [recent, setRecent] = useState<ScannedLesson[]>([]);
  useEffect(() => {
    let live = true;
    void lessonsFor(repos, into).then((rows) => live && setRecent(rows));
    return () => {
      live = false;
    };
  }, [repos, into]);
  return recent;
}

function crash(error: unknown): ReadState {
  const detail = error instanceof Error ? error.message : String(error);
  return { status: 'error', problem: { kind: 'crash', detail } };
}

/** The pages and their reading; `into` is the lesson id pages are added to by default. */
export function useScanImport(onRead: (read: ReadPages) => void, into?: string) {
  const { lang } = useServices();
  const [pages, setPages] = useState<ImportPage[]>([]);
  const [target, setTarget] = useState<string | undefined>(into);
  const [state, setState] = useState<ReadState>({ status: 'idle' });
  const lessons = useRecentLessons(into);
  const add = (more: readonly ImportPage[]) => setPages((now) => [...now, ...more]);
  const remove = (id: string) => setPages((now) => now.filter((page) => page.id !== id));
  const read = (client?: AiClient) => {
    const onPage = (page: number, total: number) => setState({ status: 'reading', page, total });
    const tokenize = (text: string) => lang.tokenize(text);
    void readPages({ client, tokenize, pages, onPage })
      .then((result) => {
        if (!result.ok) return setState({ status: 'error', problem: result.problem });
        setState({ status: 'idle' });
        onRead({ pages: result.pages, into: lessons.find((lesson) => lesson.id === target) });
      })
      .catch((error: unknown) => setState(crash(error)));
  };
  return { pages, add, remove, target, setTarget, lessons, state, read };
}
