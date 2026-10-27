/** The unit's episode on its page: the cast, the episode's title, and a way into the chat. */
import { Link } from 'react-router';
import { dialogueText } from '../../domain/dialogues/index.ts';
import { CastStack } from '../../ui/cast-portrait.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon } from '../../ui/icons.tsx';
import { paths } from '../../ui/paths.ts';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './episode.module.css';
import { useEpisode } from './use-episode.ts';

export function EpisodeCard({ unitId }: { unitId: string }) {
  const t = useT();
  const { language } = useContentLanguage();
  const episode = useEpisode(unitId);
  if (!episode) return null;
  return (
    <Link to={paths.unitEpisode(unitId)} className={styles.card}>
      <CastStack who={episode.cast} size={36} />
      <span className={styles.cardText}>
        <span className={styles.cardLabel}>{t('units.episodeLabel')}</span>
        <span className={styles.cardTitle}>{dialogueText(episode.title, language).value}</span>
      </span>
      <span className={styles.chevron} aria-hidden="true">
        <ChevronIcon />
      </span>
    </Link>
  );
}
