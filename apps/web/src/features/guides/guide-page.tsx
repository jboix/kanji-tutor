/** A guide's page: its titles and lead, the tutor, then its tables (see `domain/guides`). */
import { type ComponentType, useMemo } from 'react';
import type { Guide, GuideId } from '../../domain/guides/index.ts';
import { GUIDE_TITLE } from '../../ui/guide-link.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { TutorCard, TutorFloat, useTutor } from '../../ui/tutor.tsx';
import { ConjugationGuide, KeigoGuide } from './conjugation-guide.tsx';
import { AdjectivesGuide, TeFormGuide } from './form-guides.tsx';
import styles from './guides.module.css';
import { PlainPoliteGuide, VerbGroupsGuide } from './verb-guides.tsx';

/** Each guide's name, one-line detail and lead in the messages. */
export const GUIDE_TEXT: Record<GuideId, { detail: PlainKey; lead: PlainKey }> = {
  'verb-groups': {
    detail: 'guides.verb-groupsDetail',
    lead: 'guides.verb-groupsLead',
  },
  'plain-polite': {
    detail: 'guides.plain-politeDetail',
    lead: 'guides.plain-politeLead',
  },
  'te-form': {
    detail: 'guides.te-formDetail',
    lead: 'guides.te-formLead',
  },
  adjectives: {
    detail: 'guides.adjectivesDetail',
    lead: 'guides.adjectivesLead',
  },
  conjugation: {
    detail: 'guides.conjugationDetail',
    lead: 'guides.conjugationLead',
  },
  keigo: { detail: 'guides.keigoDetail', lead: 'guides.keigoLead' },
};

const BODY: Record<GuideId, ComponentType> = {
  'verb-groups': VerbGroupsGuide,
  'plain-polite': PlainPoliteGuide,
  'te-form': TeFormGuide,
  adjectives: AdjectivesGuide,
  conjugation: ConjugationGuide,
  keigo: KeigoGuide,
};

/** The tutor on the guide's subject: under the titles, and floating on its own screen. */
function GuideTutor({ guide, floating }: { guide: Guide; floating: boolean }) {
  const t = useT();
  const options = useMemo(
    () => ({
      topic: {
        about: guide.titleJa,
        sentence: { text: guide.titleJa, translation: t(GUIDE_TITLE[guide.id]) },
      },
      starters: [
        t('guides.tutorMore', { x: guide.titleJa }),
        t('guides.tutorQuiz', { x: guide.titleJa }),
      ],
    }),
    [guide, t],
  );
  const tutor = useTutor(options);
  if (!tutor) return null;
  return (
    <>
      <TutorCard tutor={tutor} />
      {floating && <TutorFloat tutor={tutor} />}
      {tutor.sheet}
    </>
  );
}

/** `floating`: the guide's own screen, not a peek over a session, adds the floating Ask. */
export function GuidePage({ guide, floating = false }: { guide: Guide; floating?: boolean }) {
  const t = useT();
  const text = GUIDE_TEXT[guide.id];
  const Body = BODY[guide.id];
  return (
    <>
      <header className={styles.hero}>
        <h1 lang="ja" className={styles.titleJa}>
          {guide.titleJa}
        </h1>
        <p className={styles.title}>{t(GUIDE_TITLE[guide.id])}</p>
        <p className={styles.prose}>
          <JaRuns text={t(text.lead)} />
        </p>
      </header>
      <GuideTutor guide={guide} floating={floating} />
      <Body />
    </>
  );
}
