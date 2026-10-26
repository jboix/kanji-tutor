/**
 * Scanned lessons: the list of them; `?new=1` photographs (or pastes) every page of a handout,
 * lets the tutor read what each page is and what it teaches, reviews it against your lists and
 * saves it as one lesson. A saved lesson opens at `?id=`, from storage only, so it works
 * offline; `?to=` adds pages to one.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { BackIcon } from '../../ui/icons.tsx';
import { Loader } from '../../ui/loader.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './capture.module.css';
import { LessonPage } from './lesson-page.tsx';
import { ScanImport } from './scan-import.tsx';
import { ScanList, scanHref } from './scan-list.tsx';
import { ScanReview } from './scan-review.tsx';
import { useDraftReview } from './use-draft-review.ts';
import { useSavedScan } from './use-saved-scan.ts';
import { type ReadPages, useScanImport } from './use-scan-import.ts';

/** A wait on this screen: `text` for one the learner should read, the loader otherwise. */
function Waiting({ text }: { text?: string }) {
  const t = useT();
  const back = <BackButton parent={paths.capture} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} />}>
      {text === undefined ? (
        <Loader />
      ) : (
        <p role="status" className={styles.muted}>
          {text}
        </p>
      )}
    </Screen>
  );
}

/** The pages just read, to review and save. */
function DraftReview({ read, onBack }: { read: ReadPages; onBack: () => void }) {
  const [now] = useState(() => Date.now());
  const review = useDraftReview(read, now);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const t = useT();
  if (!review) return <Waiting text={t('capture.matching')} />;
  const save = async () => {
    setSaving(true);
    const id = await review.save();
    if (id) void navigate(scanHref(id), { replace: true });
  };
  const back = (
    <IconButton aria-label={t('common.back')} onClick={onBack}>
      <BackIcon />
    </IconButton>
  );
  const action = (
    <PillButton block disabled={saving} onClick={() => void save()}>
      {saving ? t('capture.saving') : t('capture.save')}
    </PillButton>
  );
  return <ScanReview model={review.model} back={back} action={action} />;
}

/** New scan, then its review: the pages stay picked when the review goes back. */
function ScanFlow({ into }: { into: string | undefined }) {
  const [read, setRead] = useState<ReadPages>();
  const scan = useScanImport(setRead, into);
  if (read) return <DraftReview read={read} onBack={() => setRead(undefined)} />;
  return <ScanImport scan={scan} adding={into !== undefined} />;
}

/** A saved scanned lesson's page, from storage only. */
function SavedScan({ id }: { id: string }) {
  const { state, model, commitTitle } = useSavedScan(id);
  const t = useT();
  if (!model) {
    return <Waiting {...(state.status === 'missing' ? { text: t('capture.gone') } : {})} />;
  }
  return <LessonPage model={model} commitTitle={commitTitle} />;
}

export function CaptureScreen() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const into = params.get('to') ?? undefined;
  if (id) return <SavedScan key={id} id={id} />;
  if (into === undefined && !params.has('new')) return <ScanList />;
  return <ScanFlow key={into ?? 'new'} into={into} />;
}
