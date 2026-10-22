import type { OnboardingKnown } from '../../domain/types.ts';
import type { Translate } from '../../ui/i18n/types.ts';

/**
 * "11 words marked as known; 3 words were already known", then the lists the start implies:
 * "JLPT N5: marked as known when you start reading" (D38).
 */
export function knownText(t: Translate, known: OnboardingKnown | undefined): string {
  const marked = known?.marked;
  const pending = known?.pending ?? [];
  const parts: string[] = [];
  if (marked) {
    parts.push(t('onboarding.knownMarked', { n: marked.words }));
    if (marked.already > 0) parts.push(t('onboarding.knownAlready', { n: marked.already }));
    if (marked.missing > 0) parts.push(t('onboarding.knownMissing', { n: marked.missing }));
  }
  if (pending.length > 0) {
    const lists = pending.map((list) => list.toUpperCase()).join(', ');
    parts.push(t('onboarding.knownOnStart', { lists }));
  }
  return parts.length > 0 ? parts.join('; ') : t('onboarding.knownNothing');
}

/** "Marking 1,200 of 2,400". */
export function markingText(t: Translate, done: number, total: number): string {
  if (total === 0) return t('onboarding.finding');
  return t('onboarding.marking', { done, total });
}
