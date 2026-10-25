/** Drills (R8): pure generators, the blanked sentence helper and the session mix rules. */
export { type BlankedSentence, blankText, KANJI_BLANK, PATTERN_BLANK } from './blank.ts';
export {
  type BuildInput,
  buildDrill,
  type ListeningInput,
  listeningDrill,
  piecesOf,
} from './build.ts';
export { type ClozeInput, clozeDrill, patternText } from './cloze.ts';
export { type DialogueInput, dialogueDrill } from './dialogue.ts';
export {
  type ExerciseAnswer,
  expectedOf,
  formMatches,
  gradeExercise,
} from './exercise-grade.ts';
export { type FamilyInput, familyDrill } from './family.ts';
export { CARD_CHOICES, type KanjiCardInput, kanjiCardDrill, typedReadings } from './kanji-card.ts';
export { type LessonClozeInput, lessonCloze } from './lesson-cloze.ts';
export { type LookalikeInput, type LookalikePair, lookalikeDrill } from './lookalike.ts';
export { type MeaningInput, meaningDrill, wordKind } from './meaning.ts';
export {
  DEFAULT_DRILL_SHARE,
  drillCount,
  drillKinds,
  interleave,
  MAX_DRILL_SHARE,
  type MistakeSignals,
} from './mix.ts';
export { BLANK_PARTICLES, type ParticleInput, particleDrill } from './particle.ts';
export {
  type ConjugationInput,
  type CueWord,
  conjugationDrill,
  type PatternInput,
  patternDrill,
} from './pattern.ts';
export { type ReadingsInput, readingsDrill } from './readings.ts';
export type * from './types.ts';
export { blankedWord, kanjiToDraw, WRITE_MAX_KANJI, type WriteInput, writeDrill } from './write.ts';
