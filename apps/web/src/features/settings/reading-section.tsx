import { useId, useState } from 'react';
import { DEFAULT_SESSION_MINUTES } from '../../domain/services/index.ts';
import type { FuriganaMode, SessionMinutes, Settings } from '../../domain/types.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import field from './setting-field.module.css';
import { SettingField } from './setting-field.tsx';
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

const ON_OFF = [
  { value: 'on', key: 'settings.explainFirstOn' },
  { value: 'off', key: 'settings.explainFirstOff' },
] as const satisfies readonly { value: string; key: PlainKey }[];

const LISTENING = [
  { value: 'on', key: 'settings.listeningOn' },
  { value: 'off', key: 'settings.listeningOff' },
] as const satisfies readonly { value: string; key: PlainKey }[];

const WRITE = [
  { value: 'draw', key: 'settings.writeKanjiDraw' },
  { value: 'type', key: 'settings.writeKanjiType' },
] as const satisfies readonly { value: 'draw' | 'type'; key: PlainKey }[];

interface ChoiceProps<T extends string> {
  name: PlainKey;
  hintKey?: PlainKey;
  options: readonly { value: T; key: PlainKey }[];
  value: T;
  onChange: (value: T) => void;
}

/** A setting of two or three choices, its explanation behind its ?. */
function ChoiceField<T extends string>(props: ChoiceProps<T>) {
  const { name, hintKey, options, value, onChange } = props;
  const t = useT();
  return (
    <SettingField label={t(name)} hint={hintKey && t(hintKey)}>
      <SegmentedControl
        label={t(name)}
        options={options.map((o) => ({ value: o.value, label: t(o.key) }))}
        value={value}
        onChange={onChange}
      />
    </SettingField>
  );
}

const LENGTHS: readonly SessionMinutes[] = [5, 10, 15];

/** About how long a session takes (L6); 5 minutes unless changed. */
function LengthField({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <SettingField label={t('settings.sessionLength')} hint={t('settings.sessionLengthHint')}>
      <SegmentedControl
        label={t('settings.sessionLength')}
        options={LENGTHS.map((n) => ({
          value: String(n),
          label: t('settings.sessionMinutes', { n }),
        }))}
        value={String(settings.sessionMinutes ?? DEFAULT_SESSION_MINUTES)}
        onChange={(n) => onPatch({ sessionMinutes: Number(n) as SessionMinutes })}
      />
    </SettingField>
  );
}

/** Intro cards before new words and grammar (L7), and the default furigana (R4). */
function TeachingChoices({ settings, onPatch }: Props) {
  return (
    <>
      <ChoiceField
        name="settings.explainFirst"
        hintKey="settings.explainFirstHint"
        options={ON_OFF}
        value={settings.explainFirst === false ? 'off' : 'on'}
        onChange={(value) => onPatch({ explainFirst: value === 'on' })}
      />
      <ChoiceField
        name="settings.furigana"
        options={FURIGANA}
        value={settings.furigana}
        onChange={(furigana) => onPatch({ furigana })}
      />
    </>
  );
}

/** Listening exercises on or off (S4), and "Write the kanji" drawn or typed. */
function ExerciseChoices({ settings, onPatch }: Props) {
  return (
    <>
      <ChoiceField
        name="settings.listening"
        hintKey="settings.listeningHint"
        options={LISTENING}
        value={settings.listening === false ? 'off' : 'on'}
        onChange={(value) => onPatch({ listening: value === 'on' })}
      />
      <ChoiceField
        name="settings.writeKanji"
        hintKey="settings.writeKanjiHint"
        options={WRITE}
        value={settings.writeKanji ?? 'draw'}
        onChange={(writeKanji) => onPatch({ writeKanji })}
      />
    </>
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
    <div className={field.setting}>
      <label htmlFor={id} className={field.settingName}>
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
 * How sessions read: length, intro cards, listening, drawing or typing kanji, furigana default
 * and the lesson. Sound is in Appearance.
 */
export function ReadingSection(props: Props) {
  const t = useT();
  return (
    <section className={styles.section} aria-label={t('settings.reading')}>
      <LengthField {...props} />
      <TeachingChoices {...props} />
      <ExerciseChoices {...props} />
      <LessonField {...props} />
    </section>
  );
}
