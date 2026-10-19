/** State of a capture review: ticks, lesson, explanations, adding items (C3, C4). */
import { useState } from 'react';
import type { Repos } from '../../domain/repos.ts';
import {
  addCaptureItems,
  type ExerciseOutcome,
  exerciseFromLine,
  grammarIdOf,
} from '../../domain/services/index.ts';
import { useServices } from '../../ui/services.tsx';
import {
  type GrammarCandidate,
  grammarCandidates,
  isGrammarPicked,
  isWordPicked,
  lineWordIds,
  type Picks,
} from './review-model.ts';
import type { CaptureData } from './use-capture-view.ts';
import { useLineNotes } from './use-line-notes.ts';

/** The first lesson tag the learner uses becomes the current lesson, so sessions pick it up. */
async function adoptLesson(repos: Repos, lesson: string) {
  const settings = await repos.settings.get();
  if (lesson && !settings.currentLesson) await repos.settings.patch({ currentLesson: lesson });
}

/** What "Add to …" saved, for the status line. */
export interface Added {
  words: number;
  grammar: number;
  lesson: string;
}

/** "Add to …": the ticked words and grammar points become this week's items (C3). */
async function addTicked(
  repos: Repos,
  data: CaptureData,
  ticks: Pick<ReturnType<typeof useTicks>, 'words' | 'pickedGrammar'>,
  lesson: string,
): Promise<Added> {
  const { created } = await addCaptureItems(repos, {
    capture: data.draft,
    words: ticks.words.map((word) => word.wordId),
    grammar: ticks.pickedGrammar.map((g) => ({ pattern: `〜${g.id}` })),
    lesson,
    now: Date.now(),
  });
  await adoptLesson(repos, lesson);
  const grammar = created.filter((id) => id.startsWith('grammar:')).length;
  return { words: created.length - grammar, grammar, lesson };
}

function useTicks(data: CaptureData, manual: readonly GrammarCandidate[], lesson: string) {
  const [picks, setPicks] = useState<Picks>(new Map());
  const lineNotes = useLineNotes(lesson);
  const grammar = grammarCandidates(lineNotes.notes, manual, data.trackedGrammar);
  const toggle = (key: string, value: boolean) => setPicks((p) => new Map(p).set(key, value));
  const words = data.analysis.words.filter((word) => isWordPicked(picks, word));
  const pickedGrammar = grammar.filter((g) => isGrammarPicked(picks, g));
  return { picks, toggle, grammar, words, pickedGrammar, ...lineNotes };
}

export function useReview(data: CaptureData, reload: () => Promise<void>) {
  const { repos } = useServices();
  const [lesson, setLesson] = useState(data.lesson);
  const [manual, setManual] = useState<GrammarCandidate[]>([]);
  const [added, setAdded] = useState<Added>();
  const [exercises, setExercises] = useState<ReadonlyMap<number, ExerciseOutcome>>(new Map());
  const ticks = useTicks(data, manual, lesson.trim());
  const tag = lesson.trim();

  const add = async () => {
    setAdded(await addTicked(repos, data, ticks, tag));
    await reload();
  };

  const exercise = async (line: number) => {
    const words = lineWordIds(data.analysis.lines[line], data.analysis.words);
    const input = { capture: data.draft, line, words, now: Date.now() };
    const outcome = await exerciseFromLine(repos, tag ? { ...input, lesson: tag } : input);
    setExercises((current) => new Map(current).set(line, outcome));
    await reload();
  };

  const addGrammar = (pattern: string) => {
    const id = grammarIdOf(pattern);
    if (id) setManual((current) => [...current.filter((g) => g.id !== id), { id, fromAi: false }]);
  };

  return { ...ticks, lesson, setLesson, tag, added, add, exercise, exercises, addGrammar };
}
