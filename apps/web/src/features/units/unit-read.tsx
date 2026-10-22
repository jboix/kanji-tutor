/**
 * The Read step of a unit (T3, T6): the passage line by line with tap-a-word (the explain
 * feature's word sheet), the English on request, then its 読解 questions in a session.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { markUnitRead, type UnitView } from '../../domain/services/index.ts';
import type { Sentence } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { useServices } from '../../ui/services.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { TapSentence } from '../../ui/word-tap.tsx';
import styles from './units.module.css';

/** The lesson's 読み物 section: the passage's questions (T6, S3). */
const questionsPath = (id: string) => paths.lessonPart(id, 'reading', 1);

/** The passage lines as stored (with tokens), else as written in the unit. */
function useLines(view: UnitView): { sentence: Sentence; en: string }[] {
  const { repos } = useServices();
  const written = view.unit.passage.sentences;
  const [stored, setStored] = useState<(Sentence | undefined)[]>([]);
  const ids = view.pack?.passageIds;
  useEffect(() => {
    if (ids) void repos.sentences.getMany(ids).then(setStored);
  }, [repos, ids]);
  return written.map((line, i) => ({
    sentence: stored[i] ?? {
      id: `passage-line:${i}`,
      text: line.ja,
      source: 'unit',
      tokens: [],
      wordIds: [],
      verified: true,
    },
    en: line.en,
  }));
}

/** The Read step (see the module comment). */
export function UnitRead({ view }: { view: UnitView }) {
  const t = useT();
  const { repos } = useServices();
  const navigate = useNavigate();
  const Sheet = useSlot('wordSheet');
  const lines = useLines(view);
  const [english, setEnglish] = useState(false);
  const answer = async () => {
    await markUnitRead(repos, view.unit.id, Date.now());
    await navigate(questionsPath(view.unit.id));
  };
  return (
    <>
      <h1 lang="ja" className={styles.titleJa}>
        {view.unit.titleJa}
      </h1>
      <p className={styles.muted}>{Sheet ? t('units.tapWord') : t('units.readPassage')}</p>
      <section className={styles.passage} aria-label={t('units.passage')}>
        {lines.map(({ sentence, en }) => (
          <div key={sentence.id}>
            <TapSentence sentence={sentence} size="callout" />
            {english && <p className={styles.english}>{en}</p>}
          </div>
        ))}
      </section>
      <div className={styles.actions}>
        <PillButton variant="secondary" onClick={() => setEnglish((on) => !on)}>
          {english ? t('units.hideEnglish') : t('units.showEnglish')}
        </PillButton>
        <PillButton arrow onClick={() => void answer()}>
          {t('units.answer')}
        </PillButton>
      </div>
    </>
  );
}
