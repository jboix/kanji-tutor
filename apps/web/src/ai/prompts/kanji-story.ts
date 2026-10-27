import type { Prompt } from '../task-def.ts';
import type { KanjiStoryInput } from '../types.ts';
import { joinLines, READINGS_RULE, TUTOR } from './shared.ts';

function partsLine(kanji: KanjiStoryInput['kanji']): string {
  const parts = kanji.parts.map((p) => (p.meaning ? `${p.char} ${p.meaning}` : p.char));
  return parts.length > 0 ? `Parts: ${parts.join(' + ')}` : 'Parts: none, a single shape';
}

/** A kanji's story (the kanji page): a picture from its parts, and a short story to read. */
export const kanjiStoryPrompt: Prompt<KanjiStoryInput> = {
  version: 1,
  system: joinLines(
    TUTOR,
    'Help the learner remember one kanji. In "line", write one or two short sentences that build a',
    'picture from its parts to its meaning, as a way to remember it, not as its history: say',
    'nothing about where the kanji really comes from. You may add one everyday word with it.',
    'In "story", write one or two short, natural Japanese sentences that use the kanji, and no',
    'other kanji than the ones the learner reads (write the rest in kana), with a translation.',
    'When the take is above 0, write a different picture and a different story from before.',
    READINGS_RULE,
  ),
  build: (input) =>
    joinLines(
      `Kanji: ${input.kanji.char}`,
      `Meaning: ${input.kanji.meanings.slice(0, 3).join(', ')}`,
      partsLine(input.kanji),
      `Kanji the learner reads: ${input.knownKanji.join('')}`,
      `Take: ${input.take}`,
    ),
};
