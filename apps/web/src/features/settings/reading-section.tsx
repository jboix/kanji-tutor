import { useId, useState } from 'react';
import { DEFAULT_SESSION_MINUTES } from '../../domain/services/index.ts';
import type { FuriganaMode, SessionMinutes, Settings } from '../../domain/types.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

const FURIGANA = [
  { value: 'new', key: 'settings.furiganaNew' },
  { value: 'all', key: 'settings.furiganaAll' },
] as const satisfies readonly { value: FuriganaMode; key: PlainKey }[];

function SectionLabelText({ children }: { children: string }) {
  return (
    <span className={styles.label} aria-hidden="true">
      {children}
    </span>
  );
}

/** Default furigana in sessions (R4); the reading screen has its own toggle. */
function FuriganaField({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <div className={styles.field}>
      <SectionLabelText>{t('settings.furigana')}</SectionLabelText>
      <SegmentedControl
        label={t('settings.furigana')}
        options={FURIGANA.map((o) => ({ value: o.value, label: t(o.key) }))}
        value={settings.furigana}
        onChange={(furigana) => onPatch({ furigana })}
      />
    </div>
  );
}

const LENGTHS: readonly SessionMinutes[] = [5, 10, 15];

/** About how long a session takes (L6); 5 minutes unless changed. */
function LengthField({ settings, onPatch }: Props) {
  const t = useT();
  const value = String(settings.sessionMinutes ?? DEFAULT_SESSION_MINUTES);
  return (
    <div className={styles.field}>
      <SectionLabelText>{t('settings.sessionLength')}</SectionLabelText>
      <SegmentedControl
        label={t('settings.sessionLength')}
        options={LENGTHS.map((n) => ({
          value: String(n),
          label: t('settings.sessionMinutes', { n }),
        }))}
        value={value}
        onChange={(n) => onPatch({ sessionMinutes: Number(n) as SessionMinutes })}
      />
      <p className={styles.hint}>{t('settings.sessionLengthHint')}</p>
    </div>
  );
}

const EXPLAIN = [
  { value: 'on', key: 'settings.explainFirstOn' },
  { value: 'off', key: 'settings.explainFirstOff' },
] as const satisfies readonly { value: string; key: PlainKey }[];

/** Intro cards before new words and grammar, or a "New" chip on the exercise (L7). */
function ExplainField({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <div className={styles.field}>
      <SectionLabelText>{t('settings.explainFirst')}</SectionLabelText>
      <SegmentedControl
        label={t('settings.explainFirst')}
        options={EXPLAIN.map((o) => ({ value: o.value, label: t(o.key) }))}
        value={settings.explainFirst === false ? 'off' : 'on'}
        onChange={(value) => onPatch({ explainFirst: value === 'on' })}
      />
      <p className={styles.hint}>{t('settings.explainFirstHint')}</p>
    </div>
  );
}

const WRITE = [
  { value: 'draw', key: 'settings.writeKanjiDraw' },
  { value: 'type', key: 'settings.writeKanjiType' },
] as const satisfies readonly { value: string; key: PlainKey }[];

/** "Write the kanji" drawn on a pad, or its reading typed, for a learner who cannot draw. */
function WriteField({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <div className={styles.field}>
      <SectionLabelText>{t('settings.writeKanji')}</SectionLabelText>
      <SegmentedControl
        label={t('settings.writeKanji')}
        options={WRITE.map((o) => ({ value: o.value, label: t(o.key) }))}
        value={settings.writeKanji ?? 'draw'}
        onChange={(writeKanji) => onPatch({ writeKanji })}
      />
      <p className={styles.hint}>{t('settings.writeKanjiHint')}</p>
    </div>
  );
}

function LessonStatus({ lesson }: { lesson: string | undefined }) {
  const { t, rich } = useI18n();
  if (!lesson) return <>{t('settings.lessonNone')}</>;
  return <>{rich('settings.lessonTagged', { lesson: <JaRuns text={lesson} /> })}</>;
}

/** Lesson tag for new items, e.g. "Tobira 第4課" (K5). */
function LessonField({ settings, onPatch }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(settings.currentLesson ?? '');
  const changed = draft.trim() !== (settings.currentLesson ?? '');
  const t = useT();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {t('settings.lesson')}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          lang="ja"
          className={styles.jaInput}
          value={draft}
          placeholder="Tobira 第4課"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="button"
          className={styles.button}
          disabled={!changed}
          onClick={() => onPatch({ currentLesson: draft.trim() })}
        >
          {t('settings.save')}
        </button>
      </div>
      <p className={styles.hint}>
        <LessonStatus lesson={settings.currentLesson} />
      </p>
    </div>
  );
}

/**
 * How sessions read: length, intro cards, drawing or typing kanji, furigana default and the
 * lesson. Sound is in Appearance.
 */
export function ReadingSection(props: Props) {
  const t = useT();
  return (
    <section className={styles.section} aria-label={t('settings.reading')}>
      <LengthField {...props} />
      <ExplainField {...props} />
      <WriteField {...props} />
      <FuriganaField {...props} />
      <LessonField {...props} />
    </section>
  );
}
