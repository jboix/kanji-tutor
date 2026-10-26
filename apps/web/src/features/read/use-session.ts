import { type Dispatch, useCallback, useEffect, useReducer, useRef } from 'react';
import { useLocation } from 'react-router';
import type { Repos } from '../../domain/repos.ts';
import {
  type BuildSessionOptions,
  buildSession,
  countScanCard,
  prepareScanCard,
  recordAnswer,
  type SessionFocus,
  sharedReads,
} from '../../domain/services/index.ts';
import type { AnswerMode, LessonSection } from '../../domain/types.ts';
import { canListen } from '../../lang/speech.ts';
import { useServices } from '../../ui/services.tsx';
import { takeSession } from '../../ui/session-handoff.ts';
import { loadSession, requestKey, saveSession } from './saved-session.ts';
import { retryOf, roundOf } from './session-round.ts';
import {
  current,
  type DrillResult,
  INITIAL,
  type SessionAction,
  type SessionState,
  sessionReducer,
} from './session-state.ts';

export interface SessionControls {
  state: SessionState;
  /** Grades and records the current target's answer; ignored while feedback shows. */
  submit: (answer: string, mode: AnswerMode, durationMs?: number) => Promise<void>;
  /** "I don't know" (L4): shows the current target's reading and records it as a skip (Again). */
  skip: (mode: AnswerMode) => Promise<void>;
  next: () => void;
  /** Ends the current drill card with its result and moves on. */
  finishDrill: (result: DrillResult) => void;
  /** Leaves a grammar introduction card (G4) and moves on. */
  finishIntro: () => void;
}

/** How a session is built: focused on a kanji reading, or with drills or questions forced. */
export interface SessionRequest {
  focus?: SessionFocus | undefined;
  drillShare?: number | undefined;
  /** One question after every this many sentences (`?questions=1`), else the default. */
  questionEvery?: number | undefined;
  /** Practise this unit (`?unit=…`, T3). */
  unit?: string | undefined;
  /** With `unit`: only its passage and questions (`&passage=1`, T6). */
  passage?: boolean | undefined;
  /** Practise one grammar point (`?grammar=…`, the grammar page's "Practise this"). */
  grammar?: string | undefined;
  /** A round of kanji cards (`?cards=kanji`, Start → Kanji). */
  kanjiCards?: boolean | undefined;
  /** With `unit`: one section of the unit lesson (`&section=words`, S3) and its part. */
  section?: LessonSection | undefined;
  part?: number | undefined;
  /** Practise a scanned lesson (`?scan=…`), apart from the daily mix. */
  scan?: string | undefined;
}

/** The session builder's options for a request: kanji cards, or a session's focus and mix. */
function sessionOptions(request: SessionRequest): Omit<BuildSessionOptions, 'now'> {
  if (request.scan) return { scan: request.scan };
  return request.kanjiCards ? { kanjiCards: true } : mixOptions(request);
}

/** The options of a reading session: its focus, a forced mix, a unit or a grammar point. */
function mixOptions(request: SessionRequest): Omit<BuildSessionOptions, 'now'> {
  const { focus, drillShare, questionEvery, unit, passage, grammar, section, part } = request;
  return {
    ...(focus ? { focus } : {}),
    ...(grammar ? { grammar } : {}),
    ...(drillShare === undefined ? {} : { drillShare }),
    ...(questionEvery === undefined ? {} : { questionEvery }),
    ...(unit ? { unit, passage: passage === true } : {}),
    ...(unit && section ? { section, part: part ?? 1 } : {}),
  };
}

/**
 * A session ready without building: the saved one (R14), else Today's, handed on by Begin
 * reading for the plain session (N10).
 */
function readySession(key: string, handoff: unknown): SessionAction | undefined {
  const at = Date.now();
  const saved = loadSession(key, at);
  if (saved) return { type: 'restored', state: saved, at };
  const retry = retryOf(handoff);
  if (retry) return { type: 'loaded', cards: retry, at };
  const cards = key === PLAIN_KEY ? takeSession(handoff, at) : undefined;
  return cards ? { type: 'loaded', cards, at } : undefined;
}

const PLAIN_KEY = requestKey({});

/**
 * Builds the session, with listening exercises where the device has a Japanese voice (S4). Its
 * steps share their reads (the lesson path, the word items) over one view.
 */
function build(repos: Repos, options: Omit<BuildSessionOptions, 'now'>) {
  const listening = canListen();
  return buildSession(sharedReads(repos), { now: Date.now(), ...options, listening });
}

/** The build options back from their key (`requestKey` keeps every option, sorted). */
const optionsOf = (key: string): Omit<BuildSessionOptions, 'now'> =>
  Object.fromEntries(JSON.parse(key) as [string, unknown][]);

/**
 * One key for the whole request: a new object with the same options builds nothing new. A retry
 * round has its own, so it resumes as itself and never stands in for the session.
 */
function useSessionKey(request: SessionRequest): { key: string; handoff: unknown } {
  const handoff: unknown = useLocation().state;
  const options = sessionOptions(request);
  const retry = retryOf(handoff) ? { retry: roundOf(handoff) } : {};
  return { key: requestKey({ ...options, ...retry }), handoff };
}

function useLoad(dispatch: Dispatch<SessionAction>, key: string, handoff: unknown) {
  const { repos } = useServices();
  useEffect(() => {
    let live = true;
    const ready = readySession(key, handoff);
    if (ready) {
      dispatch(ready);
      return;
    }
    void build(repos, optionsOf(key)).then((cards) => {
      if (live) dispatch({ type: 'loaded', cards, at: Date.now() });
    });
    return () => {
      live = false;
    };
  }, [repos, dispatch, handoff, key]);
}

interface Attempt {
  answer: string;
  mode: AnswerMode;
  durationMs: number | undefined;
  skipped: boolean;
}

/** Grades and records an answer or a skip for the current target, once, then shows feedback. */
function useRecord(state: SessionState, dispatch: Dispatch<SessionAction>) {
  const { repos } = useServices();
  const busy = useRef(false);
  return useCallback(
    async ({ answer, mode, durationMs, skipped }: Attempt) => {
      const now = current(state);
      if (!now || state.answered || busy.current) return;
      busy.current = true;
      const at = Date.now();
      const duration = durationMs ?? at - state.shownAt;
      const input = { ...now, answer, mode, durationMs: duration, now: at, skipped };
      const grade = await recordAnswer(repos, input).finally(() => {
        busy.current = false;
      });
      void countScanCard(repos, now.card, grade.verdict === 'correct', at);
      dispatch({ type: 'answered', answered: { target: now.target, answer, mode, grade } });
    },
    [repos, state, dispatch],
  );
}

/**
 * A scanned lesson's card: what it practises is tracked from the lesson as it shows, so the
 * answer reviews those items and the daily sessions never take them as new.
 */
function usePrepareScan(state: SessionState) {
  const { repos } = useServices();
  const card = state.cards?.[state.index];
  useEffect(() => {
    if (card?.scan) void prepareScanCard(repos, card, Date.now());
  }, [repos, card]);
}

/** Ends a drill card with its result; a scanned lesson's card counts in its progress when right. */
function useFinishDrill(state: SessionState, dispatch: Dispatch<SessionAction>) {
  const { repos } = useServices();
  const card = state.cards?.[state.index];
  return useCallback(
    (result: DrillResult) => {
      if (card) void countScanCard(repos, card, result.right, Date.now());
      dispatch({ type: 'drilled', result, at: Date.now() });
    },
    [repos, card, dispatch],
  );
}

/** Keeps the session's position after every step, so it resumes where it was left (R14). */
function useSaved(state: SessionState, key: string) {
  useEffect(() => saveSession(key, state, Date.now()), [key, state]);
}

/** A reading session (R2): builds it, records each answer, and steps through targets. */
export function useSession(request: SessionRequest = {}): SessionControls {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL);
  const { key, handoff } = useSessionKey(request);
  useLoad(dispatch, key, handoff);
  useSaved(state, key);
  usePrepareScan(state);
  const record = useRecord(state, dispatch);
  const submit = useCallback(
    (answer: string, mode: AnswerMode, durationMs?: number) =>
      record({ answer, mode, durationMs, skipped: false }),
    [record],
  );
  const skip = useCallback(
    (mode: AnswerMode) => record({ answer: '', mode, durationMs: undefined, skipped: true }),
    [record],
  );
  const next = useCallback(() => dispatch({ type: 'next', at: Date.now() }), []);
  const finishDrill = useFinishDrill(state, dispatch);
  const finishIntro = useCallback(() => dispatch({ type: 'introduced', at: Date.now() }), []);
  return { state, submit, skip, next, finishDrill, finishIntro };
}
