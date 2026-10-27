/**
 * `/units/:id/episode`: the unit's episode, a short chat in which the cast lives its theme, with
 * Play, the translations on request, ふ for furigana on every word, and the tutor floating in reach. Offline, like the unit.
 */
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { dialogueText } from '../../domain/dialogues/index.ts';
import type { Episode } from '../../domain/episodes/index.ts';
import { unitById } from '../../domain/themes/index.ts';
import type { Unit } from '../../domain/themes/types.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { CastStack } from '../../ui/cast-portrait.tsx';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { PlayDialogue } from '../../ui/dialogue.tsx';
import { AllFuriganaContext, useFuriganaToggle } from '../../ui/furigana-mode.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { Ja } from '../../ui/ja.tsx';
import { Loader } from '../../ui/loader.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { TutorFloat, useTutor } from '../../ui/tutor.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './episode.module.css';
import { EpisodeChat } from './episode-chat.tsx';
import { useEpisode } from './use-episode.ts';

/** The tutor on the whole conversation, each line with its speaker. */
function EpisodeTutor({ episode, title }: { episode: Episode; title: string }) {
  const t = useT();
  const { language } = useContentLanguage();
  const options = useMemo(() => {
    const text = episode.lines.map((line) => line.ja).join('\n');
    const translation = episode.lines
      .map((line) => dialogueText(line.tr, language).value)
      .join('\n');
    return {
      topic: { about: title, sentence: { text, translation } },
      starters: [t('dialogues.tutorExplain'), t('units.episodeTutorSpeech')],
    };
  }, [episode, language, title, t]);
  const tutor = useTutor(options);
  if (!tutor) return null;
  return (
    <>
      <TutorFloat tutor={tutor} />
      {tutor.sheet}
    </>
  );
}

function Shown({ episode, unit }: { episode: Episode; unit: Unit }) {
  const t = useT();
  const { language } = useContentLanguage();
  const [translated, setTranslated] = useState(false);
  const title = dialogueText(episode.title, language).value;
  return (
    <>
      <header className={styles.head}>
        <CastStack who={episode.cast} size={40} />
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.unit}>
            <Ja>{unit.titleJa}</Ja>
          </p>
        </div>
      </header>
      <ChipRow>
        <PlayDialogue lines={episode.lines.map((line) => line.ja)} />
        <Chip aria-pressed={translated} onClick={() => setTranslated((was) => !was)}>
          {t('dialogues.showTranslation')}
        </Chip>
      </ChipRow>
      <EpisodeChat episode={episode} translated={translated} />
      <EpisodeTutor episode={episode} title={title} />
    </>
  );
}

/** The episode screen (see the module comment). */
export function EpisodeScreen() {
  const t = useT();
  const { id = '' } = useParams();
  const unit = unitById(id);
  const episode = useEpisode(id);
  const [all, toggle] = useFuriganaToggle();
  const back = <BackButton parent={unit ? paths.unit(id) : paths.units} label={t('common.back')} />;
  const furigana = (
    <IconButton aria-label={t('read.furiganaAll')} aria-pressed={all} muted glyph onClick={toggle}>
      ふ
    </IconButton>
  );
  const body =
    episode === undefined ? (
      <Loader />
    ) : episode && unit ? (
      <Shown episode={episode} unit={unit} />
    ) : (
      <p className={styles.unit}>{t('units.episodeMissing')}</p>
    );
  return (
    <Screen topBar={<TopBar start={back} end={furigana} />}>
      <AllFuriganaContext value={all}>{body}</AllFuriganaContext>
    </Screen>
  );
}
