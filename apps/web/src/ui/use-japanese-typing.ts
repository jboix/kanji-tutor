/**
 * Typing Japanese in a free text field (C6): romaji turns into hiragana or katakana as it is
 * typed (not during an IME composition), and a popup of kanji spellings from the local
 * dictionary follows the hiragana just before the caret, or the selected hiragana. A pick
 * replaces that kana and keeps the caret after it.
 */
import {
  type ChangeEvent,
  type CompositionEvent,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { applyCandidate, type KanjiCandidate, kanjiCandidates } from '../domain/services/index.ts';
import { type KanaScript, toKanaIn } from '../lang/kana.ts';
import { useServices } from './services.tsx';
import { useCandidatePopup } from './use-candidate-popup.ts';

type Field = HTMLInputElement | HTMLTextAreaElement;

interface Selection {
  start: number;
  end: number;
}

/** Lookups wait for this pause in typing. */
const LOOKUP_DELAY_MS = 80;

/** What romaji typed in the field becomes (C6): hiragana, katakana, or itself (`off`). */
export type KanaMode = KanaScript | 'off';

/**
 * A field's mode, `native` too: the device's Japanese keyboard (an OS IME) types, and the field
 * converts nothing, marks nothing and offers no kanji (D112).
 */
export type TypingMode = KanaMode | 'native';

const NEXT_MODE: Record<TypingMode, KanaMode> = {
  hiragana: 'katakana',
  katakana: 'off',
  off: 'hiragana',
  native: 'hiragana',
};

/** The あ switch's next mode: あ → ア → A → あ; from the native keyboard, back to あ. */
export function nextKanaMode(mode: TypingMode): KanaMode {
  return NEXT_MODE[mode];
}

const isScript = (mode: TypingMode): mode is KanaScript =>
  mode === 'hiragana' || mode === 'katakana';

/** The text as sent: romaji left over (a trailing "n") becomes kana in the field's mode. */
export function finalText(value: string, mode: TypingMode): string {
  return isScript(mode) ? toKanaIn(value, mode, true) : value;
}

/** Kana or kanji: what a Japanese keyboard types, and romaji never does. */
const JAPANESE = /[\u3040-\u30ff\u3400-\u9fff]/u;

/**
 * True when an input event came from a Japanese keyboard (D112): typed or composed text that is
 * already Japanese. A paste, a drop or our own conversion is not.
 */
export function nativeInput(event: { inputType?: string; data?: string | null }): boolean {
  const typed = ['insertText', 'insertCompositionText', 'insertReplacementText'];
  return typed.includes(event.inputType ?? '') && JAPANESE.test(event.data ?? '');
}

/** Romaji on both sides of the caret as kana, and where the caret lands after it. */
export function kanaEdit(
  raw: string,
  caret: number,
  script: KanaScript = 'hiragana',
): { text: string; caret: number } {
  const before = toKanaIn(raw.slice(0, caret), script);
  return { text: before + toKanaIn(raw.slice(caret), script), caret: before.length };
}

function selectionOf(field: Field): Selection {
  const start = field.selectionStart ?? field.value.length;
  return { start, end: field.selectionEnd ?? start };
}

/**
 * Follows the selection however it changes, by keys, a long press or a drag: React's onSelect
 * misses some of these in a real browser.
 */
function useSelectionWatch(ref: RefObject<Field | null>, follow: (field: Field) => void) {
  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    const update = () => document.activeElement === field && follow(field);
    const targets = [field, document];
    for (const target of targets) target.addEventListener('selectionchange', update);
    field.addEventListener('select', update);
    return () => {
      for (const target of targets) target.removeEventListener('selectionchange', update);
      field.removeEventListener('select', update);
    };
  }, [ref, follow]);
}

const same = (a: Selection, b: Selection) => a.start === b.start && a.end === b.end;

/** Candidates found, and whether the text changed since the last lookup (typing, not a move). */
interface Found {
  list: KanjiCandidate[];
  typed: boolean;
  /** The lookup is for the text and selection as they are now (not one still to come back). */
  fresh: boolean;
}

const NONE: Found = { list: [], typed: false, fresh: true };

/** The text and selection a lookup was for. */
const lookupKey = (text: string, { start, end }: Selection) => `${start}:${end}:${text}`;

/**
 * Candidates for the text and selection, looked up after a short pause. The last ones stay on
 * screen meanwhile (no flicker), but are not `fresh`: a key pressed in the pause (Enter) never
 * picks a candidate for kana that has moved on.
 */
function useCandidates(text: string, { start, end }: Selection): Found {
  const { repos } = useServices();
  const [found, setFound] = useState({ list: NONE.list, typed: false, key: '' });
  const looked = useRef(text);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      const typed = looked.current !== text;
      looked.current = text;
      const key = lookupKey(text, { start, end });
      void kanjiCandidates(repos, text, { start, end }).then((list) => {
        if (live) setFound({ list, typed, key });
      });
    }, LOOKUP_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [repos, text, start, end]);
  if (text === '') return NONE;
  return {
    list: found.list,
    typed: found.typed,
    fresh: found.key === lookupKey(text, { start, end }),
  };
}

/** Places the caret after a change made here, once the field shows the new value. */
function useCaret<E extends Field>(value: string) {
  const ref = useRef<E>(null);
  const caret = useRef<number | undefined>(undefined);
  useLayoutEffect(() => {
    const at = caret.current;
    if (at === undefined || !ref.current || ref.current.value !== value) return;
    caret.current = undefined;
    ref.current.setSelectionRange(at, at);
  }, [value]);
  return { ref, caret };
}

/** The field's selection, kept up to date (`follow` reads it from the field). */
function useSelection(ref: RefObject<Field | null>, initial: number) {
  const [selection, setSelection] = useState<Selection>({ start: initial, end: initial });
  const follow = useCallback((field: Field) => {
    const next = selectionOf(field);
    setSelection((prev) => (same(prev, next) ? prev : next));
  }, []);
  useSelectionWatch(ref, follow);
  return { selection, setSelection, follow };
}

/** A pick replaces its kana, if the kana is still there, and keeps the focus in the field. */
function picker(
  value: string,
  place: (text: string, at: number) => void,
  ref: RefObject<Field | null>,
) {
  return (candidate: KanjiCandidate) => {
    if (value.slice(candidate.start, candidate.end) !== candidate.kana) return;
    const next = applyCandidate(value, candidate);
    place(next.text, next.caret);
    ref.current?.focus();
  };
}

export interface TypingOptions {
  /** Called when a Japanese keyboard types in the field (D112); only the sentence field asks. */
  onNative?: (() => void) | undefined;
}

const NO_CANDIDATES: KanjiCandidate[] = [];

/** The field's handlers and ARIA, the candidates for its kana, their popup, and `pick`. */
export function useJapaneseTyping<E extends Field>(
  value: string,
  setValue: (text: string) => void,
  mode: TypingMode,
  options: TypingOptions = {},
) {
  const { ref, caret } = useCaret<E>(value);
  const composing = useComposing();
  const { selection, setSelection, follow } = useSelection(ref, value.length);
  const place = useCallback(
    (text: string, at: number) => {
      caret.current = at;
      setSelection({ start: at, end: at });
      setValue(text);
    },
    [caret, setValue, setSelection],
  );
  // Mid-composition the IME owns the text: it is kept as typed and converted once committed.
  const busy = composing.ref;
  const update = useCallback(
    (field: Field) => {
      const at = selectionOf(field).start;
      const next = isScript(mode) && !busy.current ? kanaEdit(field.value, at, mode) : undefined;
      place(next?.text ?? field.value, next?.caret ?? at);
    },
    [mode, place, busy],
  );
  const found = useCandidates(value, selection);
  // A Japanese keyboard, or its composition in progress, has its own candidates: none of ours.
  // Only the sentence field watches for one (D113); the Ask box keeps its popup as it was.
  const quiet = mode === 'native' || (options.onNative !== undefined && composing.now);
  const candidates = useStanding(found.list, value, quiet);
  const pick = picker(value, place, ref);
  const popup = useCandidatePopup(candidates, pick, found);
  const handlers = { ...useHandlers(composing, update, follow, options.onNative), ...popup.field };
  return { ref, value, handlers, candidates, popup, pick };
}

/**
 * The candidates whose kana is still where it was: a lookup still to come back may be for text
 * that moved on (a pick, a deletion), and those must neither show nor mark (D112).
 */
function useStanding(list: KanjiCandidate[], value: string, quiet: boolean): KanjiCandidate[] {
  return useMemo(() => {
    if (quiet) return NO_CANDIDATES;
    const kept = list.filter((c) => value.slice(c.start, c.end) === c.kana);
    return kept.length === list.length ? list : kept;
  }, [list, value, quiet]);
}

/** Whether an IME composition is under way: a ref for handlers, `now` for rendering. */
function useComposing() {
  const ref = useRef(false);
  const [now, setNow] = useState(false);
  const set = useCallback((on: boolean) => {
    ref.current = on;
    setNow(on);
  }, []);
  return { ref, now, set };
}

type Composing = ReturnType<typeof useComposing>;

export type JapaneseTyping = ReturnType<typeof useJapaneseTyping>;

function useHandlers(
  composing: Composing,
  update: (field: Field) => void,
  follow: (field: Field) => void,
  onNative: (() => void) | undefined,
) {
  return {
    onChange: (event: ChangeEvent<Field>) => {
      if (onNative && nativeInput(event.nativeEvent as InputEvent)) onNative();
      update(event.target);
    },
    onSelect: (event: SyntheticEvent<Field>) => follow(event.currentTarget),
    onCompositionStart: () => composing.set(true),
    // Composing alone is no sign: Android keyboards compose Latin words too. Japanese text is.
    onCompositionUpdate: (event: CompositionEvent<Field>) => {
      if (onNative && JAPANESE.test(event.data ?? '')) onNative();
    },
    onCompositionEnd: (event: CompositionEvent<Field>) => {
      if (onNative && JAPANESE.test(event.data ?? '')) onNative();
      composing.set(false);
      update(event.currentTarget);
    },
  };
}
