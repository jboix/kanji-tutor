import { useId, useState } from 'react';
import styles from './help-toggle.module.css';
import { useT } from './i18n/i18n.tsx';

/** Whether a setting's explanation is shown, and the id that ties it to its ? button. */
export function useHelp() {
  const [open, setOpen] = useState(false);
  const id = useId();
  return { open, id, toggle: () => setOpen((was) => !was) };
}

export interface HelpToggleProps {
  /** The setting it explains, for its accessible name ("About Write the kanji"). */
  name: string;
  help: ReturnType<typeof useHelp>;
}

/**
 * The small ? beside a setting's name (Settings, in the iOS way): the explanation stays out of
 * the way until asked for, so names and controls sit side by side.
 */
export function HelpToggle({ name, help }: HelpToggleProps) {
  const t = useT();
  return (
    <button
      type="button"
      className={styles.help}
      aria-label={t('ui.aboutSetting', { name })}
      aria-expanded={help.open}
      aria-controls={help.id}
      onClick={help.toggle}
    >
      <span className={styles.mark} aria-hidden="true">
        ?
      </span>
    </button>
  );
}
