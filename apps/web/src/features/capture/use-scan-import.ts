/**
 * The import screen's state: the pages picked (photos or pasted text), where they go (a new
 * scanned lesson or an existing one), what to practise from them, and reading them, one request
 * per photo (A18).
 */
import { useEffect, useState } from 'react';
import type { AiClient } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import {
  type PageDraft,
  SCAN_CHOICE_KINDS,
  type ScanChoiceKind,
} from '../../domain/services/index.ts';
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
  /** The kinds not to practise from these pages: found and listed all the same, left out. */
  skip: readonly ScanChoiceKind[];
}

/** What to practise from the pages: every kind until one is unticked. */
function useMaking() {
  const [make, setMake] = useState<readonly ScanChoiceKind[]>(SCAN_CHOICE_KINDS);
  const toggleMake = (kind: ScanChoiceKind) =>
    setMake((now) => (now.includes(kind) ? now.filter((k) => k !== kind) : [...now, kind]));
  const skip = SCAN_CHOICE_KINDS.filter((kind) => !make.includes(kind));
  return { make, toggleMake, skip };
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
  const { make, toggleMake, skip } = useMaking();
  const add = (more: readonly ImportPage[]) => setPages((now) => [...now, ...more]);
  const remove = (id: string) => setPages((now) => now.filter((page) => page.id !== id));
  const read = (client?: AiClient) => {
    const onPage = (page: number, total: number) => setState({ status: 'reading', page, total });
    const tokenize = (text: string) => lang.tokenize(text);
    void readPages({ client, tokenize, pages, onPage })
      .then((result) => {
        if (!result.ok) return setState({ status: 'error', problem: result.problem });
        setState({ status: 'idle' });
        const to = lessons.find((lesson) => lesson.id === target);
        onRead({ pages: result.pages, into: to, skip });
      })
      .catch((error: unknown) => setState(crash(error)));
  };
  return { pages, add, remove, target, setTarget, lessons, state, read, make, toggleMake };
}
