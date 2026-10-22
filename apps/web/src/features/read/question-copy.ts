/** Question copy (J7): the instruction per kind and each option's note, in the learner's language. */
import type { NoteCode, OptionNote, QuestionKind } from '../../domain/questions/index.ts';
import type { MessageKey, PlainKey, Translate } from '../../ui/i18n/types.ts';

/** The instruction under the section name. */
export const PROMPT_KEY: Readonly<Record<QuestionKind, PlainKey>> = {
  'kanji-reading': 'questions.promptKanjiReading',
  orthography: 'questions.promptOrthography',
  'context-word': 'questions.promptContextWord',
  'grammar-form': 'questions.promptGrammarForm',
  'sentence-order': 'questions.promptSentenceOrder',
  comprehension: 'questions.promptComprehension',
};

const NOTE_KEY: Readonly<Record<NoteCode, MessageKey>> = {
  'long-vowel-dropped': 'questions.noteLongVowelDropped',
  'long-vowel-added': 'questions.noteLongVowelAdded',
  'sokuon-added': 'questions.noteSokuonAdded',
  'sokuon-turned': 'questions.noteSokuonTurned',
  'sokuon-dropped': 'questions.noteSokuonDropped',
  voiced: 'questions.noteVoiced',
  unvoiced: 'questions.noteUnvoiced',
  'other-reading': 'questions.noteOtherReading',
  'read-as': 'questions.noteReadAs',
  'swap-parts': 'questions.noteSwapParts',
  'swap-needs': 'questions.noteSwapNeeds',
  'another-word': 'questions.noteAnotherWord',
  spelling: 'questions.noteSpelling',
  'word-misfits': 'questions.noteWordMisfits',
  'word-fits': 'questions.noteWordFits',
  'form-misfits': 'questions.noteFormMisfits',
  'form-fits': 'questions.noteFormFits',
  'order-star': 'questions.noteOrderStar',
  'order-slot': 'questions.noteOrderSlot',
  'line-not': 'questions.noteLineNot',
};

type LooseTranslate = (
  key: MessageKey,
  params: Readonly<Record<string, string | number>>,
) => string;

/** A note as prose: written notes as they are, coded ones through the catalogue. */
export function noteText(t: Translate, note: OptionNote): string {
  if (typeof note === 'string') return note;
  const key =
    note.code === 'read-as' && !note.params.gloss
      ? 'questions.noteReadAsPlain'
      : NOTE_KEY[note.code];
  return (t as unknown as LooseTranslate)(key, note.params);
}
