/**
 * A photographed page, shown as large as the screen allows in a sheet: a scanned lesson's page,
 * opened from its lesson or from a handout question.
 */
import { useEffect, useState } from 'react';
import { BottomSheet } from './bottom-sheet.tsx';
import styles from './photo-sheet.module.css';

/** A blob as an object URL, revoked when it changes or the component unmounts. */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob || typeof URL.createObjectURL !== 'function') return;
    let next: string;
    try {
      next = URL.createObjectURL(blob);
    } catch {
      // A blob this browser cannot show: the caller keeps its placeholder.
      return;
    }
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

export interface PhotoSheetProps {
  photo: Blob | undefined;
  /** The sheet's name and the image's text, e.g. "Page 3 of your handout". */
  label: string;
  onClose: () => void;
  /** Shown instead when there is no photo (pasted text): the page's lines. */
  text?: string | undefined;
}

export function PhotoSheet({ photo, label, onClose, text }: PhotoSheetProps) {
  const url = useObjectUrl(photo);
  return (
    <BottomSheet open label={label} onClose={onClose}>
      <div className={styles.body}>
        {url ? (
          <img className={styles.photo} src={url} alt={label} />
        ) : (
          <p lang="ja" className={styles.text}>
            {text}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
