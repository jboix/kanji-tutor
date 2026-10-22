import { Link } from 'react-router';
import type { Settings } from '../../domain/types.ts';
import { BUILD } from '../../ui/app-update.ts';
import { BottomNav } from '../../ui/bottom-nav.tsx';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon } from '../../ui/icons.tsx';
import { useInstallWay } from '../../ui/install-prompt.ts';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { type Category, visibleCategories } from './settings-categories.tsx';
import styles from './settings-list.module.css';
import { useSettings } from './use-settings.ts';

function CategoryRow({ category, settings }: { category: Category; settings?: Settings }) {
  const t = useT();
  return (
    <li>
      <Link to={paths.settingsSection(category.id)} className={styles.row}>
        <span className={cx(styles.icon, styles[category.tone])} aria-hidden="true">
          {category.icon}
        </span>
        <span className={styles.text}>
          <span className={styles.name}>{t(category.title)}</span>
          <span className={styles.detail}>{category.detail(t, settings)}</span>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronIcon />
        </span>
      </Link>
    </li>
  );
}

/**
 * Settings (IA5): the categories with icons, in two groups; each opens its own sub-screen.
 * Settings is a tab of the bottom bar; the install banner stays off here, and Install
 * leaves the list once the app runs installed.
 */
export function SettingsScreen() {
  const t = useT();
  const { settings } = useSettings();
  const installed = useInstallWay() === 'installed';
  return (
    <Screen footer={<BottomNav install={false} />}>
      <h1 className={styles.title}>{t('settings.title')}</h1>
      {visibleCategories(installed).map((group) => (
        <ul key={group[0]?.id} className={styles.group}>
          {group.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              {...(settings ? { settings } : {})}
            />
          ))}
        </ul>
      ))}
      <p className={styles.build}>
        {t('settings.buildLine', { version: BUILD.version, id: BUILD.id })}
      </p>
    </Screen>
  );
}
