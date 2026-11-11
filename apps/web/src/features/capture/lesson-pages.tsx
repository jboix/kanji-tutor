/**
 * A scanned lesson's pages as they are printed (scans/Lesson): each page under its number and
 * kind, its photo a tap away, then its blocks in order: a heading, an instruction, an exercise,
 * a list, a text. Any printed line can be tapped to ask the tutor about it. A page stored without
 * its order shows its lines, then its exercises, and says so.
 */
import { useState } from 'react';
import type { ScanPage } from '../../domain/scan-types.ts';
import { type BlockView, type PageView, scanPages } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PhotoSheet } from '../../ui/photo-sheet.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { Exercise, Unsupported } from './lesson-exercise.tsx';
import { BlockLines, type LineAsk, useSelectedLine } from './lesson-lines.tsx';
import styles from './lesson-pages.module.css';
import { PageThumb } from './page-grid.tsx';
import { CheckLines } from './review-pages.tsx';
import { KIND_LABELS } from './scan-copy.ts';
import type { ReviewModel } from './use-draft-review.ts';

interface BlockProps {
  block: BlockView;
  page: number;
  model: ReviewModel;
  ask: LineAsk;
  onPhoto: (() => void) | undefined;
}

function Block({ block, page, model, ask, onPhoto }: BlockProps) {
  const t = useT();
  if (block.kind === 'exercise') return <Exercise block={block} page={page} model={model} />;
  if (block.kind === 'unsupported') {
    return <Unsupported block={block} page={page} ask={ask} onPhoto={onPhoto} />;
  }
  return (
    <div className={cx(styles.block, styles[block.kind])}>
      {block.kind === 'instruction' && (
        <span className={styles.blockLabel}>{t('capture.instruction')}</span>
      )}
      <BlockLines page={page} lines={block.lines} ask={ask} />
    </div>
  );
}

const textOf = (page: ScanPage) => page.lines.map((line) => line.text).join('\n');

/** "Photo", with the page's thumbnail: opens it full screen. */
function PhotoButton({ page, n, onOpen }: { page: ScanPage; n: number; onOpen: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      className={styles.photoButton}
      aria-label={t('capture.seePhoto', { n })}
      onClick={onOpen}
    >
      <span className={styles.photoThumb}>
        <PageThumb photo={page.photo} text={textOf(page)} label="" />
      </span>
      {t('capture.photo')}
    </button>
  );
}

interface PageProps {
  view: PageView;
  page: ScanPage;
  model: ReviewModel;
  ask: LineAsk;
}

function PageSection({ view, page, model, ask }: PageProps) {
  const t = useT();
  const [photo, setPhoto] = useState(false);
  const n = view.index + 1;
  const title = t('capture.pageHead', { n, kind: t(KIND_LABELS[view.kind]) });
  const onPhoto = page.photo ? () => setPhoto(true) : undefined;
  const label = t('capture.pageN', { n });
  return (
    <section aria-label={title} className={styles.page}>
      <div className={styles.pageHead}>
        <SectionLabel as="h2">{title}</SectionLabel>
        <PhotoButton page={page} n={n} onOpen={() => setPhoto(true)} />
      </div>
      {view.blocks.map((block) => (
        <Block
          key={block.index}
          block={block}
          page={view.index}
          model={model}
          ask={ask}
          onPhoto={onPhoto}
        />
      ))}
      {view.unordered && <p className={styles.note}>{t('capture.pageUnordered')}</p>}
      {photo && (
        <PhotoSheet
          photo={page.photo}
          text={textOf(page)}
          label={label}
          onClose={() => setPhoto(false)}
        />
      )}
    </section>
  );
}

export function LessonPages({ model }: { model: ReviewModel }) {
  const ask = useSelectedLine(model.lesson.lesson);
  return (
    <>
      {scanPages(model.lesson).map((view) => {
        const page = model.lesson.pages[view.index];
        if (!page) return null;
        return <PageSection key={view.index} view={view} page={page} model={model} ask={ask} />;
      })}
      <CheckLines model={model} />
    </>
  );
}
