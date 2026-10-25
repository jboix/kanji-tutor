/**
 * New scan (scans/Main): add every page of a handout, photographed or picked, or pasted; choose a
 * new scanned lesson or one to add to; then read them, one request per photo, the count shown
 * before anything is sent (A18). Picking a photo sends nothing.
 */
import { type ReactNode, useId, useState } from 'react';
import { Link } from 'react-router';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import { ActionBar, ActionHint } from '../../ui/action-bar.tsx';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlockStatus, AiWriting } from '../../ui/ai-block.tsx';
import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import { Screen } from '../../ui/screen.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { TutorNext } from '../../ui/tutor.tsx';
import { useCloud } from '../../ui/use-cloud.ts';
import styles from './capture.module.css';
import { PageGrid, PickButtons, textPage, usePickers } from './page-grid.tsx';
import type { ImportPage } from './read-pages.ts';
import { RecentScans } from './recent-scans.tsx';
import { problemMessage } from './scan-copy.ts';
import { useImportTutor } from './scan-tutor.ts';
import type { ReadState, useScanImport } from './use-scan-import.ts';

type Import = ReturnType<typeof useScanImport>;

function PasteField({ onText }: { onText: (text: string) => void }) {
  const [text, setText] = useState('');
  const id = useId();
  const t = useT();
  return (
    <form
      className={styles.paste}
      onSubmit={(event) => {
        event.preventDefault();
        onText(text);
      }}
    >
      <label htmlFor={id} className={styles.fieldLabel}>
        {t('capture.pasteLabel')}
      </label>
      <textarea
        id={id}
        lang="ja"
        rows={4}
        className={styles.textarea}
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
      />
      <PillButton type="submit" variant="secondary" disabled={!text.trim()}>
        {t('capture.useText')}
      </PillButton>
    </form>
  );
}

/** "Paste text instead": a page without a photo, read on the device (works offline). */
function PasteForm({ onText }: { onText: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  if (open) {
    return (
      <PasteField
        onText={(text) => {
          onText(text);
          setOpen(false);
        }}
      />
    );
  }
  return (
    <button type="button" className={styles.textLink} onClick={() => setOpen(true)}>
      {t('capture.pasteInstead')}
    </button>
  );
}

function LessonChoice({ lesson }: { lesson: ScannedLesson }) {
  const { rich, format } = useI18n();
  const date = format.date(lesson.createdAt, { day: 'numeric', month: 'short' });
  return (
    <span>
      {rich('capture.addToLesson', {
        title: (
          <strong className={styles.strong}>
            <JaRuns text={lesson.title} />
          </strong>
        ),
        date: <span className={styles.faint}>{date}</span>,
      })}
    </span>
  );
}

/** "Save as": a new scanned lesson, or one of the latest to add the pages to. */
function Destination({ scan }: { scan: Import }) {
  const name = useId();
  const t = useT();
  if (scan.lessons.length === 0) return null;
  const radio = (id: string | undefined, label: ReactNode) => (
    <label key={id ?? 'new'} className={styles.radio}>
      <input
        type="radio"
        name={name}
        checked={scan.target === id}
        onChange={() => scan.setTarget(id)}
      />
      {label}
    </label>
  );
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        <SectionLabel>{t('capture.saveAs')}</SectionLabel>
      </legend>
      {radio(undefined, t('capture.asNew'))}
      {scan.lessons.map((lesson) => radio(lesson.id, <LessonChoice lesson={lesson} />))}
    </fieldset>
  );
}

/** Reading progress, or why the pages could not be read. */
function ReadStatus({ state }: { state: ReadState }) {
  const t = useT();
  if (state.status === 'idle') return null;
  if (state.status === 'reading') {
    return (
      <AiWriting tier="fast">
        {t('capture.readingPage', { n: state.page, total: state.total })}
      </AiWriting>
    );
  }
  const { problem } = state;
  if (problem.kind === 'ai' && problem.error.kind === 'rate-limit') {
    return (
      <AiBlockStatus tier="fast">
        <RateLimitWait error={problem.error} />
      </AiBlockStatus>
    );
  }
  const needsKey = problem.kind === 'ai' && problem.error.kind === 'no-key';
  return (
    <p role="alert" className={styles.alert}>
      {problemMessage(t, problem)}{' '}
      {needsKey && (
        <Link to={paths.settingsSection('tutor')} className={styles.inlineLink}>
          {t('capture.openSettings')}
        </Link>
      )}
    </p>
  );
}

const photosIn = (pages: readonly ImportPage[]) => pages.filter((p) => p.kind === 'photo').length;

/** "Read 3 pages · 3 requests, uses AI"; pasted text alone is read without AI. */
function ReadButton({ scan }: { scan: Import }) {
  const t = useT();
  const photos = photosIn(scan.pages);
  const busy = scan.state.status === 'reading';
  const label = t('capture.readPages', { n: scan.pages.length });
  if (photos === 0) {
    const empty = scan.pages.length === 0;
    return (
      <PillButton block disabled={empty || busy} onClick={() => scan.read()}>
        {label}
      </PillButton>
    );
  }
  return (
    <AiAction
      look="primary"
      block
      label={label}
      requests={photos}
      disabled={busy}
      run={scan.read}
    />
  );
}

function Footer({ scan }: { scan: Import }) {
  const tutor = useImportTutor();
  const t = useT();
  const { state } = useCloud();
  const photos = photosIn(scan.pages);
  const where = state.signedIn ? t('capture.photosGoCloud') : t('capture.photosGo');
  return (
    <ActionBar>
      <TutorNext tutor={tutor}>
        <ReadButton scan={scan} />
      </TutorNext>
      {scan.pages.length > 0 && (
        <ActionHint>{photos > 0 ? where : t('capture.pastedOnly')}</ActionHint>
      )}
    </ActionBar>
  );
}

/** The import screen; `adding` when pages go to a lesson opened from it ("Add pages"). */
export function ScanImport({ scan, adding }: { scan: Import; adding: boolean }) {
  const t = useT();
  const pickers = usePickers(scan.add);
  const back = <BackButton parent={paths.add} label={t('common.back')} />;
  const title = adding ? t('capture.addTitle') : t('capture.newTitle');
  return (
    <Screen topBar={<TopBar start={back} title={title} />} footer={<Footer scan={scan} />} gap={20}>
      <p className={styles.lead}>{t('capture.importLead')}</p>
      {pickers.inputs}
      <PageGrid pages={scan.pages} onRemove={scan.remove} onAdd={pickers.openLibrary} />
      <PickButtons onCamera={pickers.openCamera} onLibrary={pickers.openLibrary} />
      <PasteForm onText={(text) => scan.add([textPage(text)])} />
      <Destination scan={scan} />
      <ReadStatus state={scan.state} />
      {!adding && <RecentScans />}
    </Screen>
  );
}
