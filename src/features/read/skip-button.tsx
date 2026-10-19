import styles from './read.module.css';
import { SessionCopy } from './session-copy.tsx';

/**
 * "I don't know" (L4): shows the answer instead and schedules the item again soon. A quiet text
 * button under the answer, never blaming; the 44px target extends past the text.
 */
export function SkipButton({ onSkip }: { onSkip: () => void }) {
  return (
    <button type="button" className={styles.skip} onClick={onSkip}>
      <SessionCopy k="skip" />
    </button>
  );
}
