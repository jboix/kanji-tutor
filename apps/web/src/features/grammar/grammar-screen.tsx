import { useNavigate, useParams, useSearchParams } from 'react-router';
import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { PillLink } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './grammar.module.css';
import { entryById } from './grammar-data.ts';
import { GrammarIndex } from './grammar-index.tsx';
import { GrammarIntro } from './grammar-intro.tsx';
import { GrammarPage } from './grammar-page.tsx';

function Missing({ id }: { id: string }) {
  const { t, rich } = useI18n();
  return (
    <>
      <p className={styles.meta}>{rich('grammar.missing', { id: <Ja>{id}</Ja> })}</p>
      <PillLink to={paths.grammarIndex} variant="secondary">
        {t('grammar.allGrammar')}
      </PillLink>
    </>
  );
}

/** `?intro=1` shows the intro card (the `grammarIntro` slot); "Got it" opens the page. */
function Detail({ id }: { id: string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const entry = entryById(id);
  if (!entry) return <Missing id={id} />;
  if (params.get('intro') === '1') {
    return (
      <GrammarIntro
        grammarId={id}
        onDone={() => void navigate(paths.grammar(id), { replace: true })}
      />
    );
  }
  return <GrammarPage key={id} entry={entry} floating />;
}

/** `/grammar` (index, P3) and `/grammar/:id` (a point's page, G4). Offline, no AI. */
export function GrammarScreen() {
  const { id } = useParams();
  const t = useT();
  const back = (
    <BackButton parent={id ? paths.grammarIndex : paths.learn} label={t('grammar.back')} />
  );
  return (
    // The index's name sits in the bar; a point's page keeps the pattern as its own heading.
    <Screen topBar={<TopBar start={back} title={id ? undefined : t('grammar.title')} />}>
      {id ? <Detail id={id} /> : <GrammarIndex />}
    </Screen>
  );
}
