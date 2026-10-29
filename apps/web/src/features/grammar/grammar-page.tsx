import type { ReactNode } from 'react';
import { type ContentLookup, localPoint } from '../../domain/content-language.ts';
import type { GrammarEntry } from '../../domain/grammar/index.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { ExternalLink, ExternalLinks } from '../../ui/external-link.tsx';
import { jishoGrammarUrl } from '../../ui/external-links.ts';
import { GuideLink } from '../../ui/guide-link.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { MessageKey } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { useInSession } from '../../ui/peek-link.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { TutorCard, TutorFloat } from '../../ui/tutor.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import { Formation } from './formation.tsx';
import styles from './grammar.module.css';
import { groupLabel, isFunctionWord, type Point, relatedOf } from './grammar-data.ts';
import { PageDialogues } from './grammar-dialogues.tsx';
import { WhereYoullSeeIt } from './grammar-examples.tsx';
import { useGrammarTutor } from './grammar-tutor.ts';
import { JaRuns } from './ja-runs.tsx';
import { type PointProgress, useExamples, usePointProgress } from './use-grammar.ts';
import { Uses } from './uses.tsx';

const STATE_TEXT = {
  unseen: 'grammar.progressUnseen',
  learning: 'grammar.progressLearning',
  known: 'grammar.progressKnown',
} as const satisfies Record<PointProgress['state'], MessageKey>;

function progressText(
  { t, format }: ReturnType<typeof useI18n>,
  progress: PointProgress | undefined,
): string {
  if (!progress) return '…';
  const state = t(STATE_TEXT[progress.state]);
  if (progress.lastReviewed === undefined) return state;
  const date = format.date(progress.lastReviewed, { day: 'numeric', month: 'long' });
  return t('grammar.lastReviewed', { state, date });
}

function Hero({ entry, english }: { entry: Point; english: boolean }) {
  const i18n = useI18n();
  const progress = usePointProgress(entry.id);
  return (
    <header className={styles.hero}>
      <h1 lang="ja" className={styles.pattern}>
        {entry.pattern}
      </h1>
      <p className={styles.meaning}>
        <JaRuns text={entry.meaning} />
        <EnMark english={english} />
      </p>
      <p className={styles.meta}>
        {i18n.t('grammar.levelGroup', { level: entry.level, group: groupLabel(entry, i18n.t) })}
      </p>
      <p className={styles.meta} data-testid="grammar-state">
        {progressText(i18n, progress)}
      </p>
      <ExternalLinks>
        <ExternalLink site="jisho" href={jishoGrammarUrl(entry.pattern)} subject={entry.pattern} />
      </ExternalLinks>
    </header>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-label={label}>
      <SectionLabel as="h2">{label}</SectionLabel>
      {children}
    </section>
  );
}

/** Same-family points, with their meanings side by side so the difference shows (static). */
function Related({ entry, lookup }: { entry: Point; lookup: ContentLookup }) {
  const { t, rich } = useI18n();
  const related = relatedOf(entry).map((other) => localPoint(lookup, other).value);
  if (related.length === 0) return null;
  return (
    <Section label={t('grammar.confuse')}>
      <p className={styles.meta}>
        {rich('grammar.confuseLead', {
          pattern: <Ja>{entry.pattern}</Ja>,
          meaning: <JaRuns text={entry.meaning} />,
        })}
      </p>
      <div className={styles.rows}>
        {related.map((other) => (
          <ListRow
            key={other.id}
            to={paths.grammar(other.id)}
            detail={
              <>
                <JaRuns text={other.meaning} /> · N{other.level}
              </>
            }
          >
            <Ja variant="emph">{other.pattern}</Ja>
          </ListRow>
        ))}
      </div>
    </Section>
  );
}

/** How a catalogue point is formed, where the packs use it, and its dialogues. */
function CatalogueParts({ entry, english }: { entry: GrammarEntry; english: boolean }) {
  const t = useT();
  const loaded = useExamples(entry);
  return (
    <>
      <Section label={t('grammar.formed')}>
        <Formation formation={entry.formation} />
      </Section>
      <Explanation text={entry.explanation} english={english} />
      <Section label={t('grammar.whereSeen')}>
        <WhereYoullSeeIt loaded={loaded} level={entry.level} />
      </Section>
      <PageDialogues grammarId={entry.id} />
    </>
  );
}

function Explanation({ text, english }: { text: string; english: boolean }) {
  const t = useT();
  return (
    <Section label={t('grammar.whatItDoes')}>
      <p className={styles.prose}>
        <JaRuns text={text} />
        <EnMark english={english} />
      </p>
    </Section>
  );
}

/**
 * "Practise this point" (S5): the point's drills on the page, when the read feature is wired, a
 * full session on it after them. None over a session, which would start one inside it.
 */
function Practice({ grammarId }: { grammarId: string }) {
  const t = useT();
  const Slot = useSlot('pointPractice');
  const inSession = useInSession();
  if (!Slot || inSession) return null;
  return (
    <Section label={t('grammar.practiseInline')}>
      <Slot key={grammarId} grammarId={grammarId} />
    </Section>
  );
}

/** The tutor under the hero, and on a full page also floating, so it stays in reach (Tutor-grammar-page). */
function PageTutor({ entry, floating }: { entry: Point; floating: boolean }) {
  const tutor = useGrammarTutor(entry);
  if (!tutor) return null;
  return (
    <>
      <TutorCard tutor={tutor} />
      {floating && <TutorFloat tutor={tutor} />}
      {tutor.sheet}
    </>
  );
}

/**
 * The grammar page (G4): pattern, the tutor, formation, explanation, examples, related points,
 * practice. A particle or function word (G5) shows its uses with their examples instead.
 * `floating` (the page's own screen, not a peek over a session) adds the floating Ask.
 */
export function GrammarPage({
  entry: source,
  floating = false,
}: {
  entry: Point;
  floating?: boolean;
}) {
  const t = useT();
  const lookup = useContentLanguage();
  const { value: entry, english: fallback } = localPoint(lookup, source);
  return (
    <>
      <Hero entry={entry} english={fallback} />
      <PageTutor entry={entry} floating={floating} />
      <GuideLink grammarId={entry.id} />
      {isFunctionWord(entry) ? (
        <>
          <Explanation text={entry.explanation} english={fallback} />
          <Section label={t('grammar.howUsed')}>
            <Uses word={entry} />
          </Section>
        </>
      ) : (
        <CatalogueParts entry={entry} english={fallback} />
      )}
      <Related entry={entry} lookup={lookup} />
      <Practice grammarId={entry.id} />
    </>
  );
}
