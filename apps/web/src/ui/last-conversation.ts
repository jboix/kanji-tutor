/**
 * The last conversation with the tutor, kept in this browser so the Tutor tab can offer to
 * carry it on. A convenience: storage may be unavailable, and then there is nothing to carry on.
 */
import type { AnsweredTurn, TutorTopic } from './slots.tsx';

export interface LastConversation {
  topic: TutorTopic;
  turns: AnsweredTurn[];
  /** When it last went on, in ms. */
  at: number;
}

/** Under the app's first name, like its other keys. */
const KEY = 'kanji-reader:tutor-last';

/** The most turns kept: the tutor gets the last four with each question anyway. */
const KEPT_TURNS = 8;

function isTurn(value: unknown): value is AnsweredTurn {
  if (typeof value !== 'object' || value === null) return false;
  const turn = value as Partial<AnsweredTurn>;
  return typeof turn.question === 'string' && typeof turn.answer?.answer === 'string';
}

function isConversation(value: unknown): value is LastConversation {
  if (typeof value !== 'object' || value === null) return false;
  const saved = value as Partial<LastConversation>;
  const turns = Array.isArray(saved.turns) && saved.turns.length > 0 && saved.turns.every(isTurn);
  return turns && typeof saved.at === 'number' && typeof saved.topic?.about === 'string';
}

export function loadLastConversation(): LastConversation | undefined {
  try {
    const value: unknown = JSON.parse(globalThis.localStorage?.getItem(KEY) ?? 'null');
    return isConversation(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function saveLastConversation(conversation: LastConversation): void {
  try {
    const kept = { ...conversation, turns: conversation.turns.slice(-KEPT_TURNS) };
    globalThis.localStorage?.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Storage blocked (private mode): nothing to carry on later.
  }
}
