/** Orchestration over the `Repos` port shared by Today, Read, Kanji and Import. */

export {
  type AiSentenceDeps,
  aiSentenceId,
  type DraftReading,
  type DraftSentence,
  knownWordSample,
  saveAiSentences,
} from './ai-sentences.ts';
export { type RecordAnswerInput, recordAnswer } from './answer.ts';
export {
  type AcceptCompositionInput,
  type AcceptCompositionResult,
  type AcceptedCorrection,
  acceptComposition,
  usedLevel,
} from './compose.ts';
export { confusedKanji } from './confusables.ts';
export {
  type DrillAnswerInput,
  type DrillChoiceInput,
  isExercise,
  recordDrillAnswer,
  recordDrillChoice,
  recordDrillReading,
  recordFamilyGuess,
} from './drill-answer.ts';
export { drillCard, mistakeSignals } from './drills.ts';
export {
  type AddGrammarInput,
  addGrammarPoint,
  type ComposeTarget,
  composeTarget,
  grammarIdFor,
  isGrammarUsed,
  lessonGrammar,
  nextComposeTarget,
} from './grammar.ts';
export { introduceGrammar } from './grammar-intro.ts';
export {
  type HiddenTargetReadings,
  hiddenNow,
  hiddenTargets,
} from './hidden-targets.ts';
export {
  type ImportKnownOptions,
  type ImportKnownResult,
  importKnown,
  type JlptList,
} from './import-known.ts';
export { type EnsureItemOptions, ensureItem } from './items.ts';
export {
  applyCandidate,
  type KanjiCandidate,
  kanjiCandidates,
} from './kanji-candidates.ts';
export {
  type FamilyMember,
  type KanjiDetail,
  kanjiDetail,
  type ReadingRow,
  readingLabel,
  recentKanji,
} from './kanji-detail.ts';
export { type KanjiPart, type KanjiWithParts, kanjiIn, kanjiWithParts } from './kanji-parts.ts';
export { type StoryMaterial, storyMaterial } from './kanji-story.ts';
export { type KanjiWall, kanjiWall, type WallTile, wallAround } from './kanji-wall.ts';
export { type LastTime, lastTime } from './last-time.ts';
export {
  type LearnedEntry,
  type LearnedGroup,
  type LearnedKind,
  type LearnedLevel,
  type LearnedState,
  learnedGroups,
} from './learned.ts';
export {
  LEARNER_LEVELS,
  learnerLevelOf,
} from './learner-level.ts';
export { createLearnerView, learnerCoverage } from './learner-profile.ts';
export {
  COMES_BACK,
  coverageOf,
  currentSection,
  type ExerciseType,
  LESSON_SECTIONS,
  type LessonSection,
  nextPart,
  PART_SECONDS,
  SECTION_TITLES,
  type SectionProgress,
  sectionDone,
} from './lesson-sections.ts';
export {
  addLessonWords,
  type LessonWordsOptions,
  type LessonWordsResult,
} from './lesson-words.ts';
export { ungroundedClaims } from './letter-check.ts';
export {
  type KnownCount,
  type LevelProgress,
  type LevelUp,
  levelProgress,
  levelUpSuggestion,
  moveUpLevel,
  snoozeLevelUp,
} from './level-up.ts';
export { type MetFirst, type MetFirstInput, metFirst } from './met-first.ts';
export { POINT_DRILLS, type PointOptions, pointPractice } from './point-practice.ts';
export { sharedReads } from './read-cache.ts';
export { answerSpan } from './reading-check.ts';
export {
  gradeHandout,
  markScanPractised,
  recordScanDrill,
  recordScanIntro,
  recordScanQuestion,
  recordScanReading,
  type ScanAnswerBase,
} from './scan-answer.ts';
export {
  buildScan,
  type LineDraft,
  type PageDraft,
  type QuestionDraft,
  rematchScan,
  type ScanBuildInput,
} from './scan-build.ts';
export {
  type ListedItem,
  type ListedItems,
  matchPattern,
  matchScanItems,
  NOTHING_LISTED,
} from './scan-match.ts';
export {
  buildScanPractice,
  SCAN_PRACTICE_CARDS,
  type ScanCard,
  type ScanPracticeOptions,
} from './scan-practice.ts';
export {
  type ScanPart,
  type ScanProgress,
  scanPracticeMinutes,
  scanProgress,
  withPractised,
} from './scan-progress.ts';
export { countScanCard, prepareScanCard, scanSessionCards } from './scan-session.ts';
export { describeScanItems, kanjiReadings, type ScanItemView } from './scan-view.ts';
export {
  type BuiltScan,
  deleteScan,
  emptyScan,
  type NewScan,
  questionKey,
  renameScan,
  saveScan,
  scanFromCapture,
  scanItemKey,
  scanSentenceId,
  titleFromLines,
  withPageKind,
} from './scans.ts';
export { type SeasonWordView, seasonWord } from './season-word.ts';
export { type BuildSessionOptions, buildSession, type SessionFocus } from './session.ts';
export { DEFAULT_SESSION_MINUTES } from './session-length.ts';
export { cardType } from './session-mix.ts';
export {
  type OutlineKind,
  type SessionOutline,
  sessionOutline,
  sessionSeconds,
} from './session-outline.ts';
export {
  choosePractice,
  learningReading,
  type NextLesson,
  nextLesson,
  resolveStart,
  type StartInput,
  type StartPlan,
  startPlan,
} from './start-plan.ts';
export {
  type ClassProgress,
  type Count,
  type TodayOverview,
  type TodaySession,
  type TodaySummary,
  type TrainerNote,
  todayOverview,
  todaySession,
  todaySummary,
} from './summary.ts';
export { unitCast, unitEpisode } from './unit-cast.ts';
export {
  type LevelUnits,
  lastPractised,
  levelUnits,
  type Practised,
  unitPractised,
} from './unit-progress.ts';
export {
  finishLessonPart,
  lessonNext,
  markUnitDone,
  markUnitRead,
  startLessonSection,
  startUnit,
  type UnitCounts,
  type UnitPath,
  type UnitState,
  type UnitStep,
  type UnitView,
  unitPath,
  unitView,
} from './units.ts';
export {
  type AcceptPlanInput,
  acceptPlan,
  clampMinutes,
  currentMix,
  DEFAULT_MINUTES,
  FOCUS_SHARE,
  FOCUSABLE,
  MAX_MINUTES,
  MIN_MINUTES,
  nextWeekPlan,
  PLAN_MAX_DRILL_SHARE,
  type PlanSpec,
  type ProposedPlan,
  planLines,
  planSpecs,
  proposePlan,
  thisWeekPlan,
} from './week-plan.ts';
export {
  type MissExample,
  nextWeekId,
  rankedErrorTypes,
  type WeekReport,
  type WeekStats,
  weekBounds,
  weekStats,
} from './week-stats.ts';
export {
  addWildWords,
  deleteWildPhoto,
  type SignInput,
  saveWildPhoto,
  type WildBox,
  type WildPhoto,
  type WildReading,
  type WildView,
  wildPhotos,
  wildView,
} from './wild.ts';
