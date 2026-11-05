/**
 * The kanji wall's search and filter: a field where a reading typed in romaji turns into kana
 * (ちかい, eki) or a kanji is typed as itself, the kanji that match across N5–N3, and chips that
 * keep the tiles to one state (read, learning, not yet).
 */
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  filterTiles,
  searchWall,
  type WallFilter,
  type WallTile,
} from '../../domain/services/index.ts';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { hasKanji } from '../../ui/furigana.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { PillLink } from '../../ui/pill-button.tsx';
import { useServices } from '../../ui/services.tsx';
import type { useKanaField } from '../../ui/use-kana-field.ts';
import styles from './kanji.module.css';
import { WallGrid } from './kanji-wall.tsx';

type KanaField = ReturnType<typeof useKanaField>;

const FILTERS: readonly { value: WallFilter; key: PlainKey }[] = [
  { value: 'all', key: 'kanji.wallAllStates' },
  { value: 'known', key: 'kanji.wallKnown' },
  { value: 'learning', key: 'kanji.wallLearning' },
  { value: 'not-started', key: 'kanji.wallNotYet' },
];

/** All · You read it · Learning · Not yet: one pressed at a time. */
export function WallFilters(props: { value: WallFilter; onChange: (f: WallFilter) => void }) {
  const t = useT();
  return (
    <fieldset className={styles.filters}>
      <legend className="visually-hidden">{t('kanji.wallFilter')}</legend>
      <ChipRow>
        {FILTERS.map(({ value, key }) => (
          <Chip
            key={value}
            aria-pressed={props.value === value}
            onClick={() => props.onChange(value)}
          >
            {t(key)}
          </Chip>
        ))}
      </ChipRow>
    </fieldset>
  );
}

/** The kanji in the text, without 々. */
const kanjiIn = (text: string) => [...new Set([...text].filter((c) => hasKanji(c) && c !== '々'))];

/** The search field; Enter opens the kanji typed, or the one match. */
export function WallSearch({ field, found }: { field: KanaField; found: readonly WallTile[] }) {
  const t = useT();
  const navigate = useNavigate();
  const { final, setValue: _set, ...input } = field;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const char = kanjiIn(final())[0] ?? (found.length === 1 ? found[0]?.char : undefined);
    if (char) void navigate(paths.kanjiDetail(char));
  };
  return (
    <form className={styles.field} onSubmit={submit}>
      <input
        aria-label={t('kanji.lookUpLabel')}
        lang="ja"
        className={styles.input}
        placeholder={t('kanji.lookUpPlaceholder')}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        {...input}
      />
    </form>
  );
}

/** The wall's kanji that match the query; undefined while they are looked up. */
export function useWallSearch(query: string): WallTile[] | undefined {
  const { repos } = useServices();
  const [found, setFound] = useState<{ query: string; tiles: WallTile[] }>();
  useEffect(() => {
    let live = true;
    void searchWall(repos, query).then((tiles) => live && setFound({ query, tiles }));
    return () => {
      live = false;
    };
  }, [repos, query]);
  return found?.query === query ? found.tiles : undefined;
}

/** Romaji still being typed (a lone "k") is no query to answer yet. */
const typing = (query: string) => /[a-z]/iu.test(query);

/** Nothing on the lists: the typed kanji's own page, or a plain line. */
function NoMatch({ query }: { query: string }) {
  const t = useT();
  const [char] = kanjiIn(query);
  if (char) {
    return (
      <PillLink variant="secondary" to={paths.kanjiDetail(char)}>
        {t('kanji.wallOpenKanji', { char })}
      </PillLink>
    );
  }
  if (typing(query)) return null;
  return <p className={styles.meta}>{t('kanji.wallNoMatch', { query })}</p>;
}

interface FoundProps {
  query: string;
  tiles: readonly WallTile[] | undefined;
  filter: WallFilter;
}

/** The matches, in the filter's state, as wall tiles. */
export function WallFound({ query, tiles, filter }: FoundProps) {
  const t = useT();
  if (!tiles) return null;
  const shown = filterTiles(tiles, filter);
  if (shown.length === 0) return <NoMatch query={query} />;
  return (
    <section aria-label={t('kanji.wallResults')}>
      <h2 className="visually-hidden">
        <Ja>{query}</Ja>
      </h2>
      <WallGrid tiles={shown} />
    </section>
  );
}
