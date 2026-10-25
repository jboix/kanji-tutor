/**
 * Grammar dialogues: short conversations, written for this app, that show a catalogue point in
 * use beside its introduction and page, and a "complete the line" drill on them. Committed data,
 * not runtime AI output. The Japanese carries no hand-written readings. Pure data types.
 */

/** A text in each content language: English, French and Spanish. */
export interface DialogueText {
  en: string;
  fr: string;
  es: string;
}

/** Where the conversation happens, shown with its register ("At work · polite"). */
export type DialogueSetting = 'friends' | 'family' | 'work' | 'school' | 'shop';

/** Plain (だ, casual) or polite (です/ます) speech. */
export type DialogueRegister = 'plain' | 'polite';

/** One line of a dialogue. */
export interface DialogueLine {
  /** Who says it: an index into the dialogue's `speakers`. */
  by: 0 | 1;
  ja: string;
  /** The grammar form exactly as written in `ja`, underlined; absent on a line without it. */
  focus?: string;
  /** The line's translation. */
  tr: DialogueText;
}

/** The drill on a dialogue: one line's focus blanked, and three wrong forms for the same slot. */
export interface DialogueBlank {
  /** Index of the blanked line; that line has a `focus`, the right answer. */
  line: number;
  /** Forms easy to confuse with the answer, each fitting the slot: the context rules them out. */
  distractors: readonly [string, string, string];
  /** One or two sentences on why the answer fits this conversation. */
  why: DialogueText;
}

export interface Dialogue {
  /** Stable slug, e.g. "koto-ni-naru-osaka". */
  id: string;
  setting: DialogueSetting;
  register: DialogueRegister;
  /** The two speakers' names, as written in Japanese (田中, リン). */
  speakers: readonly [string, string];
  /** Two to four lines. */
  lines: readonly DialogueLine[];
  blank: DialogueBlank;
}

/** A catalogue point's dialogues. */
export interface GrammarDialogues {
  /** A `GRAMMAR_CATALOGUE` id. */
  grammarId: string;
  /** A catalogue point easy to confuse with this one, for the page's "Compare" link. */
  compare?: string;
  /** Two or three dialogues, mixing plain and polite speech. */
  dialogues: readonly Dialogue[];
}
