import {
  type CSSProperties,
  type MouseEvent,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { caretBox, placePopup, visibleTop } from './caret-position.ts';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import type { PlainKey } from './i18n/types.ts';
import styles from './kanji-candidates.module.css';
import {
  type JapaneseTyping,
  type KanaMode,
  nextKanaMode,
  type TypingMode,
} from './use-japanese-typing.ts';

/** A tap on the popup must not take the focus from the field, or the phone keyboard closes. */
const keepFocus = (event: MouseEvent) => event.preventDefault();

type Field = HTMLInputElement | HTMLTextAreaElement;

/** Hidden until it is measured, so it never flashes at the wrong place. */
const UNPLACED: CSSProperties = { visibility: 'hidden', top: 0, left: 0 };

function measure(field: Field, popup: HTMLElement, anchor: number): CSSProperties {
  const layer = popup.parentElement;
  if (!layer) return UNPLACED;
  const caret = caretBox(field, anchor);
  const [box, room] = [field.getBoundingClientRect(), layer.getBoundingClientRect()];
  const { top, left } = placePopup({
    caret: {
      ...caret,
      top: box.top - room.top + caret.top,
      left: box.left - room.left + caret.left,
    },
    size: { width: popup.offsetWidth, height: popup.offsetHeight },
    width: layer.clientWidth,
    above: box.top + caret.top - visibleTop(field),
  });
  return { top, left };
}

/** Keeps the popup by the character at `anchor`, as the text, the scroll or the window change. */
function usePlacement(field: RefObject<Field | null>, anchor: number, deps: readonly unknown[]) {
  const popup = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>(UNPLACED);
  useLayoutEffect(() => {
    const [node, list] = [field.current, popup.current];
    if (!node || !list) return;
    const place = () => setStyle(measure(node, list, anchor));
    place();
    node.addEventListener('scroll', place);
    window.addEventListener('resize', place);
    return () => {
      node.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
    };
  }, [field, anchor, ...deps]);
  return { popup, style };
}

/**
 * The kanji popup (C6): spellings for the kana being typed, from the local dictionary, the
 * learner's own words first, as a line of characters right above that kana (below it when there
 * is no room). The focus stays in the field, which points at the highlighted option. Its parent
 * must be positioned: the popup is laid out against it.
 */
export function KanjiCandidatePopup({ typing }: { typing: JapaneseTyping }) {
  const { candidates, popup } = typing;
  const anchor = Math.min(...candidates.map((candidate) => candidate.start));
  const placed = usePlacement(typing.ref, anchor, [typing.value, candidates, popup.open]);
  const t = useT();
  const kana = candidates[0]?.kana;
  if (!popup.open || !kana) return null;
  return (
    <div className={styles.layer}>
      <div
        ref={placed.popup}
        role="listbox"
        id={popup.listId}
        aria-label={t('ui.kanjiFor', { kana })}
        className={styles.popup}
        style={placed.style}
        onMouseDown={keepFocus}
      >
        {candidates.map((candidate, index) => (
          <CandidateOption
            key={`${candidate.start}:${candidate.form}`}
            typing={typing}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function CandidateOption({ typing, index }: { typing: JapaneseTyping; index: number }) {
  const candidate = typing.candidates[index];
  if (!candidate) return null;
  return (
    <div
      role="option"
      id={typing.popup.optionId(index)}
      aria-selected={index === typing.popup.index}
      lang="ja"
      tabIndex={-1}
      className={cx(styles.option, candidate.known && styles.known)}
      data-kana={candidate.kana}
      onClick={() => typing.pick(candidate)}
      onKeyDown={typing.handlers.onKeyDown}
    >
      {candidate.form}
    </div>
  );
}

const MODE_GLYPH: Record<TypingMode, string> = {
  hiragana: 'あ',
  katakana: 'ア',
  off: 'A',
  native: 'IME',
};

const MODE_LABEL = {
  hiragana: 'ui.kanaModeHiragana',
  katakana: 'ui.kanaModeKatakana',
  off: 'ui.kanaModeOff',
  native: 'ui.kanaModeNative',
} as const satisfies Record<TypingMode, PlainKey>;

interface KanaToggleProps {
  mode: TypingMode;
  onChange: (mode: KanaMode) => void;
}

/**
 * The あ switch of the sentence field (C6): あ hiragana → ア katakana → A romaji as
 * typed, one press each. "IME" while the phone's or computer's Japanese keyboard types; a press
 * turns ours back on. Its name says the mode.
 */
export function KanaToggle({ mode, onChange }: KanaToggleProps) {
  const t = useT();
  return (
    <button
      type="button"
      className={styles.toggle}
      data-mode={mode}
      aria-label={t(MODE_LABEL[mode])}
      onMouseDown={keepFocus}
      onClick={() => onChange(nextKanaMode(mode))}
    >
      <span lang={mode === 'hiragana' || mode === 'katakana' ? 'ja' : undefined} aria-hidden="true">
        {MODE_GLYPH[mode]}
      </span>
    </button>
  );
}

/** The Ask box's あ switch (C6): romaji typed in the field turns into kana while it is on. */
export function KanaSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const t = useT();
  return (
    <button
      type="button"
      className={styles.toggle}
      data-mode={on ? 'hiragana' : 'off'}
      aria-pressed={on}
      aria-label={t('ui.kanaTyping')}
      onMouseDown={keepFocus}
      onClick={() => onChange(!on)}
    >
      <span lang="ja" aria-hidden="true">
        あ
      </span>
    </button>
  );
}
