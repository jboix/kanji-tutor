/**
 * Where a character of a text field is drawn (C6), so the kanji popup can sit by the kana being
 * typed. A hidden mirror copies the field's box and text styles; a span at the index shows where
 * the browser lays that character out.
 */

type Field = HTMLInputElement | HTMLTextAreaElement;

/** A character's box, relative to the field's border box (its scroll taken off). */
export interface CaretBox {
  top: number;
  left: number;
  height: number;
}

/** The styles that decide where text wraps and how wide it is. */
const MIRRORED = [
  'box-sizing',
  'width',
  'height',
  'overflow-y',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-style',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'font-style',
  'font-variant',
  'font-weight',
  'font-stretch',
  'font-size',
  'font-family',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-align',
  'text-indent',
  'text-transform',
  'tab-size',
  'overflow-wrap',
  'word-break',
  'direction',
] as const;

/** Gives `target` the field's box and text styles, so its text wraps and sits as the field's. */
export function copyTextBox(style: CSSStyleDeclaration, target: HTMLElement): void {
  for (const name of MIRRORED) target.style.setProperty(name, style.getPropertyValue(name));
}

function mirrorOf(field: Field, style: CSSStyleDeclaration): HTMLDivElement {
  const mirror = document.createElement('div');
  copyTextBox(style, mirror);
  const single = field instanceof HTMLInputElement;
  Object.assign(mirror.style, {
    position: 'absolute',
    top: '0',
    left: '-9999px',
    visibility: 'hidden',
    whiteSpace: single ? 'pre' : 'pre-wrap',
    overflow: single ? 'hidden' : mirror.style.overflowY,
  });
  return mirror;
}

/** The box of the character at `index` in `field` (the caret's place when it sits there). */
export function caretBox(field: Field, index: number): CaretBox {
  const style = getComputedStyle(field);
  const mirror = mirrorOf(field, style);
  mirror.textContent = field.value.slice(0, index);
  const mark = document.createElement('span');
  // The rest of the text keeps the wrapping as the field has it; a dot stands in at the end.
  mark.textContent = field.value.slice(index) || '.';
  mirror.append(mark);
  document.body.append(mirror);
  const box = {
    top: mark.offsetTop + (Number.parseFloat(style.borderTopWidth) || 0) - field.scrollTop,
    left: mark.offsetLeft + (Number.parseFloat(style.borderLeftWidth) || 0) - field.scrollLeft,
    height: mark.offsetHeight,
  };
  mirror.remove();
  return box;
}

/** Space kept between the popup and the text. */
const GAP = 4;

export interface PopupRoom {
  /** The character the popup points at, relative to the popup's containing block. */
  caret: CaretBox;
  /** The popup's own size. */
  size: { width: number; height: number };
  /** The containing block's width: the popup never reaches past it. */
  width: number;
  /** Visible space from the top of the character up to the top of the scroll area. */
  above: number;
}

/** The popup's place: just above the character, below it when there is no room above. */
export function placePopup({ caret, size, width, above }: PopupRoom) {
  const below = above < size.height + GAP;
  const top = below ? caret.top + caret.height + GAP : caret.top - size.height - GAP;
  const left = Math.max(0, Math.min(caret.left, width - size.width));
  return { top, left, below };
}

/** The top of the area `node` scrolls in (the viewport's top when nothing scrolls). */
export function visibleTop(node: HTMLElement): number {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return Math.max(0, parent.getBoundingClientRect().top);
    }
  }
  return 0;
}
