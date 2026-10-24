/**
 * The verdict on a sentence (Compose-natural, Compose-needs-work): one mark, ✓ natural, 〜 needs
 * work or ✕ not yet, its name, how many fixes, and the sentence with the red pen on it. Green
 * for natural, so a right sentence never reads as wrong; red stays on the pen marks.
 */
import type { Verdict } from '../../ai/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { MessageKey } from '../../ui/i18n/types.ts';
import type { Segment } from './mark-segments.ts';
import { MarkedSentence } from './marked-sentence.tsx';
import styles from './verdict-card.module.css';

const NAME = {
  natural: 'compose.verdictNatural',
  'needs-work': 'compose.verdictNeedsWork',
  'not-yet': 'compose.verdictNotYet',
} as const satisfies Record<Verdict, MessageKey>;

/** The tick and the cross, drawn; needs work is the 〜 of a style note. */
const PATH = { natural: 'M5 12.5l4.5 4.5L19 7', 'not-yet': 'M6 6l12 12M18 6 6 18' } as const;

function Mark({ verdict }: { verdict: Verdict }) {
  return (
    <span className={styles.mark} aria-hidden="true">
      {verdict === 'needs-work' ? (
        <span lang="ja">〜</span>
      ) : (
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={PATH[verdict]} />
        </svg>
      )}
    </span>
  );
}

export interface VerdictCardProps {
  verdict: Verdict;
  /** Error marks: the fixes the sentence needs. */
  fixes: number;
  segments: readonly Segment[];
}

export function VerdictCard({ verdict, fixes, segments }: VerdictCardProps) {
  const t = useT();
  const side = fixes === 0 ? t('compose.nothingToFix') : t('compose.fixes', { n: fixes });
  return (
    <section className={styles.card} data-verdict={verdict} aria-label={t(NAME[verdict])}>
      <div className={styles.head}>
        <Mark verdict={verdict} />
        <span className={styles.name}>{t(NAME[verdict])}</span>
        <span className={styles.side}>{side}</span>
      </div>
      <MarkedSentence segments={segments} className={styles.text} />
    </section>
  );
}
