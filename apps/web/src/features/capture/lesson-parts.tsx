/**
 * A scanned lesson's parts (scans/Lesson): its kanji, words, grammar and its handouts'
 * exercises, each with a Japanese sample and its items practised. A part opens in a sheet with
 * what it holds, levels and states; exercises show their questions page by page, the tutor's
 * answers hidden. In the sheet each one has its tick: what was left out stays listed and can be
 * added back, and a part left out whole still has its row.
 */
import { useState } from 'react';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import type { ScanPart } from '../../domain/services/index.ts';
import { keptItems, keptQuestions, scanParts } from '../../domain/services/index.ts';
import { BottomSheet, SheetTitle } from '../../ui/bottom-sheet.tsx';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { PartList, PartRow } from '../../ui/part-row.tsx';
import styles from './lesson.module.css';
import review from './review.module.css';
import { AllExercises, ItemGroup } from './review-items.tsx';
import type { ReviewModel } from './use-draft-review.ts';

/** Items in a sample, at most. */
const SAMPLED = 5;

function partName(t: Translate, part: ScanPart): string {
  if (part.kind === 'kanji') return t('capture.partKanji');
  if (part.kind === 'word') return t('capture.partWords');
  if (part.kind === 'grammar') return t('capture.partGrammar');
  return t('capture.partExercises');
}

/** "雨 晴 雪 曇 風", "天気予報 晴れ…", or the first question; of what is kept. */
function sampleOf(lesson: ScannedLesson, part: ScanPart): string {
  if (part.kind === 'questions') {
    return (keptQuestions(lesson)[0] ?? lesson.questions[0])?.stem ?? '';
  }
  const from = part.total > 0 ? keptItems(lesson) : lesson.items;
  const texts = from.filter((i) => i.kind === part.kind && i.ref).map((i) => i.text);
  const shown = texts.slice(0, SAMPLED).join(' ');
  return texts.length > SAMPLED ? `${shown}…` : shown;
}

interface SheetProps {
  model: ReviewModel;
  part: ScanPart;
  onClose: () => void;
}

function PartSheet({ model, part, onClose }: SheetProps) {
  const t = useT();
  const label = partName(t, part);
  const views = (model.views ?? []).filter((v) => v.inLists);
  return (
    <BottomSheet open label={label} header={<SheetTitle>{label}</SheetTitle>} onClose={onClose}>
      <div className={cx(styles.sheetBody, review.flat)}>
        {part.kind === 'questions' ? (
          <AllExercises model={model} />
        ) : (
          <ItemGroup kind={part.kind} views={views} model={model} />
        )}
      </div>
    </BottomSheet>
  );
}

/** "2 of 5" of what is kept; a part left out whole says so instead. */
function countOf(t: Translate, part: ScanPart) {
  if (part.total === 0) return { aside: t('capture.partLeftOut') };
  return { count: { done: part.done, total: part.total } };
}

export function LessonParts({ model }: { model: ReviewModel }) {
  const t = useT();
  const [open, setOpen] = useState<ScanPart>();
  const { lesson } = model;
  const parts = scanParts(lesson);
  if (parts.length === 0) return null;
  return (
    <>
      <PartList label={t('capture.partsLabel')}>
        {parts.map((part) => (
          <PartRow
            key={part.kind}
            name={partName(t, part)}
            sample={sampleOf(lesson, part)}
            {...countOf(t, part)}
            onClick={() => setOpen(part)}
          />
        ))}
      </PartList>
      {open && <PartSheet model={model} part={open} onClose={() => setOpen(undefined)} />}
    </>
  );
}
