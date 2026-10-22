/** This week's plan in the learner's language (A7, IA6): counts, never praise. */
import { type PlanSpec, planSpecs, type WeekReport } from '../../domain/services/index.ts';
import type { ErrorType, PlanLine, SessionMix } from '../../domain/types.ts';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';

/** "Long vowels" etc., for the focus toggles. */
export const FOCUS_LABEL: Partial<Record<ErrorType, PlainKey>> = {
  'long-vowel': 'plan.focusLongVowel',
  sokuon: 'plan.focusSokuon',
  rendaku: 'plan.focusRendaku',
};

const FOCUS_PHRASE: Partial<Record<ErrorType, PlainKey>> = {
  'long-vowel': 'plan.phraseLongVowel',
  sokuon: 'plan.phraseSokuon',
  rendaku: 'plan.phraseRendaku',
};

function readingLine(t: Translate, minutes: number, focus: readonly ErrorType[]): string {
  const phrases = focus.flatMap((type) => {
    const phrase = FOCUS_PHRASE[type];
    return phrase ? [t('plan.planFocus', { phrase: t(phrase) })] : [];
  });
  return [t('plan.planReading', { minutes }), ...phrases].join(' ');
}

/** A plan line in the learner's language. */
export function planLine(t: Translate, spec: PlanSpec): PlanLine {
  if (spec.kind === 'reading') {
    return { when: t('plan.whenDaily'), what: readingLine(t, spec.minutes, spec.focus) };
  }
  if (spec.kind === 'drills') {
    return { when: t('plan.whenDaily'), what: t('plan.planDrills', { n: spec.cards }) };
  }
  const [first = '', second] = spec.patterns;
  return second === undefined
    ? { when: t('plan.whenTue'), what: t('plan.planGrammarOne', { first }) }
    : { when: t('plan.whenTueThu'), what: t('plan.planGrammarTwo', { first, second }) };
}

/** The plan lines of a mix, worded in the learner's language. */
export function localPlanLines(t: Translate, mix: SessionMix, report: WeekReport): PlanLine[] {
  return planSpecs(mix, report).map((spec) => planLine(t, spec));
}
