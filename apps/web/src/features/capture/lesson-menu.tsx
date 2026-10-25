/**
 * The ⋯ menu of a scanned lesson's page: add pages, rename, and delete after a confirmation that
 * says what goes and what stays (the reviews of what was learned).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { deleteScan } from '../../domain/services/index.ts';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton, PillLink } from '../../ui/pill-button.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './lesson.module.css';

interface MenuProps {
  id: string;
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

function MenuSheet({ id, onRename, onClose }: MenuProps & { onClose: () => void }) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  return (
    <BottomSheet open label={t('capture.moreActions')} onClose={onClose}>
      {confirm ? (
        <ConfirmDelete id={id} onCancel={() => setConfirm(false)} />
      ) : (
        <div className={styles.sheetBody}>
          <PillLink to={`${paths.capture}?to=${encodeURIComponent(id)}`} variant="secondary">
            {t('capture.addTitle')}
          </PillLink>
          <PillButton
            variant="secondary"
            onClick={() => {
              onClose();
              onRename();
            }}
          >
            {t('capture.rename')}
          </PillButton>
          <PillButton variant="secondary" onClick={() => setConfirm(true)}>
            {t('capture.delete')}
          </PillButton>
        </div>
      )}
    </BottomSheet>
  );
}

/** The ⋯ button and its sheet. */
export function LessonMenu({ id, onRename }: MenuProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton aria-label={t('capture.moreActions')} glyph onClick={() => setOpen(true)}>
        ⋯
      </IconButton>
      {open && <MenuSheet id={id} onRename={onRename} onClose={() => setOpen(false)} />}
    </>
  );
}
