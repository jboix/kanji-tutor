import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { type LevelSuggestion, levelSuggestion } from '../../domain/placement/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon } from '../../ui/icons.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { useServices } from '../../ui/services.tsx';
import home from './home.module.css';

/**
 * The learner's level (A11): "Find my level" as a card, always within reach, and "Your reviews
 * suggest N4" when 30 days of reviews point elsewhere. Neither changes the level.
 */
export function PlacementRows({ now }: { now: number }) {
  const { repos } = useServices();
  const t = useT();
  const [found, setFound] = useState<LevelSuggestion>();
  useEffect(() => {
    let live = true;
    levelSuggestion(repos, now)
      .then((next) => live && setFound(next))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [repos, now]);
  if (!found) return null;
  return (
    <>
      <Link to={paths.placement} className={home.level}>
        <span className={home.levelText}>
          <span className={home.levelTitle}>{t('today.findLevel')}</span>
          <span className={home.levelLine}>{t('today.findLevelDetail')}</span>
        </span>
        <span className={home.chevron} aria-hidden="true">
          <ChevronIcon />
        </span>
      </Link>
      {found.suggested && (
        <ListRow
          to={paths.settingsSection('words')}
          detail={t('today.levelStays', { level: found.current })}
        >
          {t('today.reviewsSuggest', { level: found.suggested })}
        </ListRow>
      )}
    </>
  );
}
