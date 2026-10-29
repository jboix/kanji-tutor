import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { localPoint } from '../../domain/content-language.ts';
import type { FunctionWord, GrammarEntry } from '../../domain/grammar/index.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { ExplainToggle } from '../../ui/explain-new.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { PeekLink } from '../../ui/peek-link.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import type { GrammarIntroSlotProps } from '../../ui/slots.tsx';
import { StickyActions } from '../../ui/sticky-actions.tsx';
import { TutorNext } from '../../ui/tutor.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import { useEnterKey } from '../../ui/use-enter-key.ts';
import { Formation } from './formation.tsx';
import styles from './grammar.module.css';
import { entryById, isFunctionWord, type Point } from './grammar-data.ts';
import { IntroDialogue } from './grammar-dialogues.tsx';
import { ExampleList } from './grammar-examples.tsx';
import { useGrammarTutor } from './grammar-tutor.ts';
import { JaRuns } from './ja-runs.tsx';
import { useExamples } from './use-grammar.ts';
import { Uses } from './uses.tsx';

/** Examples shown on the intro card (G4: "two examples"). */
const INTRO_EXAMPLES = 2;

/**
 * "More about this": the point's page, in a sheet inside a session so the exercise stays where
 * it was. Nothing on the page itself (its drills, or its intro), which it would only open again.
 */
function MoreAbout({ entry }: { entry: Point }) {
  const t = useT();
  const { pathname } = useLocation();
  if (pathname === paths.grammar(entry.id)) return null;
  return (
    <PeekLink kind="grammar" id={entry.id} label={entry.pattern} className={styles.link}>
      {t('grammar.moreAbout')}
    </PeekLink>
  );
}

/** Formation, two pack examples and, when it has one, a conversation, for a catalogue point. */
function PointBody({ entry }: { entry: GrammarEntry }) {
  const loaded = useExamples(entry, INTRO_EXAMPLES);
  return (
    <>
      <Formation formation={entry.formation} />
      <p className={styles.prose}>
        <JaRuns text={entry.explanation} />
      </p>
      {loaded && loaded.examples.length > 0 && <ExampleList examples={loaded.examples} />}
      <IntroDialogue grammarId={entry.id} />
    </>
  );
}

/** Explanation and two uses for a particle or function word. */
function WordBody({ word }: { word: FunctionWord }) {
  return (
    <>
      <p className={styles.prose}>
        <JaRuns text={word.explanation} />
      </p>
      <Uses word={word} limit={INTRO_EXAMPLES} />
    </>
  );
}

function IntroCard({ entry: source, onDone }: { entry: Point; onDone: () => void }) {
  const t = useT();
  const { value: entry, english } = localPoint(useContentLanguage(), source);
  const tutor = useGrammarTutor(entry);
  useEnterKey(onDone);
  return (
    <section
      className={styles.intro}
      aria-label={t('grammar.introRegion', { pattern: entry.pattern })}
    >
      <SectionLabel as="h2">{t('grammar.introLabel', { level: entry.level })}</SectionLabel>
      <p lang="ja" className={styles.introPattern}>
        {entry.pattern}
      </p>
      <p className={styles.meaning}>
        <JaRuns text={entry.meaning} />
        <EnMark english={english} />
      </p>
      {isFunctionWord(entry) ? <WordBody word={entry} /> : <PointBody entry={entry} />}
      <ExplainToggle kind="grammar" />
      <StickyActions>
        <div className={styles.actions}>
          <TutorNext tutor={tutor}>
            <PillButton block onClick={onDone}>
              {t('grammar.gotIt')}
            </PillButton>
          </TutorNext>
          <MoreAbout entry={entry} />
        </div>
      </StickyActions>
    </section>
  );
}

/** "About this grammar" under a question or drill answer (L4): no examples, no "Got it". */
function AboutCard({ entry: source }: { entry: Point }) {
  const t = useT();
  const { value: entry, english } = localPoint(useContentLanguage(), source);
  return (
    <section
      className={styles.about}
      aria-label={t('grammar.aboutRegion', { pattern: entry.pattern })}
    >
      <SectionLabel as="h2">{t('grammar.aboutLabel', { level: entry.level })}</SectionLabel>
      <p className={styles.aboutHead}>
        <span lang="ja" className={styles.aboutPattern}>
          {entry.pattern}
        </span>{' '}
        <JaRuns text={entry.meaning} />
        <EnMark english={english} />
      </p>
      {!isFunctionWord(entry) && <Formation formation={entry.formation} />}
      <p className={styles.prose}>
        <JaRuns text={entry.explanation} />
      </p>
      <MoreAbout entry={entry} />
    </section>
  );
}

/**
 * Before a grammar point's first practice (G4): pattern, meaning, formation, explanation and two
 * examples. Static: no AI. An id outside the catalogue calls `onDone` at once. `compact` gives
 * the short "about this grammar" form shown under an answer (L4).
 */
export function GrammarIntro({ grammarId, onDone, compact = false }: GrammarIntroSlotProps) {
  const entry = entryById(grammarId);
  useEffect(() => {
    if (!entry) onDone();
  }, [entry, onDone]);
  if (!entry) return null;
  return compact ? <AboutCard entry={entry} /> : <IntroCard entry={entry} onDone={onDone} />;
}
