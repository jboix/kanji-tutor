/**
 * Task inputs and outputs of the AI module (SPEC "AI layer"), re-exported by `types.ts`. Outputs
 * are what the UI renders, after Zod validation and reading verification.
 */
import type { ErrorType, PlanLine } from '../domain/types.ts';

// ── Shared pieces ─────────────────────────────────────────────────────────────

/** A reading the model claims, e.g. { surface: "紹介", reading: "しょうかい" }. */
export interface ReadingClaim {
  surface: string;
  reading: string;
}

/** A claimed reading after `verifyReading` (A8). Unverified ones must be visibly marked. */
export interface CheckedReading extends ReadingClaim {
  verified: boolean;
  /**
   * Set when the reading is valid but less common: the dictionary's usual reading, which the UI
   * names inside the AI box (R10), e.g. にほんじん for にっぽんじん.
   */
  preferred?: string;
}

export type FollowUpKind = 'compare' | 'example' | 'simpler' | 'quiz' | 'keep';

/** Follow-up chip under an explanation (A3). `label` is UI copy, e.g. "待 and 持 side by side". */
export interface FollowUpChip {
  kind: FollowUpKind;
  label: string;
}

/** The sentence an explanation is about. */
export interface SentenceContext {
  text: string;
  translation?: string;
  lesson?: string;
}

/** Compact learner profile sent with every call. */
export interface LearnerProfile {
  /** Sample of words the learner reads well (level ≥ 3), for hooks and simple wording. */
  knownWords: string[];
  recentErrors: ErrorType[];
  currentLesson?: string;
}

/** Base64 media for vision and audio tasks. */
export interface Media {
  mime: string;
  data: string;
}

// ── Task inputs and outputs ───────────────────────────────────────────────────

/**
 * A wrong reading (A1). Cached on the word, the expected reading, the error type and the
 * confused kanji (A15); the raw answer and the sentence only count for `other` slips, so the
 * prompt names the sentence and the answer only then.
 */
export interface ExplainMistakeInput {
  sentence: SentenceContext;
  target: { surface: string; expected: string };
  answer: string;
  errorType?: ErrorType;
  /** For `wrong-kanji`: the target's kanji and the lookalike the answer read (待 → 持). */
  confused?: { kanji: string; lookalike: string };
}
export interface MistakeExplanation extends Immersed {
  /** 2–3 sentences about this error (A1). */
  explanation: string;
  confusedWith?: { kanji: string; meaning: string };
  /** Memory hook from a word the learner knows (A5), e.g. 一緒 → 一生. */
  hook?: string;
  chips: FollowUpChip[];
  readings: CheckedReading[];
}

/**
 * A word in general (A2): cached per word (its JMdict id, else its written form), learner bucket
 * and language, not per sentence (A15). What it does in one sentence is a separate question.
 */
export interface ExplainWordInput {
  /** Where it was tapped; not sent, not part of the cache key. */
  sentence: SentenceContext;
  surface: string;
  wordId?: string;
  /** The dictionary entry, so the tutor explains the right word (間 あいだ, not ま). */
  word?: { form: string; reading?: string; meanings: string[] };
}
export interface WordExplanation extends Immersed {
  surface: string;
  reading: CheckedReading;
  /** Its core meaning in a few words (A2). */
  meaning: string;
  /** Nuance against similar forms. */
  nuance: string;
  contrast?: { text: string; meaning: string };
  hook?: string;
  chips: FollowUpChip[];
  readings: CheckedReading[];
}

/** A sentence chunk by chunk (A2); cached per sentence, `focus` only marks a chunk (A15). */
export interface BreakdownInput {
  sentence: SentenceContext;
  focus?: string;
}
export interface SentenceChunk {
  text: string;
  gloss: string;
  focus: boolean;
}
export interface SentenceBreakdown {
  translation: string;
  chunks: SentenceChunk[];
  readings: CheckedReading[];
}

export interface QuestionInput {
  scope: 'sentence' | 'word';
  sentence: SentenceContext;
  surface?: string;
  question: string;
}
export interface Answer extends Immersed {
  answer: string;
  readings: CheckedReading[];
}

export interface FollowUpInput {
  kind: Exclude<FollowUpKind, 'keep'>;
  sentence: SentenceContext;
  surface?: string;
  /** The explanation the chip was under. */
  previous: string;
}
export interface FollowUpResult extends Immersed {
  text: string;
  example?: { text: string; translation: string };
  quiz?: { question: string; options: string[]; answerIndex: number };
  readings: CheckedReading[];
}

export interface CorrectSentenceInput {
  grammar: { pattern: string; meaning: string };
  sentence: string;
}
/** One red-pen mark (A6). Offsets are UTF-16 indices into the learner's sentence. */
export interface CorrectionMark {
  kind: 'insert' | 'replace' | 'delete';
  severity: 'error' | 'style';
  start: number;
  end: number;
  /** Inserted or replacement text; empty for deletions. */
  text: string;
  /** Short heading, e.g. "Needed: な." */
  title: string;
  note: string;
}
export interface Correction extends Immersed {
  corrected: string;
  marks: CorrectionMark[];
  /** One closing line, e.g. "Otherwise natural." */
  summary: string;
  usesTarget: boolean;
  readings: CheckedReading[];
}

export interface ExtractInput {
  image: Media;
}
export interface Extraction {
  /** OCR text, one entry per printed line, Japanese only (C1). */
  lines: string[];
}

export interface TranscribeInput {
  audio: Media;
}
/** Hiragana exactly as pronounced, never auto-corrected to the likely word (I2). */
export interface Transcription {
  kana: string;
}

export interface WeekStats {
  week: string;
  sentencesRead: number;
  correct: number;
  byErrorType: Partial<Record<ErrorType, number>>;
  missExamples: { surface: string; expected: string; given: string }[];
  /** Grammar points of the lesson the learner has not produced in Use it. */
  unusedGrammar: string[];
  lesson?: string;
}
export interface WeeklyNotesInput {
  stats: WeekStats;
}
export interface WeeklyNotes {
  letter: string[];
  plan: PlanLine[];
}

export interface GenerateSentencesInput {
  targets: { surface: string; reading: string; meaning: string }[];
  knownWords: string[];
  count: number;
}
export interface GeneratedSentences {
  sentences: { text: string; translation: string; target: string }[];
  readings: CheckedReading[];
}

export interface DescribeKanjiInput {
  description: string;
}
export interface KanjiCandidates {
  candidates: { char: string; reason: string }[];
  /** Readings the reasons mention, listed or found in the prose, each checked (A8). */
  readings: CheckedReading[];
}

export interface HandwritingInput {
  image: Media;
}
export interface HandwritingCandidates {
  candidates: string[];
}

/** A target not answered yet (L3): its reading must not appear in the explanation. */
export interface HiddenTarget {
  surface: string;
  readings: string[];
}

/** A grammar point the catalogue found in the sentence, for the explanation to name. */
export interface DetectedGrammar {
  pattern: string;
  meaning: string;
}

/**
 * A blank exercise the learner asked help with (A19): the sentence as they see it, and the
 * answer the blank hides. The tutor hints toward it without saying it.
 */
export interface BlankHint {
  shown: string;
  answer: string;
}

export interface ExplainSentenceInput {
  /** The real sentence, the blank filled in for a blank exercise (A19). */
  sentence: SentenceContext;
  grammar: DetectedGrammar[];
  /** The current and later targets: their readings are never shown (L3). */
  hidden: HiddenTarget[];
  /** Set for a blank: the answer and its readings are also removed from the reply. */
  blank?: BlankHint;
}
/** Meaning and grammar of a sentence, before answering, with no target reading (L3). */
export interface SentenceExplanation extends Immersed {
  /** What the sentence says, in two or three sentences. */
  meaning: string;
  grammar: { pattern: string; note: string }[];
  readings: CheckedReading[];
  /** A hidden reading leaked and was removed from the text. */
  redacted: boolean;
}

export interface MemoryHookInput {
  word: { surface: string; reading: string; meaning: string };
  kanji: { char: string; meanings: string[]; parts: { char: string; meaning?: string }[] }[];
  sentence?: SentenceContext;
}
/** A memory hook for a new word (L1, A5), built from what the learner knows. */
export interface MemoryHook extends Immersed {
  hook: string;
  readings: CheckedReading[];
}

export interface ParaphraseInput {
  sentence: SentenceContext;
  /** The underlined part the question asks about; the whole sentence when absent. */
  phrase?: string;
}
/**
 * A 言い換え類義 question (J6): four Japanese options, the one closest in meaning, and why each
 * other one is wrong. Offer it only when `verified`.
 */
export interface ParaphraseQuestion {
  phrase: string;
  options: { text: string; why: string }[];
  answerIndex: number;
  readings: CheckedReading[];
  /** Four distinct options, a valid answer and every reading confirmed by the dictionary. */
  verified: boolean;
}

/** The learner's level as the placement and assessment name it (A11). */
export type PlacementLevel = 5 | 4 | 3;

/** One placement answer, summarised for the tutor (A11). */
export interface PlacementAnswer {
  kind: 'kanji-reading' | 'orthography' | 'grammar-form' | 'comprehension';
  level: PlacementLevel;
  right: boolean;
  /** What was asked and answered, e.g. "紹介を: chose しょかい, right is しょうかい". */
  item: string;
}

/** The placement's answers and the optional written answer, for `assessLevel` (A11). */
export interface AssessLevelInput {
  answers: PlacementAnswer[];
  /** The level the staircase alone proposes. */
  staircaseLevel: PlacementLevel;
  /** The writing prompt, e.g. 自己紹介を書いてください。 */
  writingPrompt?: string;
  written?: string;
}

/** The tutor's view of the learner's level (A11): a level and notes, never a score. */
export interface LevelAssessment {
  level: PlacementLevel;
  strengths: string[];
  gaps: string[];
  /** Two or three sentences in the learner's language. */
  notes: string;
  readings: CheckedReading[];
}

/** Every task, its input and its output. */
export interface Tasks {
  explainMistake: [ExplainMistakeInput, MistakeExplanation];
  explainWord: [ExplainWordInput, WordExplanation];
  breakdownSentence: [BreakdownInput, SentenceBreakdown];
  answerQuestion: [QuestionInput, Answer];
  followUp: [FollowUpInput, FollowUpResult];
  correctSentence: [CorrectSentenceInput, Correction];
  extractFromImage: [ExtractInput, Extraction];
  transcribeReading: [TranscribeInput, Transcription];
  weeklyNotes: [WeeklyNotesInput, WeeklyNotes];
  generateSentences: [GenerateSentencesInput, GeneratedSentences];
  describeKanji: [DescribeKanjiInput, KanjiCandidates];
  recognizeHandwriting: [HandwritingInput, HandwritingCandidates];
  explainSentence: [ExplainSentenceInput, SentenceExplanation];
  memoryHook: [MemoryHookInput, MemoryHook];
  paraphraseQuestion: [ParaphraseInput, ParaphraseQuestion];
  assessLevel: [AssessLevelInput, LevelAssessment];
}
export type TaskName = keyof Tasks;
export type TaskInput<T extends TaskName> = Tasks[T][0];
export type TaskOutput<T extends TaskName> = Tasks[T][1];

// ── Immersion (M1, M2) ────────────────────────────────────────────────────────

/** A teacher explanation that follows the immersion dial: `immersion` in mixed or Japanese mode. */
export interface Immersed {
  immersion?: ImmersionNote;
}

/** A word in the tutor's Japanese the learner does not know yet: furigana and a gloss (M2). */
export interface GlossedWord {
  surface: string;
  /** Hiragana for the furigana; absent when it would give a hidden target away (L3). */
  reading?: string;
  /** False when `verifyReading` did not confirm the reading: shown unverified (A8). */
  verified: boolean;
  /** The first dictionary meaning, for the tap-to-gloss. */
  gloss?: string;
}

/**
 * Where the tokenizer found a glossed word: `texts[text]` from `start` to `end` (UTF-16
 * offsets) is `words[word]`. Furigana go there and only there, never by substring search.
 */
export interface GlossPlace {
  text: number;
  start: number;
  end: number;
  word: number;
}

/** How a mixed or Japanese explanation was checked against what the learner knows (M2). */
export interface ImmersionNote {
  mode: 'mixed' | 'japanese';
  /** Words above the learner, each once, in order of appearance. */
  words: GlossedWord[];
  /** The Japanese texts that were tokenized, as shown, for `places`. */
  texts?: string[];
  /** Every token of a glossed word in `texts`; absent when nothing was checked. */
  places?: GlossPlace[];
  /** Share of content words above the learner, 0–1. */
  unknownShare: number;
  /** Too many unknown words: shown as mixed, with the summary in the learner's language. */
  fellBack: boolean;
  /** The model's short summary in the learner's language. */
  summaryNative?: string;
  /** False when no tokenizer or learner view was at hand, so nothing could be checked. */
  checked: boolean;
}
