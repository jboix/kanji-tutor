/** Find my level (A11): the staircase, its questions, notes and the quiet re-estimate. */
export { type AreaNote, areaNotes } from './notes.ts';
export { type PlacementQuestion, placementQuestion, usedId } from './questions.ts';
export {
  answerStep,
  nextKind,
  PLACEMENT_KINDS,
  PLACEMENT_LENGTH,
  proposedLevel,
  type Staircase,
  staircaseDone,
  startStaircase,
} from './staircase.ts';
export { type LevelSuggestion, levelSuggestion } from './suggestion.ts';
