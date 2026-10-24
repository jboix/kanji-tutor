import type { ReactNode } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import styles from './settings.module.css';

interface Props {
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** An inline "are you sure" step for actions that remove data. */
export function ConfirmRow({ children, confirmLabel, onConfirm, onCancel }: Props) {
  const t = useT();
  return (
    <div className={styles.confirm}>
      <p className={styles.status}>{children}</p>
      <div className={styles.wrap}>
        <button type="button" className={styles.primary} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className={styles.button} onClick={onCancel}>
          {t('settings.cancel')}
        </button>
      </div>
    </div>
  );
}
