/**
 * Translations of the app's own content (N9, D53): grammar points, particles and units, written
 * for this app in French and Spanish. English stays in the entries themselves; Japanese text is
 * never translated. Pure data types.
 */

/** A grammar point's learner-facing text in one language. */
export interface GrammarText {
  meaning: string;
  explanation: string;
  /** Only when the English formation has English words ("V-stem + ます"); same Japanese, same " + ". */
  formation?: string;
}

/** One use of a particle: its name and the example's translation (the example stays Japanese). */
export interface UseText {
  use: string;
  translation: string;
}

/** A particle's or function word's text, its uses in the English order. */
export interface FunctionWordText {
  meaning: string;
  explanation: string;
  uses: readonly UseText[];
}

/** A unit's text: passage translations and question explanations in the English order. */
export interface UnitText {
  theme: string;
  summary: string;
  /** One per passage sentence, translating it. */
  sentences: readonly string[];
  /** One per question, its explanation. Prompts and options stay Japanese. */
  questions: readonly string[];
}

/** Translations by entry id. */
export type ById<T> = Readonly<Record<string, T>>;

/** Every translated text of one language. */
export interface ContentTranslations {
  grammar: ById<GrammarText>;
  functionWords: ById<FunctionWordText>;
  units: ById<UnitText>;
}
