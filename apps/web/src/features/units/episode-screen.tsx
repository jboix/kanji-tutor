/**
 * `/units/:id/episode`: the unit's episode, a short chat in which the cast lives its theme. Its
 * footer plays it line by line (the current line highlighted and followed, the track to go back
 * or ahead), shows the translations and holds the tutor's Ask; ふ puts furigana on every word.
 * Offline, like the unit.
 */
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { dialogueText } from '../../domain/dialogues/index.ts';
import type { Episode } from '../../domain/episodes/index.ts';
import { unitById } from '../../domain/themes/index.ts';
import type { Unit } from '../../domain/themes/types.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { CastStack } from '../../ui/cast-portrait.tsx';
import { AllFuriganaContext, useFuriganaToggle } from '../../ui/furigana-mode.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { Ja } from '../../ui/ja.tsx';
import { PlayerBar, useLinePlayer } from '../../ui/line-player.tsx';
import { Loader } from '../../ui/loader.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { TutorButton, useTutor } from '../../ui/tutor.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './episode.module.css';
import { EpisodeChat } from './episode-chat.tsx';
import { useEpisode } from './use-episode.ts';

/** The tutor on the whole conversation. */
function useEpisodeTutor(episode: Episode, title: string) {
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
  return useTutor(options);
}

function Head({ episode, unit, title }: { episode: Episode; unit: Unit; title: string }) {
  return (
    <header className={styles.head}>
      <CastStack who={episode.cast} size={40} />
      <div className={styles.titles}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.unit}>
          <Ja>{unit.titleJa}</Ja>
        </p>
      </div>
    </header>
  );
}

function Shown({
  episode,
  unit,
  topBar,
}: {
  episode: Episode;
  unit: Unit;
  topBar: React.ReactNode;
}) {
  const { language } = useContentLanguage();
  const [translated, setTranslated] = useState(false);
  const title = dialogueText(episode.title, language).value;
  const player = useLinePlayer(useMemo(() => episode.lines.map((line) => line.ja), [episode]));
  const tutor = useEpisodeTutor(episode, title);
  const footer = (
    <PlayerBar
      player={player}
      total={episode.lines.length}
      translated={translated}
      onTranslate={() => setTranslated((was) => !was)}
      start={tutor && <TutorButton tutor={tutor} />}
    />
  );
  return (
    <Screen topBar={topBar} footer={footer}>
      <Head episode={episode} unit={unit} title={title} />
      <EpisodeChat episode={episode} translated={translated} current={player.current} />
      {tutor?.sheet}
    </Screen>
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
  const topBar = <TopBar start={back} end={furigana} />;
  if (episode && unit) {
    return (
      <AllFuriganaContext value={all}>
        <Shown episode={episode} unit={unit} topBar={topBar} />
      </AllFuriganaContext>
    );
  }
  return (
    <Screen topBar={topBar}>
      {episode === undefined ? (
        <Loader />
      ) : (
        <p className={styles.unit}>{t('units.episodeMissing')}</p>
      )}
    </Screen>
  );
}
