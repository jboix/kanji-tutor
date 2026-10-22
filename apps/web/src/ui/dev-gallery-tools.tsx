import { useState } from 'react';
import { AiBlock } from './ai-block.tsx';
import { AnswerInput } from './answer-input.tsx';
import { BottomNav } from './bottom-nav.tsx';
import styles from './dev-gallery.module.css';
import { Sample } from './dev-gallery-read.tsx';
import { IconButton } from './icon-button.tsx';
import { BackIcon, MicIcon, UndoIcon } from './icons.tsx';
import { Ja } from './ja.tsx';
import { ProgressLine } from './progress-line.tsx';
import { Reading } from './reading.tsx';
import { SegmentedControl } from './segmented-control.tsx';
import { TopBar } from './top-bar.tsx';

const MODES = [
  { value: 'draw', label: 'Draw' },
  { value: 'describe', label: 'Describe' },
] as const;

export function HandwriteSample() {
  const [mode, setMode] = useState<'draw' | 'describe'>('draw');
  return (
    <Sample name="handwrite.html · SegmentedControl, IconButton soft, AiBlock panel">
      <div className={styles.flush}>
        <TopBar
          start={
            <IconButton aria-label="Back">
              <BackIcon />
            </IconButton>
          }
          center={
            <SegmentedControl label="Input mode" options={MODES} value={mode} onChange={setMode} />
          }
        />
      </div>
      <IconButton look="soft" aria-label="Undo last stroke">
        <UndoIcon />
      </IconButton>
      <AiBlock
        size="panel"
        detail={<>"The one from class with a temple on the right, it meant waiting"</>}
      >
        Can't draw it? Describe it.
      </AiBlock>
    </Sample>
  );
}

export function InputsSample() {
  const [answer, setAnswer] = useState('');
  return (
    <Sample name="AnswerInput (live kana), Reading, ProgressLine">
      <AnswerInput
        label="Reading of 待って"
        placeholder="Type the reading in romaji"
        onSubmit={setAnswer}
        trailing={
          <IconButton size={36} muted aria-label="Answer by voice">
            <MicIcon />
          </IconButton>
        }
      />
      <div className={styles.muted}>
        Submitted: <Ja>{answer || '—'}</Ja>
      </div>
      <div className={styles.wrote}>
        <Reading kana="まって" /> <Reading kana="あいだに" verified={false} />
      </div>
      <ProgressLine value={0.82} label="You can read 82% of this" />
    </Sample>
  );
}

export function NavSample() {
  return (
    <Sample name="BottomNav">
      <div className={styles.flush}>
        <BottomNav />
      </div>
    </Sample>
  );
}
