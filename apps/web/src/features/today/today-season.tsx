/**
 * The word of the season at the top of Home: a leaf, when in the old calendar it is, the word
 * with its reading and a short gloss. A tap opens the word sheet on its example, with every
 * sense, its kanji and the tutor. Nothing shows until the dictionary has the word.
 */
import { useEffect, useState } from 'react';
import { glossesIn } from '../../domain/localized.ts';
import type { Season, SeasonPhase } from '../../domain/seasons.ts';
import { seasonExample } from '../../domain/seasons.ts';
import { type SeasonWordView, seasonWord } from '../../domain/services/index.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { ChevronIcon, LeafIcon } from '../../ui/icons.tsx';
import { useServices } from '../../ui/services.tsx';
import { useWordSheet } from '../../ui/word-tap.tsx';
import { looseSentence } from '../../ui/word-tap-data.ts';
import styles from './today-season.module.css';

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const whenKey = (phase: SeasonPhase, season: Season) =>
  `today.season${capital(phase)}${capital(season)}` as PlainKey;

function useSeasonWord(now: number) {
  const { repos } = useServices();
  const [view, setView] = useState<SeasonWordView>();
  useEffect(() => {
    let live = true;
    void seasonWord(repos, now).then((found) => live && setView(found));
    return () => {
      live = false;
    };
  }, [repos, now]);
  return view;
}

/** The gloss in the learner's language: the app's own in English, else the dictionary's. */
function useGloss(view: SeasonWordView) {
  const { language } = useI18n();
  if (language.startsWith('en')) return { text: view.word.gloss, english: false };
  const own = glossesIn(view.entry, language);
  if (own.fallback || !own.value[0]) return { text: view.word.gloss, english: true };
  return { text: own.value[0], english: false };
}

function exampleOf(view: SeasonWordView) {
  const { text, tokens, index } = seasonExample(view.word, view.entry.id);
  const sentence = looseSentence(`season:${view.word.written}`, text, tokens);
  return { sentence: { ...sentence, translation: view.word.translation }, index };
}

function SeasonCard({ view }: { view: SeasonWordView }) {
  const { t } = useI18n();
  const gloss = useGloss(view);
  const { open, sheet } = useWordSheet();
  const show = () => {
    const { sentence, index } = exampleOf(view);
    open?.(sentence, index);
  };
  return (
    <>
      <button type="button" className={styles.card} onClick={show} disabled={!open}>
        <span className={styles.disc} aria-hidden="true">
          <LeafIcon />
        </span>
        <span className={styles.lines}>
          <span className={styles.label}>
            {t('today.seasonWord', { when: t(whenKey(view.phase, view.season)) })}
          </span>
          <span className={styles.word}>
            <span lang="ja" className={styles.written}>
              {view.word.written}
            </span>
            <span lang="ja" className={styles.reading}>
              {view.word.reading}
            </span>
            <span className={styles.gloss}>
              {gloss.text}
              <EnMark english={gloss.english} />
            </span>
          </span>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>
      {sheet}
    </>
  );
}

/** The card (see the module comment), or nothing until the word is found. */
export function SeasonWordCard({ now }: { now: number }) {
  const view = useSeasonWord(now);
  return view ? <SeasonCard view={view} /> : null;
}
