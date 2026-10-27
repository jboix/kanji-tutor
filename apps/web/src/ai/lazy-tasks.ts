/**
 * The tasks under their public names, loading `tasks.ts` (Zod, prompts, schemas) on first call so
 * none of it lands in the app shell (N4). Same signatures as the tasks themselves.
 */
import type { Peek, PeekableTask, Task, TaskName } from './types.ts';

type TaskTable = { [T in TaskName]: PeekableTask<T> };

let loaded: Promise<TaskTable> | undefined;

function loadTasks(): Promise<TaskTable> {
  if (!loaded) loaded = import('./tasks.ts');
  return loaded;
}

/** A task that loads its implementation on first call. */
export function lazyTask<T extends TaskName>(name: T): Task<T> {
  return async (input, context) => {
    const tasks = await loadTasks();
    const task = tasks[name] as Task<T>;
    return task(input, context);
  };
}

/** The cache-only lookup of a task, loading `tasks.ts` on first call. */
export function lazyPeek<T extends TaskName>(name: T): Peek<T> {
  return async (input, context) => {
    const tasks = await loadTasks();
    const task = tasks[name] as PeekableTask<T>;
    return task.peek(input, context);
  };
}

export const explainMistake = lazyTask('explainMistake');
export const explainWord = lazyTask('explainWord');
export const breakdownSentence = lazyTask('breakdownSentence');
export const answerQuestion = lazyTask('answerQuestion');
export const followUp = lazyTask('followUp');
export const correctSentence = lazyTask('correctSentence');
export const analysePage = lazyTask('analysePage');
export const transcribeReading = lazyTask('transcribeReading');
export const weeklyNotes = lazyTask('weeklyNotes');
export const generateSentences = lazyTask('generateSentences');
export const describeKanji = lazyTask('describeKanji');
export const recognizeHandwriting = lazyTask('recognizeHandwriting');
export const explainSentence = lazyTask('explainSentence');
export const memoryHook = lazyTask('memoryHook');
export const kanjiStory = lazyTask('kanjiStory');
export const paraphraseQuestion = lazyTask('paraphraseQuestion');
export const assessLevel = lazyTask('assessLevel');
