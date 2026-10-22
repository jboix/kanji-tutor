/** The names of a unit lesson's sections (S3) in the learner's language, beside their 言葉 titles. */
import type { LessonSection } from '../domain/types.ts';
import type { PlainKey } from './i18n/types.ts';

export const SECTION_NAME: Readonly<Record<LessonSection, PlainKey>> = {
  words: 'units.stepWords',
  grammar: 'units.stepGrammar',
  practice: 'units.stepPractice',
  reading: 'units.stepReading',
  review: 'units.stepReview',
};
