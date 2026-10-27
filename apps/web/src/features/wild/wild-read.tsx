/**
 * A photo the tutor has read: its kanji outlined, what it holds for the learner, and the tutor
 * floating in reach for questions about it. The same for a fresh photo and a saved one.
 */
import { useMemo } from 'react';
import type { WildReading } from '../../domain/services/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { TutorFloat, useTutor } from '../../ui/tutor.tsx';
import { useWildView } from './use-wild.ts';
import { WildPhoto } from './wild-photo.tsx';
import { WildResult } from './wild-result.tsx';

function WildTutor({ reading }: { reading: WildReading }) {
  const t = useT();
  const options = useMemo(
    () => ({
      topic: {
        about: reading.place || t('wild.tutorAbout'),
        sentence: { text: reading.lines.join('\n') },
      },
      starters: [t('wild.tutorAsk')],
    }),
    [reading, t],
  );
  const tutor = useTutor(options);
  if (!tutor) return null;
  return (
    <>
      <TutorFloat tutor={tutor} />
      {tutor.sheet}
    </>
  );
}

/** The read photo (see the module comment). */
export function WildRead({ photo, reading }: { photo: Blob; reading: WildReading }) {
  const { view, add } = useWildView(reading);
  return (
    <>
      <WildPhoto photo={photo} boxes={view?.boxes ?? []} />
      {view && <WildResult view={view} onAdd={add} />}
      <WildTutor reading={reading} />
    </>
  );
}
