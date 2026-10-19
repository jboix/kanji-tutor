/** The conjugation engine (S4): verb and adjective forms, and the pattern drills built on them. */
export {
  type AdjectiveForm,
  type Conjugation,
  classOf,
  conjugateAdjective,
  conjugateVerb,
  FORM_LEVEL,
  formsAt,
  isVerbClass,
  type VerbForm,
} from './forms.ts';
export {
  applyPattern,
  type Cue,
  PATTERN_RULES,
  type PatternAnswer,
  type PatternRule,
  type PatternTakes,
  patternRule,
  takesCue,
} from './patterns.ts';
