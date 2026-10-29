import { useParams } from 'react-router';
import { GUIDES, guideById } from '../../domain/guides/index.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { GUIDE_TITLE } from '../../ui/guide-link.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { GUIDE_TEXT, GuidePage } from './guide-page.tsx';
import styles from './guides.module.css';

function GuideIndex() {
  const t = useT();
  return (
    <>
      <p className={styles.meta}>{t('guides.intro')}</p>
      <div className={styles.rows}>
        {GUIDES.map((guide) => (
          <ListRow
            key={guide.id}
            to={paths.guide(guide.id)}
            detail={`${t(GUIDE_TEXT[guide.id].detail)} · ${t('guides.levelTag', { level: guide.level })}`}
          >
            {t(GUIDE_TITLE[guide.id])} <Ja>{guide.titleJa}</Ja>
          </ListRow>
        ))}
      </div>
    </>
  );
}

function Detail({ id }: { id: string }) {
  const { rich } = useI18n();
  const guide = guideById(id);
  if (!guide) return <p className={styles.meta}>{rich('guides.missing', { id: <Ja>{id}</Ja> })}</p>;
  return <GuidePage key={id} guide={guide} floating />;
}

/** `/guides` (the list, from Learn) and `/guides/:id` (one guide). Static and offline. */
export function GuidesScreen() {
  const { id } = useParams();
  const t = useT();
  const back = <BackButton parent={id ? paths.guides : paths.learn} label={t('guides.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={id ? undefined : t('guides.title')} />}>
      {id ? <Detail id={id} /> : <GuideIndex />}
    </Screen>
  );
}

/** A guide in a sheet over a session (the `pagePeek` slot). */
export function GuidePeek({ id }: { id: string }) {
  const guide = guideById(id);
  return guide ? <GuidePage guide={guide} /> : null;
}
