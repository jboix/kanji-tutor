/**
 * The ticks that choose what a scanned lesson practises: one per item or question, and one per
 * group for all of it, half-set while only some of the group is kept.
 */
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { isKept } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import review from './review.module.css';
import type { ReviewModel } from './use-draft-review.ts';

interface KeepBoxProps {
  /** The id its row, a label, names it by. */
  id: string;
  /** What the tick keeps, for its name: 雨, 天気予報, "question 4". */
  name: string;
  kept: boolean;
  onChange: (kept: boolean) => void;
}

/** A row's tick: practised in this lesson, or left out. */
function KeepBox({ id, name, kept, onChange }: KeepBoxProps) {
  const t = useT();
  return (
    <input
      id={id}
      type="checkbox"
      className={review.keep}
      aria-label={t('capture.keepItem', { item: name })}
      checked={kept}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
  );
}

interface KeptRowProps {
  /** The key of the item or question the row is about. */
  itemKey: string;
  name: string;
  className: string | undefined;
  model: ReviewModel;
  children: ReactNode;
}

/** A list row with its tick: the whole row is the tick's label, greyed while left out. */
export function KeptRow({ itemKey, name, className, model, children }: KeptRowProps) {
  const id = useId();
  const kept = isKept(model.lesson, itemKey);
  return (
    <li>
      <label htmlFor={id} className={cx(className, !kept && review.left)}>
        <KeepBox id={id} name={name} kept={kept} onChange={(on) => model.setKept([itemKey], on)} />
        {children}
      </label>
    </li>
  );
}

interface GroupHeadProps {
  title: string;
  /** The name of the tick for the whole group, e.g. "Practise all the kanji". */
  label: string;
  /** The keys the group's tick sets; none when nothing in the group can be practised. */
  keys: readonly string[];
  model: ReviewModel;
}

/** A group's heading and, beside it, the tick that keeps or leaves out the whole group. */
export function GroupHead({ title, label, keys, model }: GroupHeadProps) {
  const t = useT();
  const box = useRef<HTMLInputElement>(null);
  const kept = keys.filter((key) => isKept(model.lesson, key)).length;
  const all = kept === keys.length;
  useEffect(() => {
    if (box.current) box.current.indeterminate = kept > 0 && !all;
  }, [kept, all]);
  return (
    <div className={review.groupHead}>
      <SectionLabel as="h2">{title}</SectionLabel>
      {keys.length > 0 && (
        <label className={review.all}>
          {t('capture.keepAll')}
          <input
            ref={box}
            type="checkbox"
            className={review.keep}
            aria-label={label}
            checked={all}
            onChange={() => model.setKept(keys, !all)}
          />
        </label>
      )}
    </div>
  );
}
