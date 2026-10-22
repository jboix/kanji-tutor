import { useCallback, useState } from 'react';
import {
  addLessonWords,
  type ImportKnownOptions,
  type ImportKnownResult,
  importKnown,
  type JlptList,
  type LessonWordsResult,
} from '../domain/services/index.ts';
import type { Word } from '../domain/types.ts';
import { useServices } from './services.tsx';

/** What the pasted list is: words already known (K6) or new words from class (K1, K5). */
export type PastedAs = 'known' | 'new';

export interface ImportChoice {
  lists: JlptList[];
  /** Minna lessons 1 to n, or undefined when not chosen. */
  minnaUpTo: number | undefined;
  pasted: string;
  pastedAs: PastedAs;
  lesson: string;
}

/** What an import did: words marked known, new lesson words added, or both. */
export interface ImportSummary {
  known?: ImportKnownResult;
  lessonWords?: LessonWordsResult;
}

export type ImportPhase =
  | { phase: 'form' }
  | { phase: 'running'; done: number; total: number }
  | { phase: 'done'; result: ImportSummary }
  | { phase: 'failed' };

const hasPasted = (choice: ImportChoice) => choice.pasted.trim() !== '';

function optionsFor(choice: ImportChoice): Omit<ImportKnownOptions, 'now'> | undefined {
  const options: Omit<ImportKnownOptions, 'now'> = { lists: choice.lists };
  if (choice.minnaUpTo !== undefined) options.minnaUpTo = choice.minnaUpTo;
  if (hasPasted(choice) && choice.pastedAs === 'known') options.pasted = choice.pasted;
  if (choice.lesson.trim()) options.lesson = choice.lesson.trim();
  const empty = choice.lists.length === 0 && !options.minnaUpTo && !options.pasted;
  return empty ? undefined : options;
}

interface Run {
  choice: ImportChoice;
  lookup: (line: string) => Promise<Word[]>;
  onProgress: (done: number, total: number) => void;
}

async function runImport(repos: Parameters<typeof importKnown>[0], run: Run) {
  const { choice, lookup, onProgress } = run;
  const now = Date.now();
  const summary: ImportSummary = {};
  const known = optionsFor(choice);
  if (known) summary.known = await importKnown(repos, { ...known, now, lookup, onProgress });
  if (hasPasted(choice) && choice.pastedAs === 'new') {
    const lesson = choice.lesson.trim();
    const options = { pasted: choice.pasted, now, lookup };
    summary.lessonWords = await addLessonWords(repos, lesson ? { ...options, lesson } : options);
  }
  return summary;
}

/** Starts an import; resolves with what it did, or undefined when it failed. */
export type RunImport = (choice: ImportChoice) => Promise<ImportSummary | undefined>;

/**
 * Runs the known-words import (K6) with progress, and adds new lesson words (K1, K5). Shared by
 * the import page and the welcome wizard.
 */
export function useKnownImport(): [ImportPhase, RunImport, () => void] {
  const { repos, lang } = useServices();
  const [phase, setPhase] = useState<ImportPhase>({ phase: 'form' });
  const run: RunImport = useCallback(
    async (choice: ImportChoice) => {
      setPhase({ phase: 'running', done: 0, total: 0 });
      try {
        const result = await runImport(repos, {
          choice,
          lookup: (line) => lang.lookupWord(line),
          onProgress: (done, total) => setPhase({ phase: 'running', done, total }),
        });
        setPhase({ phase: 'done', result });
        return result;
      } catch {
        setPhase({ phase: 'failed' });
        return undefined;
      }
    },
    [repos, lang],
  );
  const reset = useCallback(() => setPhase({ phase: 'form' }), []);
  return [phase, run, reset];
}
