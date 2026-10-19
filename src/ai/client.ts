import { lazyPeek, lazyTask } from './lazy-tasks.ts';
import type { AiClient, AiContext, Task, TaskInput, TaskName } from './types.ts';

/** Binds every task to a context resolved per call (settings may change between calls). */
export function createAiClient(getContext: () => Promise<AiContext>): AiClient {
  const bind = <T extends TaskName>(name: T) => {
    const task: Task<T> = lazyTask(name);
    return async (input: TaskInput<T>) => task(input, await getContext());
  };
  return {
    explainMistake: bind('explainMistake'),
    explainWord: bind('explainWord'),
    breakdownSentence: bind('breakdownSentence'),
    answerQuestion: bind('answerQuestion'),
    followUp: bind('followUp'),
    correctSentence: bind('correctSentence'),
    extractFromImage: bind('extractFromImage'),
    transcribeReading: bind('transcribeReading'),
    weeklyNotes: bind('weeklyNotes'),
    generateSentences: bind('generateSentences'),
    describeKanji: bind('describeKanji'),
    recognizeHandwriting: bind('recognizeHandwriting'),
    explainSentence: bind('explainSentence'),
    memoryHook: bind('memoryHook'),
    paraphraseQuestion: bind('paraphraseQuestion'),
    assessLevel: bind('assessLevel'),
    peek: async (name, input) => lazyPeek(name)(input, await getContext()),
  };
}
