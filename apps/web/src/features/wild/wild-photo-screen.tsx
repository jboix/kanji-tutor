/**
 * `/wild/:id`: a photo read in the wild, opened again from Your photos with what the tutor read
 * on it, asking nothing; Delete forgets it after a confirmation (words added from it stay).
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { deleteWildPhoto } from '../../domain/services/index.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Loader } from '../../ui/loader.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { useServices } from '../../ui/services.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { useWildPhoto } from './use-wild.ts';
import styles from './wild.module.css';
import { WildRead } from './wild-read.tsx';

function ConfirmDelete({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useT();
  const { repos } = useServices();
  const navigate = useNavigate();
  const remove = async () => {
    await deleteWildPhoto(repos, id);
    void navigate(paths.wild, { replace: true });
  };
  return (
    <BottomSheet open label={t('wild.delete')} onClose={onClose}>
      <div className={styles.sheetBody}>
        <p className={styles.intro}>{t('wild.deleteConfirm')}</p>
        <PillButton onClick={() => void remove()}>{t('wild.deleteYes')}</PillButton>
        <PillButton variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </PillButton>
      </div>
    </BottomSheet>
  );
}

function Delete({ id }: { id: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PillButton variant="text" onClick={() => setOpen(true)}>
        {t('wild.delete')}
      </PillButton>
      {open && <ConfirmDelete id={id} onClose={() => setOpen(false)} />}
    </>
  );
}

/** The screen (see the module comment). */
export function WildPhotoScreen() {
  const t = useT();
  const { id = '' } = useParams();
  const saved = useWildPhoto(id);
  const back = <BackButton parent={paths.wild} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('wild.title')} />}>
      {saved === undefined && <Loader />}
      {saved === null && <p className={styles.intro}>{t('wild.missing')}</p>}
      {saved && <WildRead photo={saved.photo} reading={saved.reading} />}
      {saved && <Delete id={saved.id} />}
    </Screen>
  );
}
