import { type GuideId, guideFor } from '../domain/guides/index.ts';
import styles from './guide-link.module.css';
import { useT } from './i18n/i18n.tsx';
import type { PlainKey } from './i18n/types.ts';
import { ListIcon } from './icons.tsx';
import { PeekLink } from './peek-link.tsx';

/** Each guide's name in the messages. */
export const GUIDE_TITLE: Record<GuideId, PlainKey> = {
  'verb-groups': 'guides.verb-groups',
  'plain-polite': 'guides.plain-polite',
  'te-form': 'guides.te-form',
  adjectives: 'guides.adjectives',
  conjugation: 'guides.conjugation',
  keigo: 'guides.keigo',
};

/**
 * "Guide: The て-form and た-form", on the intro and page of a grammar point a guide backs. In a
 * session it opens the guide in a sheet, so the exercise stays as it was.
 */
export function GuideLink({ grammarId }: { grammarId: string }) {
  const t = useT();
  const guide = guideFor(grammarId);
  if (!guide) return null;
  const label = t('guides.readGuide', { title: t(GUIDE_TITLE[guide.id]) });
  return (
    <PeekLink kind="guide" id={guide.id} label={label} className={styles.link}>
      <ListIcon />
      <span>
        {label} <span lang="ja">{guide.titleJa}</span>
      </span>
    </PeekLink>
  );
}
