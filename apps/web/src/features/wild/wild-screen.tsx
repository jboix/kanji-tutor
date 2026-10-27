/**
 * `/wild`, In the wild: the learner photographs Japanese out in the world (a sign, a menu, a
 * label), asks the tutor to read it (one request per photo), and sees its kanji outlined, known
 * or new, with the new words to add. The tutor floats in reach for questions about the photo.
 */
import { useMemo, useState } from 'react';
import type { AiClient, SignReading } from '../../ai/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiWriting } from '../../ui/ai-block.tsx';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { type PreparedImage, prepareImage } from '../../ui/image.ts';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { TutorFloat, useTutor } from '../../ui/tutor.tsx';
import { useSignReading, useWildView } from './use-wild.ts';
import styles from './wild.module.css';
import { PhotoPicker, WildProblem } from './wild-parts.tsx';
import { WildPhoto } from './wild-photo.tsx';
import { WildResult } from './wild-result.tsx';

function WildTutor({ reading }: { reading: SignReading }) {
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

function Read({ photo, reading }: { photo: PreparedImage; reading: SignReading }) {
  const { view, add } = useWildView(reading);
  return (
    <>
      <WildPhoto photo={photo.blob} boxes={view?.boxes ?? []} />
      {view && <WildResult view={view} onAdd={add} />}
      <WildTutor reading={reading} />
    </>
  );
}

function Asked({ photo, client }: { photo: PreparedImage; client: AiClient }) {
  const t = useT();
  const state = useSignReading(client, photo);
  if (state.status === 'loading') {
    return (
      <>
        <WildPhoto photo={photo.blob} boxes={[]} />
        <AiWriting tier="fast">{t('wild.reading')}</AiWriting>
      </>
    );
  }
  if (state.status === 'error') return <WildProblem error={state.error} onRetry={state.retry} />;
  return <Read photo={photo} reading={state.value} />;
}

function Picked({ photo }: { photo: PreparedImage }) {
  const t = useT();
  const [client, setClient] = useState<AiClient>();
  const peek = useMemo(() => (c: AiClient) => c.peek('readSign', { image: photo.media }), [photo]);
  if (client) return <Asked photo={photo} client={client} />;
  return (
    <>
      <WildPhoto photo={photo.blob} boxes={[]} />
      <AiAction label={t('wild.read')} run={setClient} peek={peek} look="primary" block />
    </>
  );
}

/** The screen (see the module comment). */
export function WildScreen() {
  const t = useT();
  const [photo, setPhoto] = useState<{ id: number; image: PreparedImage }>();
  const pick = async (file: File) => {
    const image = await prepareImage(file);
    setPhoto((was) => ({ id: (was?.id ?? 0) + 1, image }));
  };
  const back = <BackButton parent={paths.tutor} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('wild.title')} />}>
      {photo ? (
        <Picked key={photo.id} photo={photo.image} />
      ) : (
        <p className={styles.intro}>{t('wild.intro')}</p>
      )}
      <PhotoPicker again={photo !== undefined} onPick={(file) => void pick(file)} />
    </Screen>
  );
}
