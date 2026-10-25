/** The pages of a new scan as thumbnails, each removable, and the tile that adds one. */
import { type RefObject, useRef } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import { CameraIcon, CloseIcon, PlusIcon } from '../../ui/icons.tsx';
import { useObjectUrl } from '../../ui/photo-sheet.tsx';
import styles from './capture.module.css';
import type { ImportPage } from './read-pages.ts';

/** A page's picture: the photo, or the first lines of pasted text. */
export function PageThumb(props: { photo?: Blob | undefined; text?: string; label: string }) {
  const url = useObjectUrl(props.photo);
  if (url) return <img className={styles.thumbImage} src={url} alt={props.label} />;
  return (
    <span role="img" aria-label={props.label} className={styles.thumbText} lang="ja">
      {props.text ?? ''}
    </span>
  );
}

let pageCount = 0;

/** Pages from picked files, each with an id of its own. */
export function photoPages(files: FileList | null): ImportPage[] {
  return [...(files ?? [])].map((file) => {
    pageCount += 1;
    return { id: `page-${pageCount}`, kind: 'photo', file };
  });
}

export function textPage(text: string): ImportPage {
  pageCount += 1;
  return { id: `page-${pageCount}`, kind: 'text', text };
}

interface InputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  camera: boolean;
  onPages: (pages: ImportPage[]) => void;
}

/** A hidden image input; a visible button opens it. Cleared after each pick. */
function HiddenInput({ inputRef, camera, onPages }: InputProps) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple={!camera}
      {...(camera ? { capture: 'environment' as const } : {})}
      className={styles.hidden}
      tabIndex={-1}
      aria-hidden="true"
      data-testid={camera ? 'camera-input' : 'library-input'}
      onChange={(event) => {
        const pages = photoPages(event.currentTarget.files);
        event.currentTarget.value = '';
        if (pages.length > 0) onPages(pages);
      }}
    />
  );
}

/** The camera and library inputs, and the presses that open them. */
export function usePickers(onPages: (pages: ImportPage[]) => void) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const inputs = (
    <>
      <HiddenInput inputRef={camera} camera onPages={onPages} />
      <HiddenInput inputRef={library} camera={false} onPages={onPages} />
    </>
  );
  return {
    inputs,
    openCamera: () => camera.current?.click(),
    openLibrary: () => library.current?.click(),
  };
}

function PageTile({ page, n, onRemove }: { page: ImportPage; n: number; onRemove: () => void }) {
  const t = useT();
  const label = page.kind === 'photo' ? t('capture.photoOf', { n }) : t('capture.pastedOf', { n });
  return (
    <li className={styles.tile}>
      <span className={styles.thumb}>
        {page.kind === 'photo' ? (
          <PageThumb photo={page.file} label={label} />
        ) : (
          <PageThumb text={page.text} label={label} />
        )}
      </span>
      <span className={styles.tileLabel}>{t('capture.pageN', { n })}</span>
      <button
        type="button"
        className={styles.remove}
        aria-label={t('capture.removePage', { n })}
        onClick={onRemove}
      >
        <CloseIcon />
      </button>
    </li>
  );
}

export interface PageGridProps {
  pages: readonly ImportPage[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export function PageGrid({ pages, onRemove, onAdd }: PageGridProps) {
  const t = useT();
  return (
    <ul className={styles.grid}>
      {pages.map((page, i) => (
        <PageTile key={page.id} page={page} n={i + 1} onRemove={() => onRemove(page.id)} />
      ))}
      <li>
        <button type="button" className={styles.addTile} onClick={onAdd}>
          <PlusIcon />
          {t('capture.addPage')}
        </button>
      </li>
    </ul>
  );
}

/** "Take photos" and "From your photos": picking sends nothing; reading the pages does. */
export function PickButtons(props: { onCamera: () => void; onLibrary: () => void }) {
  const t = useT();
  return (
    <div className={styles.pickRow}>
      <button type="button" className={styles.pick} onClick={props.onCamera}>
        <CameraIcon />
        {t('capture.takePhotos')}
      </button>
      <button type="button" className={styles.pick} onClick={props.onLibrary}>
        <PlusIcon />
        {t('capture.fromPhotos')}
      </button>
    </div>
  );
}
