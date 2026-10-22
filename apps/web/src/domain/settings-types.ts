/** Types of the settings record (`Settings` in types.ts), kept apart to keep that file short. */

/** The outcome of the welcome wizard's "What you know" step (P5, D38). */
export interface OnboardingKnown {
  /** What Next marked; absent until it marked something. */
  marked?: { words: number; already: number; missing: number };
  /** Lists the start implies but a Skip left unmarked: marked at Start reading. */
  pending: ('n5' | 'n4')[];
}

/** Session lengths offered in Settings (L6). */
export type SessionMinutes = 5 | 10 | 15;

/** Settings → Tutor (A13, D45). */
export type TutorMode = 'on-ask' | 'auto-mistakes';

/** The immersion dial (M1): Auto, My language, Mixed, Japanese. */
export type ImmersionSetting = 'auto' | 'native' | 'mixed' | 'japanese';

/** The language explanations are written in once Auto is resolved (M1, D51). */
export type ImmersionMode = 'native' | 'mixed' | 'japanese';

/**
 * What the Start button plays (IA2, IA3), chosen on Today: the daily mix (the next lesson part
 * first when one is due), the next lesson part, reading only, grammar or kanji.
 */
export type PracticeChoice = 'mix' | 'lesson' | 'reading' | 'grammar' | 'kanji';
