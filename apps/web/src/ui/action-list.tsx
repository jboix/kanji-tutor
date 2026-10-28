import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './action-list.module.css';

/**
 * A menu's actions as rows: an icon, then the label, one per line, so each reads at a glance and
 * none looks like the sheet's main button.
 */
export function ActionList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}

interface ActionItemProps {
  icon: ReactNode;
  label: string;
  /** A link when given, else a button. */
  to?: string;
  onClick?: () => void;
}

export function ActionItem({ icon, label, to, onClick }: ActionItemProps) {
  const inner = (
    <>
      <span className={styles.icon}>{icon}</span>
      {label}
    </>
  );
  return (
    <li>
      {to === undefined ? (
        <button type="button" className={styles.row} onClick={onClick}>
          {inner}
        </button>
      ) : (
        <Link to={to} className={styles.row} onClick={onClick}>
          {inner}
        </Link>
      )}
    </li>
  );
}
