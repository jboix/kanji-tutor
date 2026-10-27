/**
 * A unit lesson not begun opens with its episode (the lesson intro slot) before its first part:
 * the conversation gives the words and grammar about to be drilled their context.
 */
import { type ReactNode, useEffect, useState } from 'react';
import { LESSON_SECTIONS, lessonBegun, SECTION_TITLES } from '../../domain/services/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { SECTION_NAME } from '../../ui/lesson-sections.ts';
import { useServices } from '../../ui/services.tsx';
import { useSlot } from '../../ui/slots.tsx';
import type { SessionRequest } from './use-session.ts';

const FIRST = LESSON_SECTIONS[0] ?? 'words';

/** Whether the request is a lesson's first part and the lesson is not begun; undefined meanwhile. */
function useNotBegun(request: SessionRequest): boolean | undefined {
  const { repos } = useServices();
  const { unit } = request;
  const first = unit !== undefined && request.section === FIRST && (request.part ?? 1) === 1;
  const [open, setOpen] = useState<boolean>();
  useEffect(() => {
    if (!first || !unit) return;
    let live = true;
    void repos.settings.get().then((settings) => {
      if (live) setOpen(!lessonBegun(settings.unitStatus?.[unit]));
    });
    return () => {
      live = false;
    };
  }, [repos, unit, first]);
  return first ? open : false;
}

/**
 * The opening to show before the session, if any: `undefined` while it is looked up, `null` when
 * there is none or it was gone through.
 */
export function useLessonOpening(request: SessionRequest, close: ReactNode): ReactNode {
  const t = useT();
  const Intro = useSlot('lessonIntro');
  const notBegun = useNotBegun(request);
  const [started, setStarted] = useState(false);
  if (!Intro || !request.unit || started || notBegun === false) return null;
  if (notBegun === undefined) return undefined;
  const first = `${SECTION_TITLES[FIRST]} · ${t(SECTION_NAME[FIRST])}`;
  return (
    <Intro unitId={request.unit} close={close} first={first} onStart={() => setStarted(true)} />
  );
}
