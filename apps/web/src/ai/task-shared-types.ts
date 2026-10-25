/** The pieces task inputs and outputs share, re-exported by `types.ts`. */
import type { ErrorType } from '../domain/types.ts';

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
