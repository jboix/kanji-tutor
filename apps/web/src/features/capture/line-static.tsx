import { useEffect, useMemo, useState } from 'react';
import { sentenceGrammar } from '../../domain/grammar/index.ts';
import { glossesIn } from '../../domain/localized.ts';
import type { Token, Word } from '../../domain/types.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';
import { TapRun } from '../../ui/word-tap.tsx';
import { looseSentence } from '../../ui/word-tap-data.ts';
import styles from './line-static.module.css';

/** One line per distinct dictionary word of the line, in order. */
interface Gloss {
  token: Token;
  word: Word;
}

function wordTokens(tokens: readonly Token[]): Token[] {
  const seen = new Set<string>();
  return tokens.filter(
    (t) =>
      t.wordId !== undefined && t.pos !== 'symbol' && !seen.has(t.wordId) && seen.add(t.wordId),
  );
}

function useGlosses(tokens: readonly Token[]): Gloss[] {
  const { repos } = useServices();
  const [glosses, setGlosses] = useState<Gloss[]>([]);
  useEffect(() => {
    let live = true;
    const picked = wordTokens(tokens);
    void repos.dictionary.words(picked.map((t) => t.wordId ?? '')).then((words) => {
      const found = picked.flatMap((t, i) => (words[i] ? [{ token: t, word: words[i] }] : []));
      if (live) setGlosses(found);
    });
    return () => {
      live = false;
    };
  }, [repos, tokens]);
  return glosses;
}

/** A word's first meaning in the learner's language, or in English with "(en)" (N9). */
function FirstGloss({ word }: { word: Word }) {
  const { language } = useI18n();
  const { value, fallback } = glossesIn(word, language);
  return (
    <>
      {value[0] ?? ''}
      <EnMark english={fallback} />
    </>
  );
}

/**
 * The tapped line from the dictionary and the grammar catalogue (A13): each word with its first
 * meaning, and the grammar points found in it. The tutor explains it only when asked.
 */
export function LineStatic({ tokens, text }: { tokens: readonly Token[]; text: string }) {
  const glosses = useGlosses(tokens);
  // Each word opens its word sheet in the line (U5).
  const line = useMemo(
    () => looseSentence(`capture-line:${text}`, text, tokens, 'capture'),
    [text, tokens],
  );
  const grammar = useMemo(() => sentenceGrammar({ tokens: [...tokens] }), [tokens]);
  const { t } = useI18n();
  return (
    <div className={styles.lineStatic}>
      {glosses.length > 0 && (
        <section aria-label={t('capture.lineWords')}>
          <SectionLabel>{t('capture.lineWords')}</SectionLabel>
          <ul className={styles.glossList}>
            {glosses.map(({ token, word }) => (
              <li key={word.id}>
                <TapRun
                  sentence={line}
                  from={token.start}
                  to={token.start + token.surface.length}
                />{' '}
                · <FirstGloss word={word} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {grammar.length > 0 && (
        <section aria-label={t('capture.lineGrammar')}>
          <SectionLabel>{t('capture.lineGrammar')}</SectionLabel>
          <ul className={styles.glossList}>
            {grammar.map((entry) => (
              <li key={entry.id}>
                <Ja>{entry.pattern}</Ja> · {entry.meaning}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
