import { type FormEvent, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { glossesIn } from '../../domain/localized.ts';
import type { Word } from '../../domain/types.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { SearchIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { useKanaField } from '../../ui/use-kana-field.ts';
import styles from './learn.module.css';
import { grammarMatches, kanjiIn } from './look-up.ts';
import { useWordSuggestions } from './use-learn.ts';

function KanjiLinks({ chars }: { chars: string[] }) {
  return (
    <span className={styles.kanjiLinks}>
      {chars.map((char) => (
        <Link key={char} to={paths.kanjiDetail(char)} lang="ja" className={styles.cell}>
          {char}
        </Link>
      ))}
    </span>
  );
}

function WordRow({ word }: { word: Word }) {
  const { language } = useI18n();
  const form = word.forms[0] ?? word.readings[0] ?? '';
  const glosses = glossesIn(word, language);
  return (
    <li className={styles.result}>
      <span className={styles.resultText}>
        <Ja variant="emph">{form}</Ja> <Ja>{word.readings[0]}</Ja> · {glosses.value[0]}
        <EnMark english={glosses.fallback} />
      </span>
      <KanjiLinks chars={kanjiIn(form)} />
    </li>
  );
}

function Results({ query }: { query: string }) {
  const t = useT();
  const typed = kanjiIn(query);
  const words = useWordSuggestions(query, typed.length === 0);
  const grammar = useMemo(() => grammarMatches(query), [query]);
  if (query.trim() === '') return null;
  const none = typed.length === 0 && words.length === 0 && grammar.length === 0;
  return (
    <div className={styles.results} aria-live="polite">
      {typed.length > 0 && <KanjiLinks chars={typed} />}
      {words.length > 0 && (
        <ul className={styles.resultList} aria-label={t('learn.words')}>
          {words.map((word) => (
            <WordRow key={word.id} word={word} />
          ))}
        </ul>
      )}
      {grammar.length > 0 && (
        <ul className={styles.resultList} aria-label={t('learn.grammarFound')}>
          {grammar.map((g) => (
            <li key={g.id} className={styles.result}>
              <Link to={paths.grammar(g.id)} lang="ja" className={styles.grammarLink}>
                {g.pattern}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {none && <p className={styles.muted}>{t('learn.nothingFound')}</p>}
    </div>
  );
}

/**
 * Look up a kanji, a word or a grammar point (IA4): romaji turns into kana, kanji open their
 * page, kana suggests words with their kanji, and patterns match the grammar catalogue.
 */
export function LearnSearch() {
  const t = useT();
  const navigate = useNavigate();
  const { final, setValue: _set, ...field } = useKanaField(true);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = final();
    const [kanji] = kanjiIn(query);
    const [grammar] = grammarMatches(query, 1);
    if (kanji) void navigate(paths.kanjiDetail(kanji));
    else if (grammar) void navigate(paths.grammar(grammar.id));
  };
  return (
    <section className={styles.search} aria-label={t('learn.lookUp')}>
      <form className={styles.field} onSubmit={submit}>
        <SearchIcon />
        <input
          type="search"
          aria-label={t('learn.lookUp')}
          lang="ja"
          className={styles.input}
          placeholder={t('learn.lookUpPlaceholder')}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          {...field}
        />
      </form>
      <Results query={field.value} />
    </section>
  );
}
