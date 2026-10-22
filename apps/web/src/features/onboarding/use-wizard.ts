import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import type { OnboardingKnown, Settings } from '../../domain/types.ts';
import {
  isEmptyChoice,
  KNOWN_DRAFT,
  type KnownDraft,
  toChoice,
} from '../../ui/known-import-fields.tsx';
import { languageOf, type UiLanguage } from '../../ui/languages.ts';
import { paths } from '../../ui/paths.ts';
import {
  type ImportChoice,
  type ImportPhase,
  type ImportSummary,
  useKnownImport,
} from '../../ui/use-known-import.ts';
import { type BookId, bookName, bookOf, lessonNumberOf, lessonTag } from './class-books.ts';
import {
  joinLesson,
  START_LEVEL,
  START_LISTS,
  type StartChoice,
  type StepId,
  splitLesson,
  startOf,
  stepAfter,
  stepBefore,
} from './steps.ts';
import type { PatchSettings } from './use-wizard-settings.ts';

/** Which way the next step slides in. */
export type Direction = 'forward' | 'back' | 'none';

/** Choices held while the wizard runs; each is saved when its step is left with Next. */
export interface WizardDraft {
  language: UiLanguage;
  start: StartChoice;
  /** Your class: a book chip, the name typed for another course, and the lesson number. */
  book: BookId;
  textbook: string;
  lesson: number;
  /** "Lessons 1 to n − 1 are known" (Minna only) and a pasted list of known words. */
  known: KnownDraft;
}

/** The known-words form in the wizard: Minna's earlier lessons on, no JLPT lists. */
const WIZARD_KNOWN: KnownDraft = { ...KNOWN_DRAFT, n5: false, minna: true };

export function initialDraft(settings: Settings): WizardDraft {
  const { textbook, lesson } = splitLesson(settings.currentLesson);
  const book = bookOf(textbook);
  return {
    language: languageOf(settings.uiLanguage),
    start: startOf(settings.learnerLevel),
    book,
    textbook: book === 'other' ? textbook : '',
    lesson: lessonNumberOf(lesson),
    known: WIZARD_KNOWN,
  };
}

/** The current lesson tag the class step saves: "Tobira 第4課", or none. */
export function classTag(draft: WizardDraft): string {
  const name = bookName(draft.book, draft.textbook);
  return name ? joinLesson(name, lessonTag(draft.lesson)) : '';
}

/** Whether "Lessons 1 to n − 1 are known" is offered: Minna, past its first lesson. */
export const offersMinna = (draft: WizardDraft) => draft.book === 'minna' && draft.lesson > 1;

/** What the class step marks as known on Next: Minna's earlier lessons and the pasted list. */
export function classKnown(draft: WizardDraft): KnownDraft {
  const minna = offersMinna(draft) && draft.known.minna;
  return { ...draft.known, n5: false, n4: false, minna, minnaUpTo: String(draft.lesson - 1) };
}

/** True when the class step has words to mark, which needs the dictionary. */
export const marksOnClass = (draft: WizardDraft) => !isEmptyChoice(toChoice(classKnown(draft)));

/** What leaving `step` with Next saves to settings. */
function savedOn(step: StepId, draft: WizardDraft): Partial<Settings> {
  if (step === 'language') return { uiLanguage: draft.language };
  if (step === 'start') return { learnerLevel: START_LEVEL[draft.start] };
  if (step === 'class') return { currentLesson: classTag(draft) };
  return {};
}

function useStepNav(initial: StepId, patch: PatchSettings) {
  const [step, setStep] = useState(initial);
  const [direction, setDirection] = useState<Direction>('none');
  const [returning, setReturning] = useState(false);
  const go = useCallback(
    async (to: StepId, way: Direction, change: Partial<Settings> = {}) => {
      await patch({ ...change, onboardingStep: to });
      if (to === 'summary') setReturning(false);
      setDirection(way);
      setStep(to);
    },
    [patch],
  );
  return { step, direction, returning, setReturning, go };
}

/** What an import marked, as the wizard keeps it in settings. */
function markedOf(done: ImportSummary): OnboardingKnown['marked'] {
  const known = done.known;
  if (!known) return undefined;
  return { words: known.marked, already: known.already, missing: known.notFound.length };
}

/**
 * Marking what you know (K6). The class step marks Minna's earlier lessons and a
 * pasted list on Next; false if it failed. The JLPT lists the start implies (N4 means N5 is
 * known) are marked at Start reading, which waits for the dictionary. Marking twice adds nothing
 * twice (P2).
 */
function useKnownStep(saved: OnboardingKnown | undefined, patch: PatchSettings) {
  const [phase, run] = useKnownImport();
  const onClass = async (known: KnownDraft): Promise<boolean> => {
    const choice = { ...toChoice(known), pastedAs: 'known' as const, lesson: '' };
    if (isEmptyChoice(choice)) return true;
    const done = await run(choice);
    if (!done) return false;
    const marked = markedOf(done) ?? saved?.marked;
    if (marked) await patch({ onboardingKnown: { pending: [], marked } });
    return true;
  };
  const atStart = async (start: StartChoice): Promise<boolean> => {
    const lists = [...START_LISTS[start]];
    if (lists.length === 0) return true;
    const choice: ImportChoice = {
      lists,
      minnaUpTo: undefined,
      pasted: '',
      pastedAs: 'known',
      lesson: '',
    };
    return (await run(choice)) !== undefined;
  };
  return { phase, onClass, atStart };
}

/** Start reading: marks the lists the start implies, then the wizard is done. */
function useFinish(patch: PatchSettings, markLists: () => Promise<boolean>) {
  const navigate = useNavigate();
  return async () => {
    if (!(await markLists())) return;
    await patch({ onboarded: true, onboardingStep: '' });
    await navigate(paths.today, { replace: true });
  };
}

export interface Wizard {
  step: StepId;
  direction: Direction;
  /** Jumped here from the summary: Next goes back to it. */
  returning: boolean;
  draft: WizardDraft;
  setDraft: (change: Partial<WizardDraft>) => void;
  importPhase: ImportPhase;
  /** What the class step marked (from settings). */
  known: OnboardingKnown | undefined;
  next: () => Promise<void>;
  back: () => Promise<void>;
  jump: (step: StepId) => Promise<void>;
  finish: () => Promise<void>;
}

/** The wizard's state and moves (P5): selecting only selects; Next, Back and Skip move. */
export function useWizard(settings: Settings, initial: StepId, patch: PatchSettings): Wizard {
  const nav = useStepNav(initial, patch);
  const known = useKnownStep(settings.onboardingKnown, patch);
  const [draft, setDraftState] = useState(() => initialDraft(settings));
  const setDraft = (change: Partial<WizardDraft>) => setDraftState((d) => ({ ...d, ...change }));
  const { step, returning, go } = nav;
  const next = async () => {
    if (step === 'class' && !(await known.onClass(classKnown(draft)))) return;
    await go(stepAfter(step, returning), 'forward', savedOn(step, draft));
  };
  const jump = async (to: StepId) => {
    nav.setReturning(true);
    await go(to, 'back');
  };
  return {
    ...{ step, direction: nav.direction, returning, draft, setDraft, next, jump },
    finish: useFinish(patch, () => known.atStart(draft.start)),
    importPhase: known.phase,
    known: settings.onboardingKnown,
    back: () => go(stepBefore(step), 'back'),
  };
}
