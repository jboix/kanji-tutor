import { type ReactNode, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './bottom-sheet.module.css';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import { IconButton } from './icon-button.tsx';
import { CloseIcon } from './icons.tsx';
import { useFocusTrap } from './use-focus-trap.ts';
import { useSheetDrag } from './use-sheet-drag.ts';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog, e.g. "間に in this sentence". */
  label: string;
  /** Left of the close button, e.g. `<SheetHeading>`. */
  header?: ReactNode;
  /** Shown on the scrim above the sheet, e.g. the sentence with the word highlighted. */
  context?: ReactNode;
  closeLabel?: string;
  children: ReactNode;
}

/**
 * A modal sheet from the bottom (explain.html). Escape, the close button, the scrim and a drag
 * down from the handle (or the content at its top, U10) close it.
 */
export function BottomSheet(props: BottomSheetProps) {
  if (!props.open) return null;
  return createPortal(<OpenSheet {...props} />, document.body);
}

function OpenSheet({ onClose, label, header, context, closeLabel, children }: BottomSheetProps) {
  const sheet = useRef<HTMLDivElement>(null);
  const t = useT();
  useFocusTrap(sheet, true, onClose);
  useSheetDrag(sheet, onClose);
  return (
    <div className={styles.overlay}>
      <button type="button" className={styles.scrim} tabIndex={-1} aria-hidden onClick={onClose} />
      {context !== undefined && <div className={styles.context}>{context}</div>}
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cx(styles.sheet, context !== undefined && styles.fill)}
      >
        <div className={styles.handle} data-sheet-handle="" aria-hidden="true" />
        <div className={cx(styles.head, header === undefined && styles.bare)}>
          {header !== undefined && <div className={styles.headMain}>{header}</div>}
          <IconButton aria-label={closeLabel ?? t('common.close')} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

/** The big word and its gloss line at the top of a word sheet (explain.html). */
export function SheetHeading({ word, children }: { word: ReactNode; children?: ReactNode }) {
  return (
    <>
      <div lang="ja" className={styles.word}>
        {word}
      </div>
      {children !== undefined && <div className={styles.gloss}>{children}</div>}
    </>
  );
}
