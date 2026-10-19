/**
 * "Written by the tutor" (A18, D64): content the AI wrote keeps this mark wherever it shows up
 * again, in exercises and lists too. Example sentences the tutor wrote (`source: 'ai'`) are
 * written by it; lines captured from a photo (`aiRead`) were read by it.
 */
import { AiSeal } from './ai-seal.tsx';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import styles from './tutor-mark.module.css';

/** What a sentence needs to say where it came from. */
export interface SentenceOrigin {
  source?: string | undefined;
  /** True for a captured line the tutor read from a photo. */
  aiRead?: boolean | undefined;
}

/** How the tutor took part in a text: wrote it, read it from a photo, or not at all. */
export function tutorOrigin(origin: SentenceOrigin): 'written' | 'read' | undefined {
  if (origin.source === 'ai') return 'written';
  return origin.aiRead ? 'read' : undefined;
}

/** The mark under (or beside) a text the tutor wrote; nothing for any other text. */
export function TutorMark({ of, inline }: { of: SentenceOrigin; inline?: boolean }) {
  const t = useT();
  const origin = tutorOrigin(of);
  if (!origin) return null;
  return (
    <span className={cx(styles.mark, inline && styles.inline)} data-tutor-mark={origin}>
      <AiSeal size={16} />
      {origin === 'written' ? t('ui.byTutorWritten') : t('ui.byTutorRead')}
    </span>
  );
}
