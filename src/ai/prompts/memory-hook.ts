import type { Prompt } from '../task-def.ts';
import type { MemoryHookInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, sentenceLines, TUTOR } from './shared.ts';

function kanjiLine(kanji: MemoryHookInput['kanji'][number]): string {
  const parts = kanji.parts.map((p) => (p.meaning ? `${p.char} ${p.meaning}` : p.char));
  return `${kanji.char}: ${kanji.meanings.slice(0, 3).join(', ')}${parts.length > 0 ? ` (parts: ${parts.join(' + ')})` : ''}`;
}

/** L1, A5: a memory hook for a word the learner meets for the first time. */
export const memoryHookPrompt: Prompt<MemoryHookInput> = {
  version: 2,
  system: joinLines(
    TUTOR,
    'The learner meets this word for the first time. Write one memory hook of one or two',
    'sentences that ties its meaning and reading to its kanji parts, or to a word the learner',
    'already reads that shares a kanji or a sound. Prefer words they know; check with your tools.',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      `Target: ${input.word.surface}`,
      `Reading: ${input.word.reading}`,
      `Meaning: ${input.word.meaning}`,
      input.kanji.map(kanjiLine),
      input.sentence ? sentenceLines(input.sentence) : undefined,
      profileLines(profile),
    ),
};
