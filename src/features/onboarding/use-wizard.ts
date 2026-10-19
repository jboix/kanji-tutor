import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import type { JlptList } from '../../domain/services/index.ts';
import type { OnboardingKnown, Settings } from '../../domain/types.ts';
import {
  isEmptyChoice,
  KNOWN_DRAFT,
  type KnownDraft,
  toChoice,
} from '../../ui/known-import-fields.tsx';
import { languageOf, type UiLanguage } from '../../ui/languages.ts';
import { paths } from '../../ui/paths.ts';
import { type ImportPhase, type ImportSummary, useKnownImport } from '../../ui/use-known-import.ts';
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
  known: KnownDraft;
  textbook: string;
  lesson: string;
}

/** The known-words form for a start: its lists ticked, nothing else (D38). */
export function knownFor(start: StartChoice): KnownDraft {
  const lists = START_LISTS[start];
  return { ...KNOWN_DRAFT, n5: lists.includes('n5'), n4: lists.includes('n4') };
}

export function initialDraft(settings: Settings): WizardDraft {
  const start = startOf(settings.learnerLevel);
  const { textbook, lesson } = splitLesson(settings.currentLesson);
  return {
    language: languageOf(settings.uiLanguage),
    start,
    known: knownFor(start),
    textbook,
    lesson,
  };
}

/** What leaving `step` with Next saves to settings. */
function savedOn(step: StepId, draft: WizardDraft): Partial<Settings> {
  if (step === 'language') return { uiLanguage: draft.language };
  if (step === 'start') return { learnerLevel: START_LEVEL[draft.start] };
  if (step === 'class') return { currentLesson: joinLesson(draft.textbook, draft.lesson) };
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
 * Marks the ticked lists, Minna lessons and pasted words as known (K6); false if it failed. The
 * outcome is saved to settings, so the summary and the lists a Skip left survive a reload.
 */
function useKnownStep(saved: OnboardingKnown | undefined, patch: PatchSettings) {
  const [phase, run] = useKnownImport();
  const save = (known: OnboardingKnown) => patch({ onboardingKnown: known });
  const apply = async (known: KnownDraft, pending: JlptList[]): Promise<boolean> => {
    const choice = { ...toChoice(known), pastedAs: 'known' as const, lesson: '' };
    if (isEmptyChoice(choice)) return true;
    const done = await run(choice);
    if (!done) return false;
    const marked = markedOf(done) ?? saved?.marked;
    await save(marked ? { marked, pending } : { pending });
    return true;
  };
  // Lists the start implies, left to mark at Start reading after a Skip on what you know (D38):
  // N4 means N5 is known. Start reading always waits for the dictionary; Skip may not.
  const pending = saved?.pending ?? [];
  const next = async (draft: KnownDraft) => {
    const done = await apply(draft, []);
    if (done && pending.length > 0) await save({ ...saved, pending: [] });
    return done;
  };
  const skip = (start: StartChoice) => save({ ...saved, pending: [...START_LISTS[start]] });
  const atStart = (start: StartChoice) => pending.length === 0 || apply(knownFor(start), []);
  return { phase, next, skip, atStart };
}

/** Start reading: marks the lists a Skip left (D38), then the wizard is done. */
function useFinish(patch: PatchSettings, markPending: () => Promise<boolean> | boolean) {
  const navigate = useNavigate();
  return async () => {
    if (!(await markPending())) return;
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
  setStart: (start: StartChoice) => void;
  importPhase: ImportPhase;
  /** What "What you know" marked, and the lists a Skip left for Start reading (from settings). */
  known: OnboardingKnown | undefined;
  next: () => Promise<void>;
  skip: () => Promise<void>;
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
    if (step === 'known' && !(await known.next(draft.known))) return;
    await go(stepAfter(step, returning), 'forward', savedOn(step, draft));
  };
  const skip = async () => {
    if (step === 'known') await known.skip(draft.start);
    await go(stepAfter(step, returning), 'forward');
  };
  const jump = async (to: StepId) => {
    nav.setReturning(true);
    await go(to, 'back');
  };
  const finish = useFinish(patch, () => known.atStart(draft.start));
  return {
    ...{ step, direction: nav.direction, returning, draft, setDraft, next, jump, finish },
    setStart: (start) => setDraft({ start, known: knownFor(start) }),
    importPhase: known.phase,
    known: settings.onboardingKnown,
    skip,
    back: () => go(stepBefore(step), 'back'),
  };
}
