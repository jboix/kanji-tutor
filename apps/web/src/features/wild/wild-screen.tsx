/**
 * `/wild`, In the wild: the learner photographs Japanese out in the world (a sign, a menu, a
 * label), asks the tutor to read it (one request per photo), and sees its kanji outlined, known
 * or new, with the new words to add. The tutor floats in reach for questions about the photo.
 * Each photo read is kept with its reading, and Your photos lists them to open again.
 */
import { useMemo, useState } from 'react';
import type { AiClient } from '../../ai/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiWriting } from '../../ui/ai-block.tsx';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { type PreparedImage, prepareImage } from '../../ui/image.ts';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { useSignReading } from './use-wild.ts';
import styles from './wild.module.css';
import { WildList } from './wild-list.tsx';
import { PhotoPicker, WildProblem } from './wild-parts.tsx';
import { WildPhoto } from './wild-photo.tsx';
import { WildRead } from './wild-read.tsx';

interface Picked {
  id: string;
  image: PreparedImage;
}

function Asked({ photo, client }: { photo: Picked; client: AiClient }) {
  const t = useT();
  const state = useSignReading(client, photo.image, photo.id);
  if (state.status === 'loading') {
    return (
      <>
        <WildPhoto photo={photo.image.blob} boxes={[]} />
        <AiWriting tier="fast">{t('wild.reading')}</AiWriting>
      </>
    );
  }
  if (state.status === 'error') return <WildProblem error={state.error} onRetry={state.retry} />;
  return <WildRead photo={photo.image.blob} reading={state.value} />;
}

function Ask({ photo }: { photo: Picked }) {
  const t = useT();
  const [client, setClient] = useState<AiClient>();
  const { media } = photo.image;
  const peek = useMemo(() => (c: AiClient) => c.peek('readSign', { image: media }), [media]);
  if (client) return <Asked photo={photo} client={client} />;
  return (
    <>
      <WildPhoto photo={photo.image.blob} boxes={[]} />
      <AiAction label={t('wild.read')} run={setClient} peek={peek} look="primary" block />
    </>
  );
}

/** The screen (see the module comment). */
export function WildScreen() {
  const t = useT();
  const [photo, setPhoto] = useState<Picked>();
  const pick = async (file: File) => {
    setPhoto({ id: crypto.randomUUID(), image: await prepareImage(file) });
  };
  const back = <BackButton parent={paths.tutor} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('wild.title')} />}>
      {photo ? (
        <Ask key={photo.id} photo={photo} />
      ) : (
        <p className={styles.intro}>{t('wild.intro')}</p>
      )}
      <PhotoPicker again={photo !== undefined} onPick={(file) => void pick(file)} />
      {!photo && <WildList />}
    </Screen>
  );
}
