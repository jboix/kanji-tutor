import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { glossesIn } from '../../domain/localized.ts';
import type { Word } from '../../domain/types.ts';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { hasKanji } from '../../ui/furigana.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useKanaField } from '../../ui/use-kana-field.ts';
import styles from './kanji.module.css';
import { useRecentKanji, useSuggestions } from './use-kanji.ts';

function kanjiIn(text: string): string[] {
  return [...new Set([...text].filter((c) => hasKanji(c) && c !== '々'))];
}

function KanjiLinks({ chars }: { chars: string[] }) {
  return (
    <div className={styles.grid}>
      {chars.map((char) => (
        <Link key={char} to={paths.kanjiDetail(char)} lang="ja" className={styles.cell}>
          {char}
        </Link>
      ))}
    </div>
  );
}

function Suggestions({ words, onPick }: { words: Word[]; onPick: (word: Word) => void }) {
  if (words.length === 0) return null;
  return (
    <ChipRow>
      {words.map((word) => (
        <Chip key={word.id} onClick={() => onPick(word)}>
          <Ja>{word.forms[0] ?? word.readings[0]}</Ja>
        </Chip>
      ))}
    </ChipRow>
  );
}

function Picked({ word }: { word: Word }) {
  const { t, language } = useI18n();
  const chars = kanjiIn(word.forms[0] ?? '');
  const glosses = glossesIn(word, language);
  return (
    <div className={styles.picked}>
      <p className={styles.meta}>
        <Ja>{word.forms[0] ?? ''}</Ja> <Ja>{word.readings[0]}</Ja> · {glosses.value[0]}
        <EnMark english={glosses.fallback} />
      </p>
      {chars.length > 0 ? (
        <KanjiLinks chars={chars} />
      ) : (
        <p className={styles.meta}>{t('kanji.kanaOnly')}</p>
      )}
    </div>
  );
}

/** Search by kanji or reading (I1): romaji turns to kana, kana suggests words, words give kanji. */
function Search() {
  const t = useT();
  const navigate = useNavigate();
  const { final, setValue: _set, ...field } = useKanaField(true);
  const typed = kanjiIn(field.value);
  const words = useSuggestions(field.value, typed.length === 0);
  const [picked, setPicked] = useState<Word>();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const [first] = kanjiIn(final());
    if (first) void navigate(paths.kanjiDetail(first));
  };
  return (
    <section className={styles.search} aria-label={t('kanji.lookUp')}>
      <form className={styles.field} onSubmit={submit}>
        <input
          aria-label={t('kanji.lookUpLabel')}
          lang="ja"
          className={styles.input}
          placeholder={t('kanji.lookUpPlaceholder')}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          {...field}
        />
      </form>
      {typed.length > 0 ? (
        <KanjiLinks chars={typed} />
      ) : (
        <Suggestions words={words} onPick={setPicked} />
      )}
      {picked && typed.length === 0 && <Picked word={picked} />}
    </section>
  );
}

/** The kanji index: look up, this week's kanji, draw a kanji. */
export function KanjiIndex() {
  const t = useT();
  const recent = useRecentKanji();
  return (
    <>
      <Search />
      <section className={styles.recent} aria-label={t('kanji.thisWeek')}>
        <SectionLabel>{t('kanji.thisWeek')}</SectionLabel>
        {recent.length > 0 ? (
          <KanjiLinks chars={recent} />
        ) : (
          <p className={styles.meta}>{t('kanji.thisWeekEmpty')}</p>
        )}
      </section>
      <div>
        <ListRow to={paths.handwrite} detail={t('kanji.drawDetail')}>
          {t('kanji.draw')}
        </ListRow>
      </div>
    </>
  );
}
