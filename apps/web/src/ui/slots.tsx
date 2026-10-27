/**
 * Slots let one feature render inside another's screen without importing it (features never
 * import each other). `src/app` fills them; a feature renders `useSlot('name')` if present.
 */
import { type ComponentType, createContext, type ReactNode, use } from 'react';
import type { AiClient, Answer } from '../ai/types.ts';
import type { SessionCard, Target } from '../domain/session-types.ts';
import type { Grade, Sentence, Settings } from '../domain/types.ts';

/** Under a wrong or near-miss answer in a reading session (explain feature, A1). */
export interface MistakeSlotProps {
  card: SessionCard;
  target: Target;
  answer: string;
  grade: Grade;
  /** Opens the word sheet on the target, for "Break down the sentence". */
  onOpenWord: (tokenIndex: number) => void;
}

/** The card a sheet opens in and its first target still to be answered (L3). */
export interface NoSpoilScope {
  card: SessionCard;
  /** Targets from this index on are not answered: none of their readings may show. */
  from: number;
}

/** Bottom sheet for a tapped word (explain feature, A2–A5). */
export interface WordSheetSlotProps {
  sentence: Sentence;
  tokenIndex: number;
  /**
   * Opened from an exercise not answered yet (U5): `sentence` is already masked, and the
   * sheet shows the word alone, nothing about the sentence (translation, grammar, tutor, ask).
   */
  beforeAnswer?: boolean;
  onClose: () => void;
  /** In a session: the targets still to be answered, kept out of everything the sheet shows. */
  noSpoil?: NoSpoilScope | undefined;
}

/** Question box scoped to the current sentence (explain feature, A4). */
export interface AskSlotProps {
  sentence: Sentence;
  surface?: string;
}

/** Voice answer mode for the current target (voice feature, I2). */
export interface VoiceAnswerSlotProps {
  card: SessionCard;
  target: Target;
  /** Called with hiragana as pronounced; the session grades it. */
  onAnswer: (kana: string, durationMs: number) => void;
  onTypeInstead: () => void;
}

/**
 * Drawing a word's kanji one after the other, for "Write the kanji" (handwrite feature): the
 * pad, the boxes still to fill, and Next or Check.
 */
export interface KanjiDrawSlotProps {
  /** The kanji to draw, in order. */
  kanji: readonly string[];
  /**
   * Called after the last one, with the kanji as drawn: each one the kanji meant when the
   * recognizer ranks it close, else its best guess (？ for nothing).
   */
  onAnswer: (drawn: string) => void;
}

/** Memory hook under a kanji reading on the kanji page (explain feature, A5). */
export interface ReadingHookSlotProps {
  kanji: string;
  /** e.g. "ショウ" or "い.きる". */
  reading: string;
  /** Words that carry this reading (JMdict ids). */
  wordIds: string[];
}

/**
 * Before the first exercise on a word the learner has never met (teach feature, L1). Renders the
 * intro card, or calls `onDone` at once when no intro is due (seen before, or not new).
 */
export interface IntroSlotProps {
  card: SessionCard;
  target: Target;
  /** "Got it": go on to the exercise. */
  onDone: () => void;
}

/**
 * With explanations skipped (teach feature, L7): a "New: 学生" chip on the exercise of a word the
 * learner has never met, opening its intro in a sheet. Before the answer the sheet keeps the
 * reading back (the L2 hint); after it, the full intro. Nothing when no intro is due.
 */
export interface NewWordChipSlotProps {
  card: SessionCard;
  target: Target;
  answered: boolean;
}

/** The teaching card under a skip or a miss (teach feature, L1, L4). */
export interface TeachingSlotProps {
  card: SessionCard;
  target: Target;
  grade: Grade;
}

/**
 * Sheet for a target not answered yet (teach feature, L2): meaning, kanji meanings and parts,
 * never the reading. `onShowReading` (the current target only) is the session's skip.
 */
export interface HintSlotProps {
  card: SessionCard;
  target: Target;
  onShowReading?: () => void;
  onClose: () => void;
}

/**
 * The answer a blank exercise hides (A19): the sentence with it filled in, the answer as
 * written and its readings. The tutor hints toward it; none of it may show before the answer.
 */
export interface BlankAnswer {
  text: string;
  answer: string;
  readings: string[];
}

/** "Explain this sentence" before answering, without the readings still to come (L3). */
export interface SentenceHelpSlotProps {
  card: SessionCard;
  /** The current target; it and later ones are hidden. */
  step: number;
  /** Before the answer of a blank exercise (A19): what the blank hides, for the tutor's hint. */
  blank?: BlankAnswer | undefined;
}

/** After a sentence's last target: its translation and one line on its grammar (L5). */
export interface SentenceWrapSlotProps {
  sentence: Sentence;
}

/** Gemini key field, Test key and model pickers in the welcome wizard (settings feature, P6). */
export interface AiSetupSlotProps {
  settings: Settings;
  /** Persists a change; the wizard re-renders with the new settings. */
  onPatch: (patch: Partial<Settings>) => Promise<void>;
}

/**
 * Before a grammar point's first practice (grammar feature, G4): pattern, meaning, formation,
 * explanation and two examples. "Got it" calls `onDone`; an unknown id calls it at once.
 */
export interface GrammarIntroSlotProps {
  grammarId: string;
  onDone: () => void;
  /**
   * Under a question or drill answer (L4): "About this grammar", with no examples and no
   * "Got it", since nothing waits on it.
   */
  compact?: boolean;
}

/** A grammar or kanji page shown in a sheet over a session, so the session keeps its place (R14). */
export interface PagePeekSlotProps {
  kind: 'grammar' | 'kanji';
  /** The grammar id or the kanji. */
  id: string;
}

/** "Practise this point" on a grammar page (read feature, S5): a short set of its drills. */
export interface PointPracticeSlotProps {
  grammarId: string;
}

/**
 * What a conversation with the tutor is about: a sentence (or a word or pattern standing in for
 * one), optionally one word in it and a grammar point. Never anything still to be answered.
 */
export interface TutorTopic {
  /** Shown under "Your tutor" as "About …", e.g. 〜ました or the sentence. */
  about: string;
  sentence: { text: string; translation?: string };
  surface?: string;
  grammar?: { pattern: string; meaning: string };
  /** Asked from the Tutor tab, about nothing on screen: the sentence is empty. */
  general?: boolean;
}

/** A question the tutor answered, kept so the conversation can be carried on later. */
export interface AnsweredTurn {
  question: string;
  answer: Answer;
}

/** A question asked as the sheet opens: a suggested question pressed outside it. */
export interface TutorQuestion {
  question: string;
  client: AiClient;
}

/** The tutor's conversation sheet (explain feature, A4): opened from every 解 button. */
export interface TutorSheetSlotProps {
  topic: TutorTopic;
  /** Suggested questions, shown as chips while nothing is asked. */
  starters: readonly string[];
  first?: TutorQuestion | undefined;
  /** The turns of an earlier conversation on the same topic, carried on (the Tutor tab). */
  resume?: readonly AnsweredTurn[] | undefined;
  onClose: () => void;
}

/**
 * Before a unit lesson's first part (units feature): the unit, its conversation to read or play,
 * and Start. Shown in the session screen, with its close button.
 */
export interface LessonIntroSlotProps {
  unitId: string;
  close: ReactNode;
  /** The section the lesson starts with, e.g. "言葉 · Words", for the Start button. */
  first: string;
  onStart: () => void;
}

export interface Slots {
  lessonIntro?: ComponentType<LessonIntroSlotProps>;
  tutorSheet?: ComponentType<TutorSheetSlotProps>;
  pointPractice?: ComponentType<PointPracticeSlotProps>;
  pagePeek?: ComponentType<PagePeekSlotProps>;
  grammarIntro?: ComponentType<GrammarIntroSlotProps>;
  newItemIntro?: ComponentType<IntroSlotProps>;
  newWordChip?: ComponentType<NewWordChipSlotProps>;
  teachingCard?: ComponentType<TeachingSlotProps>;
  targetHint?: ComponentType<HintSlotProps>;
  sentenceHelp?: ComponentType<SentenceHelpSlotProps>;
  sentenceWrapUp?: ComponentType<SentenceWrapSlotProps>;
  aiSetup?: ComponentType<AiSetupSlotProps>;
  readingHook?: ComponentType<ReadingHookSlotProps>;
  mistakeExplanation?: ComponentType<MistakeSlotProps>;
  wordSheet?: ComponentType<WordSheetSlotProps>;
  askBox?: ComponentType<AskSlotProps>;
  voiceAnswer?: ComponentType<VoiceAnswerSlotProps>;
  kanjiDraw?: ComponentType<KanjiDrawSlotProps>;
}

const SlotsContext = createContext<Slots>({});

export function SlotsProvider({ value, children }: { value: Slots; children: ReactNode }) {
  return <SlotsContext value={value}>{children}</SlotsContext>;
}

/** The component filling a slot, or undefined when that feature is not wired. */
export function useSlot<K extends keyof Slots>(name: K): Slots[K] {
  return use(SlotsContext)[name];
}
