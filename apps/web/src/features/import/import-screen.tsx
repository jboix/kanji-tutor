import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton, PillLink } from '../../ui/pill-button.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { type ImportPhase, type ImportSummary, useKnownImport } from '../../ui/use-known-import.ts';
import styles from './import.module.css';
import { ImportForm } from './import-form.tsx';

function NotFound({ lines }: { lines: string[] }) {
  const t = useT();
  if (lines.length === 0) return null;
  return (
    <>
      {t('importScreen.notFound', { n: lines.length })} <Ja>{lines.join('、')}</Ja>
    </>
  );
}

function Progress({ phase }: { phase: Extract<ImportPhase, { phase: 'running' }> }) {
  const t = useT();
  const text =
    phase.total > 0
      ? t('importScreen.marking', { done: phase.done, total: phase.total })
      : t('importScreen.finding');
  return (
    <div className={styles.progress} aria-live="polite">
      <ProgressLine value={phase.total > 0 ? phase.done / phase.total : 0} label={text} />
      <p className={styles.hint}>{text}</p>
    </div>
  );
}

function Added({ result }: { result: ImportSummary }) {
  const { t, rich } = useI18n();
  const { known, lessonWords: added } = result;
  return (
    <>
      {known && t('importScreen.marked', { n: known.marked })}
      {known && added && '; '}
      {added && t('importScreen.added', { n: added.added })}
      {added?.lesson && (
        <> {rich('importScreen.toLesson', { lesson: <JaRuns text={added.lesson} /> })}</>
      )}
    </>
  );
}

function Done({ result, onAgain }: { result: ImportSummary; onAgain: () => void }) {
  const t = useT();
  const notFound = [...(result.known?.notFound ?? []), ...(result.lessonWords?.notFound ?? [])];
  const already = result.known?.already ?? 0;
  const tracked = result.lessonWords?.tracked ?? 0;
  return (
    <div className={styles.progress} role="status">
      <p className={styles.result}>
        <Added result={result} />
        <NotFound lines={notFound} />.
        {already > 0 && ` ${t('importScreen.already', { n: already })}`}
        {tracked > 0 && ` ${t('importScreen.tracked', { n: tracked })}`}
      </p>
      <PillLink to={paths.today} arrow>
        {t('importScreen.backToToday')}
      </PillLink>
      <PillButton variant="secondary" onClick={onAgain}>
        {t('importScreen.markMore')}
      </PillButton>
    </div>
  );
}

function Body({ state }: { state: ReturnType<typeof useKnownImport> }) {
  const t = useT();
  const [phase, run, reset] = state;
  if (phase.phase === 'running') return <Progress phase={phase} />;
  if (phase.phase === 'done') return <Done result={phase.result} onAgain={reset} />;
  return (
    <>
      {phase.phase === 'failed' && (
        <p role="alert" className={styles.hint}>
          {t('importScreen.failed')}
        </p>
      )}
      <ImportForm onImport={(choice) => void run(choice)} />
    </>
  );
}

/** Mark what you already know (K6, D14): JLPT lists, Minna lessons, or your own list. */
export function ImportScreen() {
  const { t, rich } = useI18n();
  const state = useKnownImport();
  const back = <BackButton parent={paths.learn} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('importScreen.heading')} />}>
      <p className={styles.intro}>{rich('importScreen.intro', { example: <Ja>これ</Ja> })}</p>
      <Body state={state} />
    </Screen>
  );
}
