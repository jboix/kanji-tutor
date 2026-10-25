/**
 * A scanned lesson's parts (scans/Lesson): its kanji, words, grammar and each handout page's
 * exercises, each with a Japanese sample and its items practised. A part opens in a sheet with
 * what it holds, levels and states; exercises show their questions, the tutor's answers hidden.
 */
import { useState } from 'react';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import type { ScanItemView, ScanPart } from '../../domain/services/index.ts';
import { scanProgress } from '../../domain/services/index.ts';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { PartList, PartRow } from '../../ui/part-row.tsx';
import styles from './lesson.module.css';
import { ItemGroup, PageExercises } from './review-items.tsx';

/** Items in a sample, at most. */
const SAMPLED = 5;

function partName(t: Translate, part: ScanPart): string {
  if (part.kind === 'kanji') return t('capture.partKanji');
  if (part.kind === 'word') return t('capture.partWords');
  if (part.kind === 'grammar') return t('capture.partGrammar');
  return t('capture.partExercises', { page: (part.page ?? 0) + 1 });
}

/** "雨 晴 雪 曇 風", "天気予報 晴れ…", or the first question of the page. */
function sampleOf(lesson: ScannedLesson, part: ScanPart): string {
  if (part.kind === 'questions') {
    return lesson.questions.find((q) => q.page === part.page)?.stem ?? '';
  }
  const texts = lesson.items.filter((i) => i.kind === part.kind && i.ref).map((i) => i.text);
  const shown = texts.slice(0, SAMPLED).join(' ');
  return texts.length > SAMPLED ? `${shown}…` : shown;
}

interface SheetProps {
  lesson: ScannedLesson;
  views: readonly ScanItemView[];
  part: ScanPart;
  onClose: () => void;
}

function PartSheet({ lesson, views, part, onClose }: SheetProps) {
  const t = useT();
  const label = partName(t, part);
  const questions = lesson.questions.filter((q) => q.page === part.page);
  return (
    <BottomSheet open label={label} onClose={onClose}>
      <div className={styles.sheetBody}>
        {part.kind === 'questions' ? (
          <PageExercises page={part.page ?? 0} questions={questions} />
        ) : (
          <ItemGroup kind={part.kind} views={views.filter((v) => v.inLists)} />
        )}
      </div>
    </BottomSheet>
  );
}

export function LessonParts({
  lesson,
  views,
}: {
  lesson: ScannedLesson;
  views: readonly ScanItemView[];
}) {
  const t = useT();
  const [open, setOpen] = useState<ScanPart>();
  const { parts } = scanProgress(lesson);
  if (parts.length === 0) return null;
  return (
    <>
      <PartList label={t('capture.partsLabel')}>
        {parts.map((part) => (
          <PartRow
            key={`${part.kind}${part.page ?? ''}`}
            name={partName(t, part)}
            sample={sampleOf(lesson, part)}
            count={{ done: part.done, total: part.total }}
            onClick={() => setOpen(part)}
          />
        ))}
      </PartList>
      {open && (
        <PartSheet lesson={lesson} views={views} part={open} onClose={() => setOpen(undefined)} />
      )}
    </>
  );
}
