/**
 * "Practise this point" on a grammar page (S5, the `pointPractice` slot): the point's drills one
 * after another on the page, each answered and recorded as in a session, then plain counts and
 * "Practise again". The first drill does not take the focus, so the keyboard stays shut until
 * the learner starts.
 */
import { type ReactNode, useEffect, useState } from 'react';
import { pointPractice } from '../../domain/services/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import { canListen } from '../../lang/speech.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { useServices } from '../../ui/services.tsx';
import type { PointPracticeSlotProps } from '../../ui/slots.tsx';
import { DrillCard } from './drill-screen.tsx';
import styles from './read.module.css';
import { AutoFocus } from './read-actions.tsx';
import type { DrillResult } from './session-state.ts';

function usePointCards(grammarId: string, round: number): SessionCard[] | undefined {
  const { repos } = useServices();
  const [loaded, setLoaded] = useState<{ key: string; cards: SessionCard[] }>();
  const key = `${grammarId}|${round}`;
  useEffect(() => {
    let live = true;
    void canListen()
      .then((listening) => pointPractice(repos, grammarId, { now: Date.now(), listening }))
      .then((cards) => {
        if (live) setLoaded({ key, cards });
      });
    return () => {
      live = false;
    };
  }, [repos, grammarId, key]);
  return loaded?.key === key ? loaded.cards : undefined;
}

const inline = (body: ReactNode, footer: ReactNode) => (
  <div className={styles.inline}>
    {body}
    <div className={styles.inlineFooter}>{footer}</div>
  </div>
);

function Finished({ results, onAgain }: { results: DrillResult[]; onAgain: () => void }) {
  const t = useT();
  const right = results.filter((r) => r.right).length;
  return (
    <div className={styles.inline} data-practice-done="">
      <p className={styles.text}>{t('grammar.inlineDone', { right, total: results.length })}</p>
      <PillButton variant="secondary" onClick={onAgain}>
        {t('grammar.inlineAgain')}
      </PillButton>
    </div>
  );
}

/** The set (see the module comment); a muted line while it is chosen, nothing without drills. */
export function PointPractice({ grammarId }: PointPracticeSlotProps) {
  const t = useT();
  const [round, setRound] = useState(0);
  const cards = usePointCards(grammarId, round);
  const [results, setResults] = useState<DrillResult[]>([]);
  if (!cards) return <p className={styles.muted}>{t('grammar.inlineLoading')}</p>;
  const at = results.length;
  const again = () => {
    setResults([]);
    setRound((n) => n + 1);
  };
  if (at >= cards.length) {
    return cards.length > 0 ? <Finished results={results} onAgain={again} /> : null;
  }
  const card = cards[at];
  const last = at + 1 >= cards.length;
  if (!card?.drill) return null;
  return (
    <AutoFocus value={at > 0}>
      <p className={styles.muted}>{t('grammar.inlineAt', { at: at + 1, total: cards.length })}</p>
      <DrillCard
        key={`${round}:${at}`}
        drill={card.drill}
        card={card}
        nextLabel={t(last ? 'grammar.inlineFinish' : 'grammar.inlineNext')}
        onDone={(result) => setResults((list) => [...list, result])}
        layout={inline}
      />
    </AutoFocus>
  );
}
