/** Reading-session state: which card and target is current, and what was answered (R2–R4). */
import type { DrillKind } from '../../domain/drills/index.ts';
import type { QuestionKind } from '../../domain/questions/index.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import type { AnswerMode, Grade } from '../../domain/types.ts';

export interface Answered {
  target: Target;
  /** As typed or transcribed. */
  answer: string;
  mode: AnswerMode;
  grade: Grade;
  /** The index of the card it was answered on (the end's missed list and retry, D116). */
  card?: number;
}

/** A finished drill or question: right when every answer in it was right. */
export interface DrillResult {
  kind: DrillKind | QuestionKind;
  right: boolean;
  /** The index of its card (the end's missed list and retry, D116). */
  card?: number;
}

export interface SessionState {
  /** Undefined while the session is being built. */
  cards: SessionCard[] | undefined;
  /** Current card. Equal to `cards.length` when the session is over. */
  index: number;
  /** Current target within the card. */
  step: number;
  /** The grade of the current target, once answered: the feedback state. */
  answered: Answered | undefined;
  results: Answered[];
  /** Drills finished in this session (R8). */
  drills: DrillResult[];
  /** When the current target appeared (epoch ms), for the answer duration (D9 Easy rating). */
  shownAt: number;
  /** When the session was built (epoch ms), for the end's "about N minutes"; older saves lack it. */
  startedAt?: number;
}

export type SessionAction =
  | { type: 'loaded'; cards: SessionCard[]; at: number }
  /** A saved session picked up where it was left (R14). */
  | { type: 'restored'; state: SessionState; at: number }
  | { type: 'answered'; answered: Answered }
  | { type: 'next'; at: number }
  | { type: 'drilled'; result: DrillResult; at: number }
  | { type: 'introduced'; at: number };

export const INITIAL: SessionState = {
  cards: undefined,
  index: 0,
  step: 0,
  answered: undefined,
  results: [],
  drills: [],
  shownAt: 0,
};

function advance(state: SessionState, at: number): SessionState {
  const card = state.cards?.[state.index];
  if (!card || !state.answered) return state;
  const more = state.step + 1 < card.targets.length;
  return {
    ...state,
    index: more ? state.index : state.index + 1,
    step: more ? state.step + 1 : 0,
    answered: undefined,
    shownAt: at,
  };
}

/** A drill or question card was finished: keep its result and move to the next card. */
function drilled(state: SessionState, result: DrillResult, at: number): SessionState {
  const card = state.cards?.[state.index];
  if (!(card?.drill || card?.question || card?.passage)) return state;
  return {
    ...state,
    index: state.index + 1,
    step: 0,
    drills: [...state.drills, { ...result, card: state.index }],
    shownAt: at,
  };
}

/** A grammar introduction card (G4) was read: move on, with nothing to record. */
function introduced(state: SessionState, at: number): SessionState {
  if (!state.cards?.[state.index]?.grammarIntro) return state;
  return { ...state, index: state.index + 1, step: 0, shownAt: at };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === 'loaded') {
    return { ...INITIAL, cards: action.cards, shownAt: action.at, startedAt: action.at };
  }
  if (action.type === 'restored') return { ...action.state, shownAt: action.at };
  if (action.type === 'introduced') return introduced(state, action.at);
  if (action.type === 'next') return advance(state, action.at);
  if (action.type === 'drilled') return drilled(state, action.result, action.at);
  if (state.answered) return state;
  const answered = { ...action.answered, card: state.index };
  return { ...state, answered, results: [...state.results, answered] };
}

/** The current card, reading or drill, or undefined when loading or done. */
export function currentCard(state: SessionState): SessionCard | undefined {
  return state.cards?.[state.index];
}

/** The card and target being read, or undefined when loading, done or on a drill. */
export function current(state: SessionState): { card: SessionCard; target: Target } | undefined {
  const card = state.cards?.[state.index];
  const target = card?.targets[state.step];
  return card && target ? { card, target } : undefined;
}

/** True when this is the card's last target, so "next" moves to a new sentence. */
export function lastStep(state: SessionState): boolean {
  const card = state.cards?.[state.index];
  return !card || state.step + 1 >= card.targets.length;
}
