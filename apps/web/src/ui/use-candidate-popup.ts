/**
 * Keys for the kanji popup (C6), the way an IME's candidate window takes them while the
 * focus stays in the field. The first candidate is highlighted as soon as the popup opens, so
 * Enter turns the kana into it; ↓ and ↑ move from there (never past either end), Escape closes
 * and keeps the kana, Tab closes and moves on. ←/→ move the highlight too while the kana was just
 * typed, or once ↓/↑ moved it; when the popup opened because the caret moved, they keep moving
 * the caret. Space is left to the field: it types a space.
 */
import { type KeyboardEvent, useId, useState } from 'react';
import type { KanjiCandidate } from '../domain/services/index.ts';

/** What a key does to the popup; undefined leaves the key to the field. */
export type PopupKey = { highlight: number } | { pick: number } | { close: true; keep?: true };

const NEXT: Record<string, 1 | -1> = { ArrowDown: 1, ArrowUp: -1, ArrowRight: 1, ArrowLeft: -1 };
const SIDEWAYS = new Set(['ArrowLeft', 'ArrowRight']);

/** Where the popup's state stands for a key. */
export interface PopupAt {
  /** The highlighted candidate. */
  index: number;
  count: number;
  /** ←/→ move the highlight (the kana was just typed, or ↓/↑ moved it). */
  sideways: boolean;
}

function step(key: string, { index, count, sideways }: PopupAt): PopupKey | undefined {
  const by = NEXT[key];
  if (!by || (!sideways && SIDEWAYS.has(key))) return undefined;
  return { highlight: Math.min(count - 1, Math.max(0, index + by)) };
}

/** The popup's answer to `key` with `at.count` candidates showing (none while closed). */
export function popupKey(key: string, at: PopupAt): PopupKey | undefined {
  if (at.count === 0) return undefined;
  if (key === 'Escape') return { close: true };
  // Tab closes the popup and moves on as usual.
  if (key === 'Tab') return { close: true, keep: true };
  if (key === 'Enter') return { pick: at.index };
  return step(key, at);
}

interface PopupState {
  /** The candidates this state is about: new candidates start again, open, on the first. */
  of: readonly KanjiCandidate[];
  index: number;
  closed: boolean;
  sideways: boolean;
}

/** Keys with a modifier, or inside an IME composition, belong to the field or the IME. */
const ownKey = (event: KeyboardEvent) =>
  !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) &&
  !event.nativeEvent.isComposing;

interface KeyContext {
  state: PopupState;
  /** The candidates showing: none while the popup is closed. */
  count: number;
  pick: (index: number) => void;
  save: (state: PopupState) => void;
}

/** The state a key that neither picks nor leaves the key to the field moves to. */
function settle(state: PopupState, action: Exclude<PopupKey, { pick: number }>): PopupState {
  if ('close' in action) return { ...state, closed: true };
  return { ...state, index: action.highlight, sideways: true };
}

/** The field's key handler: keys the popup takes do not reach the field (or a form or sheet). */
function handleKey(event: KeyboardEvent, { state, count, pick, save }: KeyContext) {
  const at = { index: state.index, count, sideways: state.sideways };
  const action = ownKey(event) ? popupKey(event.key, at) : undefined;
  if (!action) return;
  if (!('keep' in action)) event.preventDefault();
  event.stopPropagation();
  if ('pick' in action) pick(action.pick);
  else save(settle(state, action));
}

const startState = (of: readonly KanjiCandidate[], typed: boolean): PopupState => ({
  of,
  index: 0,
  closed: false,
  sideways: typed,
});

/** Where the candidates come from. */
export interface CandidateSource {
  /** They follow kana just typed, not a caret move: ←/→ choose from the start. */
  typed?: boolean;
  /** They are for the text as it is now; until then the popup shows but takes no key. */
  fresh?: boolean;
}

/**
 * The popup's state and the field's key handler and ARIA (listbox, aria-activedescendant on the
 * highlighted option).
 */
export function useCandidatePopup(
  candidates: readonly KanjiCandidate[],
  pick: (candidate: KanjiCandidate) => void,
  { typed = false, fresh = true }: CandidateSource = {},
) {
  const listId = useId();
  const [saved, save] = useState<PopupState>(() => startState(candidates, typed));
  const state = saved.of === candidates ? saved : startState(candidates, typed);
  const open = candidates.length > 0 && !state.closed;
  const optionId = (index: number) => `${listId}-${index}`;
  const choose = (index: number) => {
    const chosen = candidates[index];
    if (chosen) pick(chosen);
  };
  const context = { state, count: open && fresh ? candidates.length : 0, pick: choose, save };
  const field = {
    onKeyDown: (event: KeyboardEvent) => handleKey(event, context),
    'aria-autocomplete': 'list' as const,
    'aria-controls': open ? listId : undefined,
    'aria-activedescendant': open ? optionId(state.index) : undefined,
  };
  return { open, index: open ? state.index : -1, listId, optionId, field };
}
