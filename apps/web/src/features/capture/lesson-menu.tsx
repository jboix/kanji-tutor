/**
 * The ⋯ menu of a scanned lesson's page: add pages, rename, and delete after a confirmation that
 * says what goes and what stays (the reviews of what was learned).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { deleteScan } from '../../domain/services/index.ts';
import { ActionItem, ActionList } from '../../ui/action-list.tsx';
import { BottomSheet, SheetTitle } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { PenIcon, PlusIcon, TrashIcon } from '../../ui/icons.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './lesson.module.css';

interface MenuProps {
  id: string;
  /** The lesson's title, heading the sheet. */
  title: string;
  onRename: () => void;
}

function ConfirmDelete({ id, onCancel }: { id: string; onCancel: () => void }) {
  const t = useT();
  const { repos } = useServices();
  const navigate = useNavigate();
  const remove = async () => {
    await deleteScan(repos, id);
    void navigate(paths.capture, { replace: true });
  };
  return (
    <div className={styles.sheetBody}>
      <p className={styles.text}>{t('capture.deleteConfirm')}</p>
      <PillButton onClick={() => void remove()}>{t('capture.deleteYes')}</PillButton>
      <PillButton variant="secondary" onClick={onCancel}>
        {t('common.cancel')}
      </PillButton>
    </div>
  );
}

interface ActionsProps {
  id: string;
  onRename: () => void;
  onDelete: () => void;
}

function Actions({ id, onRename, onDelete }: ActionsProps) {
  const t = useT();
  return (
    <ActionList>
      <ActionItem
        icon={<PlusIcon />}
        label={t('capture.addTitle')}
        to={`${paths.capture}?to=${encodeURIComponent(id)}`}
      />
      <ActionItem icon={<PenIcon />} label={t('capture.rename')} onClick={onRename} />
      <ActionItem icon={<TrashIcon />} label={t('capture.delete')} onClick={onDelete} />
    </ActionList>
  );
}

function MenuSheet({ id, title, onRename, onClose }: MenuProps & { onClose: () => void }) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const rename = () => {
    onClose();
    onRename();
  };
  const heading = (
    <SheetTitle>
      <JaRuns text={title} />
    </SheetTitle>
  );
  return (
    <BottomSheet open label={t('capture.moreActions')} onClose={onClose} header={heading}>
      {confirm ? (
        <ConfirmDelete id={id} onCancel={() => setConfirm(false)} />
      ) : (
        <Actions id={id} onRename={rename} onDelete={() => setConfirm(true)} />
      )}
    </BottomSheet>
  );
}

/** The ⋯ button and its sheet. */
export function LessonMenu({ id, title, onRename }: MenuProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton aria-label={t('capture.moreActions')} glyph onClick={() => setOpen(true)}>
        ⋯
      </IconButton>
      {open && (
        <MenuSheet id={id} title={title} onRename={onRename} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
