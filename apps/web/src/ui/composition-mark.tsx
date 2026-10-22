/**
 * The pending segment, marked as a Japanese IME marks it (C6): a thin underline under the
 * kana the kanji popup may replace, a thick one and a soft fill under the part the highlighted
 * candidate replaces. A field cannot style part of its text, so a mirror with the field's box and
 * type lies over it, its text transparent and its scroll kept with the field's; only the marks
 * show. Enter (a pick) or Escape closes the popup, and the marks go with it. Its parent must be
 * positioned, as the popup's.
 */
import { type RefObject, useLayoutEffect, useRef } from 'react';
import type { KanjiCandidate } from '../domain/services/index.ts';
import { copyTextBox } from './caret-position.ts';
import styles from './composition-mark.module.css';
import type { JapaneseTyping } from './use-japanese-typing.ts';

type Field = HTMLInputElement | HTMLTextAreaElement;

export type MarkKind = 'plain' | 'pending' | 'selected';

export interface MarkPart {
  text: string;
  kind: MarkKind;
  /** Where the part starts in the text. */
  start: number;
}

/**
 * The text cut into plain, pending and selected parts: pending is every kana the candidates
 * cover, selected the highlighted candidate's.
 */
export function markParts(
  value: string,
  candidates: readonly KanjiCandidate[],
  index: number,
): MarkPart[] {
  const chosen = candidates[index];
  if (!chosen) return [{ text: value, kind: 'plain', start: 0 }];
  const start = Math.min(...candidates.map((c) => c.start));
  const end = Math.max(...candidates.map((c) => c.end));
  const cuts: [number, number, MarkKind][] = [
    [0, start, 'plain'],
    [start, chosen.start, 'pending'],
    [chosen.start, chosen.end, 'selected'],
    [chosen.end, end, 'pending'],
    [end, value.length, 'plain'],
  ];
  return cuts
    .filter(([from, to]) => to > from)
    .map(([from, to, kind]) => ({ text: value.slice(from, to), kind, start: from }));
}

/** Lays the mirror over the field, with its scroll, as the text, the window or the scroll change. */
function useOverlay(field: RefObject<Field | null>, deps: readonly unknown[]) {
  const mirror = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const [node, over] = [field.current, mirror.current];
    const layer = over?.parentElement;
    if (!node || !over || !layer) return;
    const place = () => {
      copyTextBox(getComputedStyle(node), over);
      const [box, room] = [node.getBoundingClientRect(), layer.getBoundingClientRect()];
      Object.assign(over.style, {
        top: `${box.top - room.top}px`,
        left: `${box.left - room.left}px`,
      });
      over.scrollTop = node.scrollTop;
      over.scrollLeft = node.scrollLeft;
    };
    place();
    node.addEventListener('scroll', place);
    window.addEventListener('resize', place);
    return () => {
      node.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
    };
  }, [field, ...deps]);
  return mirror;
}

/** The marks over the field while the kanji popup is open (C6). */
export function CompositionMark({ typing }: { typing: JapaneseTyping }) {
  const { candidates, popup, value } = typing;
  const mirror = useOverlay(typing.ref, [value, candidates, popup.index, popup.open]);
  if (!popup.open) return null;
  const single = typing.ref.current instanceof HTMLInputElement;
  return (
    <div className={styles.layer} aria-hidden="true">
      <div ref={mirror} className={styles.mirror} data-single={single || undefined} lang="ja">
        {markParts(value, candidates, popup.index).map((part) => (
          <span key={part.start} className={styles[part.kind]} data-segment={part.kind}>
            {part.text}
          </span>
        ))}
      </div>
    </div>
  );
}
