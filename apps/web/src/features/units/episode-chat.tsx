/**
 * An episode as a chat: the learner's companion (the episode's first cast member) on the right in
 * tonal bubbles, the others on the left, each beside their portrait, each run of lines under its
 * speaker's name (a screen reader hears the name on every line). Every line is Japanese to tap
 * word by word, with furigana as the learner's settings say, and its translation under it when
 * shown. The line being read aloud is highlighted and kept in view. Written for the app: nothing
 * here is the tutor's.
 */
import { useState } from 'react';
import { CAST, type CastId } from '../../domain/cast.ts';
import { dialogueText } from '../../domain/dialogues/index.ts';
import type { Episode, EpisodeLine } from '../../domain/episodes/index.ts';
import { Portrait } from '../../ui/cast-portrait.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useFollowLine } from '../../ui/line-player.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import { TapText } from '../../ui/word-tap.tsx';
import styles from './episode.module.css';

const nameOf = (id: CastId) => CAST.find((member) => member.id === id)?.name ?? id;

function Translation({ line }: { line: EpisodeLine }) {
  const { language } = useContentLanguage();
  const { value, english } = dialogueText(line.tr, language);
  return (
    <p className={styles.tr}>
      {value}
      <EnMark english={english} />
    </p>
  );
}

interface MessageProps {
  episode: Episode;
  index: number;
  translated: boolean;
  /** Being read aloud, or where the player stands. */
  current: boolean;
}

function Message({ episode, index, translated, current }: MessageProps) {
  const line = episode.lines[index] as EpisodeLine;
  const mine = line.by === episode.cast[0];
  const first = episode.lines[index - 1]?.by !== line.by;
  return (
    <li
      className={styles.message}
      data-mine={mine ? '' : undefined}
      data-line=""
      data-current={current ? '' : undefined}
      aria-current={current ? 'true' : undefined}
    >
      <span className={styles.face}>{first && <Portrait who={line.by} size={32} />}</span>
      <div className={styles.bubble} data-first={first ? '' : undefined}>
        <span className={first ? styles.name : 'visually-hidden'} data-who={line.by}>
          {nameOf(line.by)}
        </span>
        <p className={styles.ja}>
          <TapText text={line.ja} id={`episode:${episode.unitId}:${index}`} />
        </p>
        {translated && <Translation line={line} />}
      </div>
    </li>
  );
}

export interface EpisodeChatProps {
  episode: Episode;
  translated: boolean;
  /** The line the player is on, highlighted and kept in view. */
  current?: number | undefined;
}

/** The chat (see the module comment). */
export function EpisodeChat({ episode, translated, current }: EpisodeChatProps) {
  const t = useT();
  const [list, setList] = useState<HTMLOListElement | null>(null);
  useFollowLine(list, current);
  const names = episode.cast.map(nameOf).join('・');
  return (
    <ol ref={setList} className={styles.feed} aria-label={t('units.episodeChat', { names })}>
      {episode.lines.map((line, i) => (
        <Message
          key={`${line.by}:${line.ja}`}
          episode={episode}
          index={i}
          translated={translated}
          current={i === current}
        />
      ))}
    </ol>
  );
}
