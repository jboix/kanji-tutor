import { useParams } from 'react-router';
import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { PillLink } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './kanji.module.css';
import { KanjiDetailView } from './kanji-detail-view.tsx';
import { KanjiIndex } from './kanji-index.tsx';
import { useKanjiDetail } from './use-kanji.ts';

function Detail({ char }: { char: string }) {
  const { t, rich } = useI18n();
  const result = useKanjiDetail(char);
  if (result.state === 'loading') return <p className={styles.meta}>{t('kanji.lookingUp')}</p>;
  if (!result.value) {
    return (
      <>
        <p className={styles.meta}>{rich('kanji.notFound', { char: <Ja>{char}</Ja> })}</p>
        <PillLink to={paths.kanji} variant="secondary">
          {t('kanji.another')}
        </PillLink>
      </>
    );
  }
  return <KanjiDetailView detail={result.value} />;
}

/** A kanji's page inside a sheet over a session (the `pagePeek` slot, R14). */
export function KanjiPeek({ char }: { char: string }) {
  return <Detail char={char} />;
}

/**
 * `/kanji` (index) and `/kanji/:char` (kanji.html detail, K3), under Learn (IA4). Offline. The
 * index goes back to Learn, a kanji's page to the index.
 */
export function KanjiScreen() {
  const { char } = useParams();
  const t = useT();
  const back = <BackButton parent={char ? paths.kanji : paths.learn} label={t('common.back')} />;
  // The index's name sits in the bar; a kanji's page keeps the kanji as its own heading.
  const title = char ? undefined : <span lang="ja">漢字</span>;
  return (
    <Screen topBar={<TopBar start={back} title={title} />}>
      {char ? <Detail key={char} char={char} /> : <KanjiIndex />}
    </Screen>
  );
}
