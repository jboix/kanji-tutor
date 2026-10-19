import { useState } from 'react';
import styles from './dev-gallery.module.css';
import { ComposeSample, KanjiSample, NotesSample } from './dev-gallery-more.tsx';
import { ExplainSample, ReadSample, TodaySample, VoiceSample } from './dev-gallery-read.tsx';
import { HandwriteSample, InputsSample, NavSample } from './dev-gallery-tools.tsx';
import { SegmentedControl } from './segmented-control.tsx';

type Theme = 'light' | 'dark';
type Layout = 'both' | Theme;

const LAYOUTS = [
  { value: 'both', label: 'Both' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

function Pane({ theme }: { theme: Theme }) {
  return (
    <div data-theme={theme} className={styles.pane}>
      <div className={styles.phone}>
        <h2 className={styles.paneTitle}>{theme === 'light' ? 'Light' : 'Dark'}</h2>
        <TodaySample />
        <ReadSample />
        <VoiceSample />
        <ExplainSample />
        <ComposeSample />
        <KanjiSample />
        <HandwriteSample />
        <NotesSample />
        <InputsSample />
        <NavSample />
      </div>
    </div>
  );
}

/** Every shared component in light and dark, with content from the mockups (`/dev/ui`). */
export function DevGallery() {
  const [layout, setLayout] = useState<Layout>('both');
  return (
    <div className={styles.gallery}>
      <div className={styles.toolbar}>
        <SegmentedControl label="Theme" options={LAYOUTS} value={layout} onChange={setLayout} />
      </div>
      {layout !== 'dark' && <Pane theme="light" />}
      {layout !== 'light' && <Pane theme="dark" />}
    </div>
  );
}
