import { PLACEMENT_LENGTH } from '../../domain/placement/index.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton, PillLink } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import styles from './placement.module.css';
import { PlacementQuestionView } from './placement-question.tsx';
import { PlacementResult } from './placement-result.tsx';
import { PlacementWriting } from './placement-writing.tsx';
import { usePlacement } from './use-placement.ts';

function Intro({ busy, onStart }: { busy: boolean; onStart: () => void }) {
  const t = useT();
  return (
    <section className={styles.card} aria-label={t('placement.about')}>
      <p className={styles.lead}>{t('placement.introLead', { n: PLACEMENT_LENGTH })}</p>
      <p className={styles.muted}>{t('placement.introNote')}</p>
      <PillButton onClick={onStart} disabled={busy}>
        {t(busy ? 'placement.finding' : 'placement.start')}
      </PillButton>
      <PillLink variant="secondary" to={paths.today} replace>
        {t('common.cancel')}
      </PillLink>
    </section>
  );
}

function Body({ placement }: { placement: ReturnType<typeof usePlacement> }) {
  const { state, busy, start, choose, finish } = placement;
  if (state.phase === 'intro') return <Intro busy={busy} onStart={start} />;
  if (state.phase === 'asking' && state.current) {
    const index = state.stairs.steps.length + 1;
    return (
      <PlacementQuestionView
        key={index}
        item={state.current}
        index={index}
        total={PLACEMENT_LENGTH}
        busy={busy}
        onChoose={choose}
      />
    );
  }
  if (state.phase === 'writing')
    return <PlacementWriting level={state.stairs.level} onDone={finish} />;
  return <PlacementResult state={state} />;
}

/**
 * Find my level (A11): a short adaptive placement, an optional written answer, a level. Before it
 * starts, leaving is a Cancel under Start, not a back arrow: nothing has been done to go back from.
 */
export function PlacementScreen() {
  const t = useT();
  const placement = usePlacement();
  const intro = placement.state.phase === 'intro';
  return (
    <Screen>
      {!intro && (
        <BackButton parent={paths.today} label={t('common.back')} className={styles.back} />
      )}
      <h1 className={styles.title}>{t('placement.title')}</h1>
      <Body placement={placement} />
    </Screen>
  );
}
