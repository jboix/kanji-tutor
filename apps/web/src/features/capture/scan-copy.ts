/** Plain copy for the scanned lessons screens, in the learner's language: facts, never praise. */
import type { AiError } from '../../ai/types.ts';
import type { PageKind, QuestionType, ScannedLesson } from '../../domain/scan-types.ts';
import { type ScanChoiceKind, unsupportedCount } from '../../domain/services/index.ts';
import type { LearnedState } from '../../domain/services/learned.ts';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';

export const KIND_LABELS: Readonly<Record<PageKind, PlainKey>> = {
  'kanji-list': 'capture.kindKanjiList',
  'word-list': 'capture.kindWordList',
  grammar: 'capture.kindGrammar',
  reading: 'capture.kindReading',
  handout: 'capture.kindHandout',
  mixed: 'capture.kindMixed',
};

export const TYPE_LABELS: Readonly<Record<QuestionType, PlainKey>> = {
  'choose-form': 'capture.typeChooseForm',
  particle: 'capture.typeParticle',
  reading: 'capture.typeReading',
  'write-kanji': 'capture.typeWriteKanji',
  reorder: 'capture.typeReorder',
  free: 'capture.typeFree',
};

/** What a scan can make, as the new scan screen names it. */
export const MAKE_LABELS: Readonly<Record<ScanChoiceKind, PlainKey>> = {
  kanji: 'capture.partKanji',
  word: 'capture.partWords',
  grammar: 'capture.partGrammar',
  questions: 'capture.makeExercises',
};

export const STATE_LABELS: Readonly<Record<LearnedState, PlainKey>> = {
  known: 'capture.stateKnown',
  learning: 'capture.stateLearning',
  'not-started': 'capture.stateNew',
};

/**
 * "5 kanji, 5 words", "8 questions, 2 exercises can't be imported", or "6 lines" when nothing
 * was found on the page.
 */
export function foundOn(t: Translate, lesson: ScannedLesson, page: number): string {
  const on = lesson.items.filter((item) => item.page === page);
  const count = (kind: string) => on.filter((item) => item.kind === kind).length;
  const questions = lesson.questions.filter((q) => q.page === page).length;
  const cannot = unsupportedCount(lesson.pages[page] ?? {});
  const parts = [
    count('kanji') > 0 ? t('capture.foundKanji', { n: count('kanji') }) : '',
    count('word') > 0 ? t('capture.foundWords', { n: count('word') }) : '',
    count('grammar') > 0 ? t('capture.foundGrammar', { n: count('grammar') }) : '',
    questions > 0 ? t('capture.foundQuestions', { n: questions }) : '',
    cannot > 0 ? t('capture.foundCannot', { n: cannot }) : '',
  ].filter(Boolean);
  const lines = lesson.pages[page]?.lines.length ?? 0;
  return parts.length > 0 ? parts.join(', ') : t('capture.foundLines', { n: lines });
}

/** Why the pages could not be read. */
export type ReadProblem =
  | { kind: 'ai'; error: AiError }
  | { kind: 'no-text'; page: number }
  | { kind: 'crash'; detail: string };

function aiMessage(t: Translate, error: AiError): string {
  switch (error.kind) {
    case 'offline':
      return t('capture.photoOffline');
    case 'no-key':
      return t('capture.photoNoKey');
    case 'rate-limit':
      return t('capture.tooManyRequests');
    case 'invalid-response':
      return t('capture.photoInvalid');
    case 'provider':
      return t('capture.photoProvider', { detail: aiErrorText(t, error) });
  }
}

export function problemMessage(t: Translate, problem: ReadProblem): string {
  if (problem.kind === 'ai') return aiMessage(t, problem.error);
  if (problem.kind === 'no-text') return t('capture.noText', { n: problem.page });
  return t('capture.crashed', { detail: problem.detail });
}
