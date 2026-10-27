/**
 * A grammar dialogue as the intro card, the grammar page and the "complete the line" drill show
 * it: each line with its speaker's portrait (the cast) or initial on a disc, the grammar form underlined in
 * indigo, and its translation under it. Static content written for the app, so nothing here
 * looks like the tutor. The Japanese shows as written: no hand-written readings.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { castOf } from '../domain/cast.ts';
import {
  type Dialogue,
  type DialogueLine,
  dialogueText,
  focusRange,
} from '../domain/dialogues/index.ts';
import { PATTERN_BLANK } from '../domain/drills/index.ts';
import { canSpeak, speak, stopSpeaking } from '../lang/speech.ts';
import { Portrait } from './cast-portrait.tsx';
import { Chip } from './chip.tsx';
import { cx } from './cx.ts';
import styles from './dialogue.module.css';
import { EnMark } from './en-mark.tsx';
import { useT } from './i18n/i18n.tsx';
import type { PlainKey } from './i18n/types.ts';
import { SpeakerIcon } from './icons.tsx';
import { useContentLanguage } from './use-content-language.ts';

/**
 * How a line's grammar form shows: underlined (`focus`), blanked before a drill's answer, or once
 * answered right, missed, or shown after "I don't know".
 */
export type FocusLook = 'focus' | 'blank' | 'correct' | 'missed' | 'shown';

const SETTING = {
  friends: 'dialogues.settingFriends',
  family: 'dialogues.settingFamily',
  work: 'dialogues.settingWork',
  school: 'dialogues.settingSchool',
  shop: 'dialogues.settingShop',
} as const satisfies Record<Dialogue['setting'], PlainKey>;

const REGISTER = {
  plain: 'dialogues.registerPlain',
  polite: 'dialogues.registerPolite',
} as const satisfies Record<Dialogue['register'], PlainKey>;

/** "Friends · plain", "At work · polite". */
export function RegisterLabel({ dialogue }: { dialogue: Dialogue }) {
  const t = useT();
  const label = t('dialogues.register', {
    setting: t(SETTING[dialogue.setting]),
    register: t(REGISTER[dialogue.register]),
  });
  return <span className={styles.register}>{label}</span>;
}

/** The line in Klee One, its grammar form picked out (or blanked). */
function LineText({ line, look }: { line: DialogueLine; look: FocusLook }) {
  const range = focusRange(line);
  if (!range) return <span className={styles.ja}>{line.ja}</span>;
  const form = look === 'blank' ? PATTERN_BLANK : line.ja.slice(range.from, range.to);
  return (
    <span className={styles.ja}>
      {line.ja.slice(0, range.from)}
      <span className={cx(styles.focus, styles[look])} data-focus={look}>
        {form}
      </span>
      {line.ja.slice(range.to)}
    </span>
  );
}

/** The speaker's portrait when they are one of the cast, else their initial on a disc. */
function Speaker({ name, by }: { name: string; by: 0 | 1 }) {
  const t = useT();
  const cast = castOf(name);
  return (
    <>
      {cast ? (
        <span className={styles.face}>
          <Portrait who={cast.id} size={32} />
        </span>
      ) : (
        <span className={cx(styles.chip, by === 1 && styles.other)} aria-hidden="true">
          {name.charAt(0)}
        </span>
      )}
      <span className="visually-hidden">{t('dialogues.speaker', { name })}</span>
    </>
  );
}

function Translation(props: { line: DialogueLine; id?: string; hidden?: boolean }) {
  const { language } = useContentLanguage();
  const { value, english } = dialogueText(props.line.tr, language);
  return (
    <p id={props.id} className={styles.translation} hidden={props.hidden}>
      {value}
      <EnMark english={english} />
    </p>
  );
}

interface LineProps {
  dialogue: Dialogue;
  line: DialogueLine;
  look: FocusLook;
}

/** A line to tap: its translation shows under it, and hides on a second tap. */
function TapLine({ dialogue, line, look }: LineProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.line}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((was) => !was)}
      >
        <Speaker name={dialogue.speakers[line.by]} by={line.by} />
        <span lang="ja">
          <LineText line={line} look={look} />
        </span>
      </button>
      <Translation line={line} id={id} hidden={!open} />
    </li>
  );
}

/** A line as it stands, its translation shown when asked for. */
function StaticLine({ dialogue, line, look, translated }: LineProps & { translated: boolean }) {
  return (
    <li className={styles.row}>
      <p className={styles.line}>
        <Speaker name={dialogue.speakers[line.by]} by={line.by} />
        <span lang="ja">
          <LineText line={line} look={look} />
        </span>
      </p>
      {translated && <Translation line={line} />}
    </li>
  );
}

export interface DialogueLinesProps {
  dialogue: Dialogue;
  /** How each line's form shows; underlined by default. */
  lookOf?: (index: number) => FocusLook;
  /** The lines whose translation shows. Without it, each line is tapped to show its own. */
  translated?: (index: number) => boolean;
}

/** The dialogue's lines (see the module comment). */
export function DialogueLines({ dialogue, lookOf, translated }: DialogueLinesProps) {
  const t = useT();
  const [a, b] = dialogue.speakers;
  return (
    <ol className={styles.lines} aria-label={t('dialogues.between', { a, b })}>
      {dialogue.lines.map((line, i) => {
        const look = lookOf?.(i) ?? 'focus';
        const key = `${dialogue.id}:${i}`;
        return translated ? (
          <StaticLine
            key={key}
            dialogue={dialogue}
            line={line}
            look={look}
            translated={translated(i)}
          />
        ) : (
          <TapLine key={key} dialogue={dialogue} line={line} look={look} />
        );
      })}
    </ol>
  );
}

/**
 * "Play": the lines read one after the other with the device's Japanese voice (R7). Hidden when
 * the app may not speak; leaving the screen stops it.
 */
export function PlayDialogue({ lines }: { lines: readonly string[] }) {
  const t = useT();
  const run = useRef(0);
  useEffect(
    () => () => {
      run.current += 1;
      stopSpeaking();
    },
    [],
  );
  if (!canSpeak()) return null;
  const play = async () => {
    run.current += 1;
    const mine = run.current;
    for (const line of lines) {
      if (run.current !== mine) return;
      await speak(line);
    }
  };
  return (
    <Chip icon={<SpeakerIcon />} aria-label={t('dialogues.playLabel')} onClick={() => void play()}>
      {t('dialogues.play')}
    </Chip>
  );
}
