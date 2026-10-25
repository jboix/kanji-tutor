/**
 * What the tutor is about once a drill is answered, and the questions it suggests: the drill's
 * sentence, or the word, form or kanji it drills standing in for one (Tutor-drill).
 */
import { useMemo } from 'react';
import { blankedText, dialogueText } from '../../domain/dialogues/index.ts';
import type { DialogueDrill, Drill } from '../../domain/drills/index.ts';
import { GRAMMAR_CATALOGUE } from '../../domain/grammar/index.ts';
import { translationIn } from '../../domain/localized.ts';
import type { Sentence } from '../../domain/types.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import type { TutorTopic } from '../../ui/slots.tsx';
import { type TutorOptions, useTutor } from '../../ui/tutor.tsx';

/** A sentence as the tutor reads it, with its translation in the learner's language. */
export function sentenceTopic(sentence: Sentence, language: string): TutorTopic['sentence'] {
  const translation = translationIn(sentence, language).value;
  return translation ? { text: sentence.text, translation } : { text: sentence.text };
}

function grammarOf(id: string, pattern: string, meaning?: string) {
  const entry = GRAMMAR_CATALOGUE.find((e) => e.id === id);
  return { pattern: entry?.pattern ?? pattern, meaning: meaning ?? entry?.meaning ?? '' };
}

/**
 * A dialogue as the tutor reads it: each line after its speaker's name, with the translations.
 * Before the answer the blanked line keeps its blank and the point is not named, so asking the
 * tutor about the conversation does not give the answer away.
 */
export function dialogueTopic(d: DialogueDrill, language: string, answered: boolean): TutorTopic {
  const { dialogue } = d;
  const hidden = (i: number) => !answered && i === dialogue.blank.line;
  const text = dialogue.lines
    .map((line, i) => `${dialogue.speakers[line.by]}：${hidden(i) ? blankedText(line) : line.ja}`)
    .join('\n');
  const translation = dialogue.lines
    .map((line, i) => (hidden(i) ? '…' : dialogueText(line.tr, language).value))
    .join('\n');
  const sentence = { text, translation };
  if (!answered) return { about: dialogue.speakers.join('・'), sentence };
  const grammar = grammarOf(d.grammarId, d.answer);
  return { about: grammar.pattern, sentence, grammar };
}

/** A word, form or kanji standing in for a sentence. */
const bare = (text: string, about = text): TutorTopic => ({ about, sentence: { text } });

type Build = (drill: never, t: Translate, language: string) => TutorOptions;

const BUILDERS: {
  [K in Drill['kind']]: (d: Extract<Drill, { kind: K }>, t: Translate, l: string) => TutorOptions;
} = {
  lookalike: (d, t, l) => ({
    topic: { about: d.sentence.text, sentence: sentenceTopic(d.sentence, l), surface: d.answer },
    starters: [
      t('exercises.tutorLookalike', { a: d.choices[0]?.char ?? '', b: d.choices[1]?.char ?? '' }),
    ],
  }),
  cloze: (d, t, l) => {
    const grammar = grammarOf(
      d.grammarId,
      d.choices.find((c) => c.grammarId === d.grammarId)?.pattern ?? '',
      d.meaning,
    );
    return {
      topic: { about: grammar.pattern, sentence: sentenceTopic(d.sentence, l), grammar },
      starters: [t('exercises.tutorWhyHere', { x: grammar.pattern }), t('exercises.tutorExplain')],
    };
  },
  particle: (d, t, l) => ({
    topic: { about: d.answer, sentence: sentenceTopic(d.sentence, l), surface: d.answer },
    starters: [
      t('exercises.tutorWhyHere', { x: d.answer }),
      t('exercises.tutorOtherUses', { x: d.answer }),
    ],
  }),
  build: (d, t, l) => ({
    topic: { about: d.sentence.text, sentence: sentenceTopic(d.sentence, l) },
    starters: [t('exercises.tutorExplain'), t('exercises.tutorOrder')],
  }),
  listening: (d, t, l) => ({
    topic: { about: d.sentence.text, sentence: sentenceTopic(d.sentence, l) },
    starters: [t('exercises.tutorExplain')],
  }),
  meaning: (d, t) => ({
    topic: { ...bare(d.word.written), surface: d.word.written },
    starters: [
      t('exercises.tutorUseIt', { x: d.word.written }),
      t('exercises.tutorLike', { x: d.word.written }),
    ],
  }),
  pattern: (d, t) => ({
    topic: { ...bare(d.answer.written, d.shape), grammar: grammarOf(d.grammarId, d.shape) },
    starters: [t('exercises.tutorMade', { x: d.shape }), t('exercises.tutorCasual')],
  }),
  conjugation: (d, t) => ({
    topic: bare(d.answer.written),
    starters: [t('exercises.tutorFrom', { x: d.answer.written, cue: d.cue.written })],
  }),
  readings: (d, t) => ({
    topic: { ...bare(d.items.map((i) => i.form).join('、'), d.kanji), surface: d.kanji },
    starters: [t('exercises.tutorReadings', { x: d.kanji })],
  }),
  write: (d, t, l) => ({
    topic: {
      about: d.word.written,
      sentence: sentenceTopic(d.sentence, l),
      surface: d.word.written,
    },
    starters: [
      t('exercises.tutorRemember', { x: d.word.written }),
      t('exercises.tutorUseIt', { x: d.word.written }),
    ],
  }),
  'kanji-card': (d, t) => ({
    topic: { ...bare(d.kanji), surface: d.kanji },
    starters: [
      t(d.direction === 'write' ? 'exercises.tutorRemember' : 'exercises.tutorReadings', {
        x: d.kanji,
      }),
      t('exercises.tutorFamily', { x: d.kanji }),
    ],
  }),
  dialogue: (d, t, l) => ({
    topic: dialogueTopic(d, l, true),
    starters: [t('dialogues.tutorExplain'), t('dialogues.tutorWhy', { x: d.answer })],
  }),
  family: (d, t) => ({
    topic: { ...bare([...d.known, d.guess].join('、'), d.part), surface: d.part },
    starters: [t('exercises.tutorFamily', { x: d.part })],
  }),
};

/** The tutor for an answered drill. */
export function useDrillTutor(drill: Drill) {
  const { t, language } = useI18n();
  const options = useMemo(
    () => (BUILDERS[drill.kind] as Build)(drill as never, t, language),
    [drill, t, language],
  );
  return useTutor(options);
}
