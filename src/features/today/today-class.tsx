import type { TodayOverview } from '../../domain/services/index.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { ProgressRow } from '../../ui/progress-line.tsx';
import { SectionHeader } from '../../ui/section-label.tsx';
import styles from './today.module.css';

type Progress = TodayOverview['progress'];

function Counts({ progress }: { progress: Progress }) {
  const t = useT();
  const { words, grammar } = progress;
  return (
    <>
      {words.total > 0 && (
        <ProgressRow
          label={t('today.wordsRead')}
          valueText={t('today.doneOf', { done: words.done, total: words.total })}
          done={words.done}
          total={words.total}
        />
      )}
      {grammar.total > 0 && (
        <ProgressRow
          label={t('today.grammarUsed')}
          valueText={t('today.doneOf', { done: grammar.done, total: grammar.total })}
          done={grammar.done}
          total={grammar.total}
        />
      )}
    </>
  );
}

function Lookalike({ lookalike }: { lookalike: NonNullable<TodayOverview['lookalike']> }) {
  const t = useT();
  const [a, b] = lookalike.pair;
  return (
    <ListRow
      to={paths.kanjiDetail(a)}
      inline
      detail={t('today.stillSwapping', { n: lookalike.times })}
    >
      <Ja variant="emph">
        {a} {b}
      </Ja>
    </ListRow>
  );
}

function hasContent({ progress, lookalike }: TodayOverview): boolean {
  const { words, grammar, nextGrammar } = progress;
  return words.total + grammar.total > 0 || nextGrammar !== undefined || lookalike !== undefined;
}

/** "This week in class" (today.html): lesson progress, one sentence to write, a lookalike pair. */
export function ClassSection({ summary }: { summary: TodayOverview }) {
  const { t, rich } = useI18n();
  if (!hasContent(summary)) return null;
  const { progress, lookalike } = summary;
  const meta = progress.lesson ? <JaRuns text={progress.lesson} /> : t('today.thisWeek');
  return (
    <section className={styles.class} aria-label={t('today.inClass')}>
      <SectionHeader title={t('today.inClass')} meta={meta} />
      <Counts progress={progress} />
      {progress.nextGrammar && (
        <ListRow
          to={`${paths.compose}?grammar=${encodeURIComponent(progress.nextGrammar.id)}`}
          detail={t('today.notUsedYet')}
        >
          {rich('today.writeOne', { pattern: <b lang="ja">{progress.nextGrammar.pattern}</b> })}
        </ListRow>
      )}
      {lookalike && <Lookalike lookalike={lookalike} />}
    </section>
  );
}
