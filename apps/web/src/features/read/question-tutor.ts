/** What the tutor is about once a JLPT question or a 読解 question is answered (Tutor-drill). */
import { useMemo } from 'react';
import type {
  ChoiceQuestion,
  ComprehensionQuestion,
  ComprehensionSet,
  OrderQuestion,
} from '../../domain/questions/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { type TutorOptions, useTutor } from '../../ui/tutor.tsx';

type SessionQuestion = ChoiceQuestion | OrderQuestion;

function orderTutor(q: OrderQuestion, t: Translate): TutorOptions {
  const chunks = q.order.map((i) => q.options[i]?.text ?? '').join('');
  const text = `${q.before}${chunks}${q.after}`;
  const sentence = q.translation ? { text, translation: q.translation } : { text };
  return {
    topic: { about: text, sentence },
    starters: [t('exercises.tutorOrder'), t('exercises.tutorExplain')],
  };
}

function questionTutor(q: SessionQuestion, t: Translate): TutorOptions {
  if (q.kind === 'sentence-order') return orderTutor(q, t);
  const right = q.options[q.answer]?.text ?? q.stem.target;
  const text = `${q.stem.before}${q.stem.target}${q.stem.after}`;
  const sentence = q.translation ? { text, translation: q.translation } : { text };
  const reading = q.kind === 'kanji-reading';
  const first = reading
    ? t('exercises.tutorReadAs', { x: q.stem.target })
    : t('exercises.tutorWhyHere', { x: right });
  return {
    topic: { about: q.stem.target, sentence, surface: q.stem.target },
    starters: [first, t('exercises.tutorExplain')],
  };
}

/** The tutor for an answered JLPT question (J1–J5). */
export function useQuestionTutor(question: SessionQuestion) {
  const t = useT();
  return useTutor(useMemo(() => questionTutor(question, t), [question, t]));
}

function passageTutor(set: ComprehensionSet, q: ComprehensionQuestion, t: Translate): TutorOptions {
  const text = set.sentences.map((line) => line.ja).join('');
  const translation = set.sentences.map((line) => line.en).join(' ');
  return {
    topic: { about: q.question, sentence: { text, translation } },
    starters: [t('exercises.tutorLine', { n: q.evidence + 1 }), t('exercises.tutorQuestion')],
  };
}

/** The tutor for an answered 読解 question, about the passage (T6). */
export function usePassageTutor(set: ComprehensionSet, question: ComprehensionQuestion) {
  const t = useT();
  return useTutor(useMemo(() => passageTutor(set, question, t), [set, question, t]));
}
