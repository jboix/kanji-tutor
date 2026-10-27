/**
 * A photo on the whole screen, over everything, on black: pinch or double-tap to zoom, drag to
 * look around once zoomed, and the close button (or Escape) to go back. A photo this phone can
 * no longer read says so instead of showing a broken image.
 */
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from './i18n/i18n.tsx';
import { CloseIcon } from './icons.tsx';
import styles from './photo-viewer.module.css';
import { useFocusTrap } from './use-focus-trap.ts';
import { usePinchZoom } from './use-pinch-zoom.ts';

export interface PhotoViewerProps {
  /** The photo's object URL. */
  url: string;
  /** The viewer's name and the image's text, e.g. "Page 3 of your handout". */
  label: string;
  onClose: () => void;
}

function Viewer({ url, label, onClose }: PhotoViewerProps) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const { zoom, handlers } = usePinchZoom();
  const [broken, setBroken] = useState(false);
  useFocusTrap(root, true, onClose);
  const transform = `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
  return (
    <div ref={root} className={styles.viewer} role="dialog" aria-modal="true" aria-label={label}>
      <div className={styles.stage} data-testid="photo-stage" {...handlers}>
        {broken ? (
          <p className={styles.broken}>{t('ui.photoBroken')}</p>
        ) : (
          <img
            className={styles.photo}
            src={url}
            alt={label}
            style={{ transform }}
            draggable={false}
            onError={() => setBroken(true)}
          />
        )}
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label={t('common.close')}
        onClick={onClose}
      >
        <CloseIcon />
      </button>
      <p className={styles.hint}>{t('ui.photoZoomHint')}</p>
    </div>
  );
}

/** The viewer (see the module comment). */
export function PhotoViewer(props: PhotoViewerProps) {
  return createPortal(<Viewer {...props} />, document.body);
}
