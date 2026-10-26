import { useState } from 'react';
import type { Dialogue } from '../domain/dialogues/types.ts';
import { ActionRow } from './action-bar.tsx';
import { Chip, ChipRow } from './chip.tsx';
import styles from './dev-gallery.module.css';
import { Sample } from './dev-gallery-read.tsx';
import { DialogueLines } from './dialogue.tsx';
import { PillButton } from './pill-button.tsx';
import { ProgressLine } from './progress-line.tsx';
import { SegmentedControl } from './segmented-control.tsx';
import { type Tutor, TutorNext } from './tutor.tsx';

const THEMES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

const noop = () => undefined;

const TUTOR: Tutor = {
  topic: { about: '〜ぐらい', sentence: { text: '何分ぐらいかかる？' } },
  starters: [],
  open: noop,
  carryOn: noop,
  sheet: null,
};

const DIALOGUE: Dialogue = {
  id: 'gallery',
  setting: 'friends',
  register: 'plain',
  speakers: ['ゆき', 'けん'],
  lines: [
    { by: 0, ja: '電車が止まってしまった。', tr: { en: 'The train stopped.', fr: '', es: '' } },
    {
      by: 1,
      ja: '何分ぐらいかかる？',
      focus: 'ぐらい',
      tr: { en: 'About how long?', fr: '', es: '' },
    },
  ],
  blank: { line: 1, distractors: ['まで', 'ほど', 'しか'], why: { en: '', fr: '', es: '' } },
};

/** The Buttons sheet: primary, secondary, text, the theme control and Ask, in both themes. */
export function ButtonsSample() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('dark');
  return (
    <Sample name="Buttons · PillButton, SegmentedControl, TutorNext (Ask, Ask square)">
      <div className={styles.row}>
        <PillButton grow={1}>Continue</PillButton>
        <PillButton grow={1} disabled>
          Check
        </PillButton>
      </div>
      <div className={styles.row}>
        <PillButton variant="secondary">Write it</PillButton>
        <PillButton variant="text">Not now</PillButton>
      </div>
      <SegmentedControl label="Theme" options={THEMES} value={theme} onChange={setTheme} />
      <TutorNext tutor={TUTOR}>
        <PillButton block>Check</PillButton>
      </TutorNext>
      <TutorNext tutor={TUTOR}>
        <ActionRow>
          <PillButton variant="secondary">Rewrite</PillButton>
          <PillButton>Save</PillButton>
        </ActionRow>
      </TutorNext>
    </Sample>
  );
}

/** Chips in every state, the progress line and a dialogue's cast discs. */
export function ChipsSample() {
  return (
    <Sample name="Chip states, ProgressLine, DialogueLines">
      <ChipRow>
        <Chip aria-pressed={false}>Words</Chip>
        <Chip aria-pressed>Kanji</Chip>
        <Chip data-state="right" lang="ja">
          かかる
        </Chip>
        <Chip data-state="miss" lang="ja">
          かける
        </Chip>
      </ChipRow>
      <ProgressLine value={0.4} label="3 of 8" />
      <DialogueLines dialogue={DIALOGUE} translated={() => false} />
    </Sample>
  );
}
