import type { ReactNode } from 'react';
import { cx } from '../../ui/cx.ts';
import { HelpToggle, useHelp } from '../../ui/help-toggle.tsx';
import styles from './setting-field.module.css';

export interface SettingFieldProps {
  /** The setting's name; its control carries the same name for assistive tech. */
  label: string;
  /** What the setting does, shown only after its ? is pressed. */
  hint?: ReactNode;
  /** The control: beside the name when it fits, else under it. */
  children: ReactNode;
  /** The control always under the name (a list of choices, a field). */
  stacked?: boolean;
  /** Always shown under the control: a status, not an explanation. */
  status?: ReactNode;
}

/** The explanation under a setting, hidden until its ? is pressed. */
export function SettingHint({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div id={id} className={styles.hint} hidden={!open}>
      {children}
    </div>
  );
}

/**
 * One setting in the iOS way: its name and control on one row, the explanation behind a small
 * ? so a screen of settings stays short.
 */
export function SettingField({ label, hint, children, stacked, status }: SettingFieldProps) {
  const help = useHelp();
  return (
    <div className={cx(styles.setting, stacked && styles.stacked)}>
      <div className={styles.settingRow}>
        <span className={styles.settingName}>
          <span aria-hidden="true">{label}</span>
          {hint && <HelpToggle name={label} help={help} />}
        </span>
        <div className={styles.settingControl}>{children}</div>
      </div>
      {status}
      {hint && (
        <SettingHint id={help.id} open={help.open}>
          {hint}
        </SettingHint>
      )}
    </div>
  );
}
