import { useDeferredValue, useId, useMemo, useState } from 'react';
import { localFunctionWord, localGrammar } from '../../domain/content-language.ts';
import {
  FUNCTION_WORDS,
  type FunctionWord,
  GRAMMAR_CATALOGUE,
} from '../../domain/grammar/index.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { MessageKey } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './grammar.module.css';
import {
  familyLabel,
  groupByLevel,
  type LevelGroup,
  type Point,
  searchEntries,
} from './grammar-data.ts';
import { JaRuns } from './ja-runs.tsx';
import { type GrammarState, useGrammarStates } from './use-grammar.ts';

const STATE_WORD = {
  unseen: 'grammar.stateUnseen',
  learning: 'grammar.stateLearning',
  known: 'grammar.stateKnown',
} as const satisfies Record<GrammarState, MessageKey>;

type States = Map<string, GrammarState> | undefined;

function Row({ entry, states }: { entry: Point; states: States }) {
  const t = useT();
  const state = states?.get(entry.id) ?? 'unseen';
  return (
    <ListRow
      to={paths.grammar(entry.id)}
      detail={
        <>
          <JaRuns text={entry.meaning} /> · {t(STATE_WORD[state])}
        </>
      }
    >
      <Ja variant="emph">{entry.pattern}</Ja>
    </ListRow>
  );
}

function Level({ group, states }: { group: LevelGroup; states: States }) {
  const t = useT();
  return (
    <section
      className={styles.level}
      aria-label={t('grammar.levelGrammar', { level: group.level })}
    >
      <h2 className={styles.levelHead}>N{group.level}</h2>
      {group.families.map(({ family, entries }) => (
        <div key={family} className={styles.family}>
          <SectionLabel>{familyLabel(family, t)}</SectionLabel>
          <div className={styles.rows}>
            {entries.map((entry) => (
              <Row key={entry.id} entry={entry} states={states} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** Particles and function words (G5), in their own group. */
function Words({ words, states }: { words: readonly FunctionWord[]; states: States }) {
  const t = useT();
  if (words.length === 0) return null;
  return (
    <section className={styles.level} aria-label={t('grammar.functionWords')}>
      <h2 className={styles.levelHead}>{t('grammar.functionWords')}</h2>
      <div className={styles.rows}>
        {words.map((word) => (
          <Row key={word.id} entry={word} states={states} />
        ))}
      </div>
    </section>
  );
}

/** The catalogue and the particles in the learner's language, so search finds their meanings. */
function useLocalLists() {
  const lookup = useContentLanguage();
  return useMemo(
    () => ({
      catalogue: GRAMMAR_CATALOGUE.map((entry) => localGrammar(lookup, entry).value),
      functionWords: FUNCTION_WORDS.map((word) => localFunctionWord(lookup, word).value),
    }),
    [lookup],
  );
}

/** `/grammar`: every catalogue point by level and family, searchable, with the learner's state. */
export function GrammarIndex() {
  const { t, rich } = useI18n();
  const id = useId();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const states = useGrammarStates();
  const lists = useLocalLists();
  const found = searchEntries(deferred, lists.catalogue);
  const words = searchEntries(deferred, lists.functionWords);
  return (
    <>
      <p className={styles.meta}>{t('grammar.indexLead')}</p>
      <form className={styles.search} onSubmit={(e) => e.preventDefault()}>
        <label htmlFor={id} className="visually-hidden">
          {t('grammar.searchLabel')}
        </label>
        <input
          id={id}
          type="search"
          className={styles.input}
          placeholder={t('grammar.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      <Words words={words} states={states} />
      {found.length + words.length === 0 ? (
        <p className={styles.meta}>
          {rich('grammar.noMatch', { query: <JaRuns text={deferred} /> })}
        </p>
      ) : (
        groupByLevel(found).map((group) => (
          <Level key={group.level} group={group} states={states} />
        ))
      )}
    </>
  );
}
