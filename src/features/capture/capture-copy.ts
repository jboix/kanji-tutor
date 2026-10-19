/** Plain copy for the capture screen, in the learner's language: facts, never praise or pressure. */
import type { AiError } from '../../ai/types.ts';
import type { ExerciseOutcome } from '../../domain/services/index.ts';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import type { Formats } from '../../ui/i18n/format.ts';
import type { Translate } from '../../ui/i18n/types.ts';
import type { StartState } from './use-capture-start.ts';

const DAY_MS = 86_400_000;

function startOfDay(at: number): number {
  const date = new Date(at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "today", "yesterday", "Thursday" within the week, else "12 October". */
export function capturedWhen(t: Translate, format: Formats, at: number, now: number): string {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days === 0) return t('capture.today');
  if (days === 1) return t('capture.yesterday');
  if (days > 1 && days < 7) return format.date(at, { weekday: 'long' });
  return format.date(at, { day: 'numeric', month: 'long' });
}

/** "Handout · photographed Thursday" or "Pasted text · added today". */
export function captureLine(
  t: Translate,
  format: Formats,
  capture: { createdAt: number; photo?: Blob },
  now: number,
): string {
  const when = capturedWhen(t, format, capture.createdAt, now);
  return capture.photo ? t('capture.photographed', { when }) : t('capture.pasted', { when });
}

export function percent(ratio: number): number {
  return Math.round(ratio * 100);
}

/** Why reading a photo did not work, and what still does. */
export function photoErrorMessage(t: Translate, error: AiError): string {
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

/** Why a line explanation did not load; the text and the words keep working. */
export function noteErrorMessage(t: Translate, kind: AiError['kind']): string {
  if (kind === 'offline') return t('capture.noteOffline');
  if (kind === 'no-key') return t('capture.noteNoKey');
  if (kind === 'rate-limit') return t('capture.tooManyRequests');
  return t('capture.noteFailed');
}

/** What "Turn into an exercise" did, said honestly (C4). */
export function exerciseMessage(t: Translate, outcome: ExerciseOutcome): string {
  if (outcome === 'next-session') return t('capture.exerciseNext');
  if (outcome === 'not-next') return t('capture.exerciseNotNext');
  if (outcome === 'all-known') return t('capture.exerciseAllKnown');
  return t('capture.exerciseTooNew');
}

/** "Added 5 words and 1 grammar point" (the screen adds " to <lesson>."), or undefined. */
export function addedLead(t: Translate, words: number, grammar: number): string | undefined {
  const w = words > 0 ? t('capture.words', { n: words }) : '';
  const g = grammar > 0 ? t('capture.grammarPoints', { n: grammar }) : '';
  if (w && g) return t('capture.addedBoth', { words: w, grammar: g });
  return w || g ? t('capture.addedOne', { what: w || g }) : undefined;
}

/** Progress or the reason a capture could not start. */
export function startMessage(t: Translate, state: Exclude<StartState, { status: 'idle' }>): string {
  if (state.status === 'busy') {
    return state.step === 'reading' ? t('capture.readingPage') : t('capture.savingWords');
  }
  const { problem } = state;
  if (problem.kind === 'ai') return photoErrorMessage(t, problem.error);
  if (problem.kind === 'no-text') return t('capture.noText');
  return t('capture.crashed', { detail: problem.detail });
}
