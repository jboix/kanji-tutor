import { useEffect, useState } from 'react';
import { type LevelSuggestion, levelSuggestion } from '../../domain/placement/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { useServices } from '../../ui/services.tsx';

/** Under this many reviews, Today offers the placement. */
const NEW_LEARNER = 20;

/**
 * Quiet rows about the learner's level (A11): "Find my level" for a new learner, and "Your
 * reviews suggest N4" when 30 days of reviews point elsewhere. Neither changes the level.
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
      {found.reviews < NEW_LEARNER && (
        <ListRow to={paths.placement} detail={t('today.findLevelDetail')}>
          {t('today.findLevel')}
        </ListRow>
      )}
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
