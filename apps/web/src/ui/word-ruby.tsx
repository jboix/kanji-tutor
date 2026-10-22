import { useEffect, useState } from 'react';
import { type RubyPart, rubyParts } from '../domain/knowledge.ts';
import { hasKanji } from './furigana.ts';
import { Ruby } from './ruby.tsx';
import { useServices } from './services.tsx';
import styles from './word-ruby.module.css';

/**
 * A word heading with furigana over each kanji where the reading aligns (R11): 学 がく 生 せい,
 * 待 ま って; else one reading over the word's kanji (大人 おとな). Parts come from `rubyParts`.
 */
export function WordRuby({ parts }: { parts: readonly RubyPart[] }) {
  let at = 0;
  return (
    <span className={styles.word} lang="ja">
      {parts.map((part) => {
        const key = at;
        at += part.text.length;
        return part.reading ? (
          <Ruby key={key} base={part.text} reading={part.reading} />
        ) : (
          <span key={key}>{part.text}</span>
        );
      })}
    </span>
  );
}

/** Kanji of a surface, without 々 (it reads as the kanji before it). */
const kanjiIn = (surface: string) => [
  ...new Set([...surface].filter((c) => c !== '々' && hasKanji(c))),
];

/**
 * The parts of `surface` with `reading` over its kanji, aligned with the dictionary's KANJIDIC
 * entries once they load; undefined while loading, or when there is no reading to show.
 */
export function useRubyParts(surface: string, reading: string): RubyPart[] | undefined {
  const { repos } = useServices();
  const [loaded, setLoaded] = useState<{ key: string; parts: RubyPart[] }>();
  const key = `${surface}/${reading}`;
  useEffect(() => {
    if (reading === '' || !hasKanji(surface)) return;
    let live = true;
    void repos.dictionary.kanjiMany(kanjiIn(surface)).then((found) => {
      const kanji = new Map(found.flatMap((k) => (k ? [[k.char, k] as const] : [])));
      if (live) setLoaded({ key, parts: rubyParts(surface, reading, kanji) });
    });
    return () => {
      live = false;
    };
  }, [repos, surface, reading, key]);
  return loaded?.key === key ? loaded.parts : undefined;
}
