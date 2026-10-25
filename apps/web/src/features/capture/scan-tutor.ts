/** The tutor on the scan screens: about scanning before the pages are read, then about them. */
import { useMemo } from 'react';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useTutor } from '../../ui/tutor.tsx';

/** Characters of the pages' text the tutor gets as what is on screen. */
const TEXT_CHARS = 400;

/** The pages' lines, as far as {@link TEXT_CHARS} characters. */
export function pagesText(lesson: Pick<ScannedLesson, 'pages'>): string {
  const text = lesson.pages.flatMap((page) => page.lines.map((line) => line.text)).join('\n');
  return [...text].slice(0, TEXT_CHARS).join('');
}

export function useImportTutor() {
  const t = useT();
  const options = useMemo(
    () => ({
      topic: { about: t('capture.tutorImport'), sentence: { text: '' } },
      starters: [t('capture.tutorImportWhich'), t('capture.tutorImportPhotos')],
    }),
    [t],
  );
  return useTutor(options);
}

export function useLessonTutor(lesson: ScannedLesson, title: string) {
  const t = useT();
  const text = pagesText(lesson);
  const options = useMemo(
    () => ({
      topic: { about: title || t('capture.tutorImport'), sentence: { text } },
      starters: [t('capture.tutorReviewTeach'), t('capture.tutorReviewFirst')],
    }),
    [t, title, text],
  );
  return useTutor(options);
}
