/**
 * "The pages" of the review: each page's kind as the tutor read it, with a Change control, what
 * was found on it, and the path to check the lines the tutor was unsure of.
 */
import { useId, useState } from 'react';
import { PAGE_KINDS, type PageKind, type ScanPage } from '../../domain/scan-types.ts';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import styles from './capture.module.css';
import { PageThumb } from './page-grid.tsx';
import review from './review.module.css';
import { foundOn, KIND_LABELS } from './scan-copy.ts';
import type { CheckLine, ReviewModel } from './use-draft-review.ts';

function KindSheet(props: {
  n: number;
  kind: PageKind;
  onPick: (kind: PageKind) => void;
  onClose: () => void;
}) {
  const t = useT();
  const name = useId();
  const label = t('capture.kindSheet', { n: props.n });
  return (
    <BottomSheet
      open
      label={label}
      header={<SectionLabel>{label}</SectionLabel>}
      onClose={props.onClose}
    >
      <fieldset className={review.kinds}>
        <legend className={styles.hidden}>{label}</legend>
        {PAGE_KINDS.map((kind) => (
          <label key={kind} className={styles.radio}>
            <input
              type="radio"
              name={name}
              checked={kind === props.kind}
              onChange={() => props.onPick(kind)}
            />
            {t(KIND_LABELS[kind])}
          </label>
        ))}
      </fieldset>
    </BottomSheet>
  );
}

function PageRow({ model, page, i }: { model: ReviewModel; page: ScanPage; i: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const n = i + 1;
  const text = page.lines[0]?.text ?? '';
  return (
    <li className={review.pageRow}>
      <span className={review.pageThumb}>
        <PageThumb photo={page.photo} text={text} label={t('capture.photoOf', { n })} />
      </span>
      <span className={review.pageMain}>
        <span className={review.pageKind}>{t(KIND_LABELS[page.kind])}</span>
        <span className={styles.muted}>
          {t('capture.pageFound', { n, found: foundOn(t, model.lesson, i) })}
        </span>
      </span>
      <PillButton
        variant="secondary"
        aria-label={t('capture.changeKind', { n })}
        onClick={() => setOpen(true)}
      >
        {t('capture.change')}
      </PillButton>
      {open && (
        <KindSheet
          n={n}
          kind={page.kind}
          onPick={(kind) => {
            model.setKind(i, kind);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </li>
  );
}

function LineFix({ at, model }: { at: CheckLine; model: ReviewModel }) {
  const t = useT();
  const id = useId();
  const [text, setText] = useState(at.text);
  const page = model.lesson.pages[at.page];
  return (
    <form
      className={review.lineFix}
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim()) void model.fixLine(at, text.trim());
      }}
    >
      {page && (
        <span className={review.fixThumb}>
          <PageThumb
            photo={page.photo}
            text={at.text}
            label={t('capture.photoOf', { n: at.page + 1 })}
          />
        </span>
      )}
      <label htmlFor={id} className={styles.fieldLabel}>
        {t('capture.lineOf', { line: at.line + 1, page: at.page + 1 })}
      </label>
      <input
        id={id}
        lang="ja"
        className={styles.input}
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
      />
      <PillButton type="submit" variant="secondary">
        {t('capture.looksRight')}
      </PillButton>
    </form>
  );
}

/** "1 line may be misread · Check it", and the sheet to check them. */
function CheckLines({ model }: { model: ReviewModel }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (model.check.length === 0) return null;
  const label = t('capture.checkSheet');
  return (
    <>
      <button type="button" className={styles.textLink} onClick={() => setOpen(true)}>
        {t('capture.misread', { n: model.check.length })} · {t('capture.checkIt')}
      </button>
      <BottomSheet
        open={open}
        label={label}
        header={<SectionLabel>{label}</SectionLabel>}
        onClose={() => setOpen(false)}
      >
        <div className={review.sheetBody}>
          <p className={styles.lead}>{t('capture.checkLead')}</p>
          {model.check.map((at) => (
            <LineFix key={`${at.page}.${at.line}`} at={at} model={model} />
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

export function ReviewPages({ model }: { model: ReviewModel }) {
  const t = useT();
  return (
    <section aria-label={t('capture.pagesHeading')} className={review.group}>
      <SectionLabel as="h2">{t('capture.pagesHeading')}</SectionLabel>
      <ul className={review.list}>
        {model.lesson.pages.map((page, i) => (
          <PageRow key={page.lines[0]?.sentenceId ?? i} model={model} page={page} i={i} />
        ))}
      </ul>
      <CheckLines model={model} />
    </section>
  );
}
