/**
 * Before a unit lesson's first part: the unit (its title, theme, cast and summary), then its
 * episode to read or play, so the lesson's words and grammar are met in use before they are
 * drilled. The footer plays the conversation, holds the tutor's Ask, and starts the lesson.
 */
import { useMemo, useState } from 'react';
import { localUnit } from '../../domain/content-language.ts';
import { dialogueText } from '../../domain/dialogues/index.ts';
import type { Episode } from '../../domain/episodes/index.ts';
import { unitById } from '../../domain/themes/index.ts';
import type { Unit } from '../../domain/themes/types.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { AllFuriganaContext, useFuriganaToggle } from '../../ui/furigana-mode.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { PlayerBar, useLinePlayer } from '../../ui/line-player.tsx';
import { Loader } from '../../ui/loader.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import type { LessonIntroSlotProps } from '../../ui/slots.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { TutorButton } from '../../ui/tutor.tsx';
import { UnitCast } from '../../ui/unit-cast.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './episode.module.css';
import { EpisodeChat } from './episode-chat.tsx';
import { useEpisodeTutor } from './episode-screen.tsx';
import units from './units.module.css';
import { useEpisode } from './use-episode.ts';

function Header({ unit }: { unit: Unit }) {
  const t = useT();
  const local = localUnit(useContentLanguage(), unit);
  return (
    <header className={units.header}>
      <div className={units.titles}>
        <h1 lang="ja" className={units.titleJa}>
          {unit.titleJa}
        </h1>
        <p className={units.order}>
          {t('units.unitOrder', { level: unit.level, order: unit.order })}
        </p>
        <p className={units.theme}>
          {local.value.theme}
          <EnMark english={local.english} />
        </p>
        <UnitCast unit={unit} lead={(names) => t('units.withCast', { names })} />
      </div>
      <p className={units.muted}>{local.value.summary}</p>
    </header>
  );
}

function StartButton({ first, onStart }: Pick<LessonIntroSlotProps, 'first' | 'onStart'>) {
  const t = useT();
  return (
    <PillButton block arrow onClick={onStart}>
      {t('units.introStart', { section: first })}
    </PillButton>
  );
}

interface ConversationProps extends Pick<LessonIntroSlotProps, 'first' | 'onStart'> {
  episode: Episode;
  unit: Unit;
  topBar: React.ReactNode;
}

/** The unit, then its episode, with the player, the tutor and Start in the footer. */
function Conversation({ episode, unit, topBar, first, onStart }: ConversationProps) {
  const t = useT();
  const { language } = useContentLanguage();
  const [translated, setTranslated] = useState(false);
  const player = useLinePlayer(useMemo(() => episode.lines.map((line) => line.ja), [episode]));
  const title = dialogueText(episode.title, language).value;
  const tutor = useEpisodeTutor(episode, title);
  const footer = (
    <PlayerBar
      player={player}
      total={episode.lines.length}
      translated={translated}
      onTranslate={() => setTranslated((was) => !was)}
      start={tutor && <TutorButton tutor={tutor} />}
      below={<StartButton first={first} onStart={onStart} />}
    />
  );
  return (
    <Screen topBar={topBar} footer={footer} gap={22}>
      <Header unit={unit} />
      <section className={styles.intro} aria-labelledby="lesson-intro-conversation">
        <h2 id="lesson-intro-conversation" className={styles.introTitle}>
          {t('units.introConversation')}
        </h2>
        <p className={units.muted}>{t('units.introConversationLine')}</p>
      </section>
      <EpisodeChat episode={episode} translated={translated} current={player.current} />
      {tutor?.sheet}
    </Screen>
  );
}

/** The lesson's opening (see the module comment). */
export function LessonIntro({ unitId, close, first, onStart }: LessonIntroSlotProps) {
  const t = useT();
  const unit = unitById(unitId);
  const episode = useEpisode(unitId);
  const [all, toggle] = useFuriganaToggle();
  const furigana = (
    <IconButton aria-label={t('read.furiganaAll')} aria-pressed={all} muted glyph onClick={toggle}>
      ふ
    </IconButton>
  );
  const topBar = <TopBar start={close} end={furigana} />;
  if (unit && episode) {
    return (
      <AllFuriganaContext value={all}>
        <Conversation
          episode={episode}
          unit={unit}
          topBar={topBar}
          first={first}
          onStart={onStart}
        />
      </AllFuriganaContext>
    );
  }
  const start = <StartButton first={first} onStart={onStart} />;
  return (
    <Screen topBar={topBar} footer={<div className={styles.introFooter}>{start}</div>} gap={22}>
      {episode === undefined ? <Loader /> : unit && <Header unit={unit} />}
    </Screen>
  );
}
