/** The Settings categories (IA5): each a sub-screen with the sections it groups. */
import type { ReactNode } from 'react';
import { type ExplainSettings, explainsGrammar, explainsKanji } from '../../domain/explain-new.ts';
import { DEFAULT_SESSION_MINUTES } from '../../domain/services/index.ts';
import type { Settings } from '../../domain/types.ts';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';
import {
  ChatIcon,
  CloudIcon,
  ContrastIcon,
  GlobeIcon,
  InfoIcon,
  ListIcon,
  PhoneIcon,
  TimerIcon,
  TrayIcon,
} from '../../ui/icons.tsx';
import type { SettingsSectionId } from '../../ui/paths.ts';
import { syncServer } from '../../ui/sync-server.ts';
import { AboutSection } from './about-section.tsx';
import { AiUseSection } from './ai-use-section.tsx';
import { BackupSection } from './backup-section.tsx';
import { CloudSection } from './cloud-section.tsx';
import { DeveloperSection } from './developer-section.tsx';
import { EraseSection } from './erase-section.tsx';
import { ImmersionSection } from './immersion-section.tsx';
import { InstallSection } from './install-section.tsx';
import { KeySection } from './key-section.tsx';
import { KnownWordsSection } from './known-words-section.tsx';
import { LanguageSection } from './language-section.tsx';
import { ModelSection } from './model-section.tsx';
import { ReadingSection } from './reading-section.tsx';
import { SoundSection } from './sound-section.tsx';
import { StorageSection } from './storage-section.tsx';
import { ThemeSection } from './theme-section.tsx';
import { TutorSection } from './tutor-section.tsx';
import type { PatchSettings } from './use-settings.ts';
import { VersionSection } from './version-section.tsx';

/** What a category's sections need. */
export interface SectionProps {
  settings: Settings;
  patch: PatchSettings;
  replace: (settings: Settings) => void;
  onImported: () => Promise<void>;
  onWelcomeAgain: () => void;
  /** Bumped after an import, so fields with drafts restart from the restored settings. */
  generation: number;
}

export interface Category {
  id: SettingsSectionId;
  title: PlainKey;
  /** The square's line icon, decorative: the title names the category. */
  icon: ReactNode;
  /** The square's colour; never the AI crimson, which stays for the tutor's own output. */
  tone: 'accent' | 'ink' | 'muted';
  detail: (t: Translate, settings: Settings | undefined) => string;
  render: (props: SectionProps) => ReactNode;
}

const THEME: Record<Settings['theme'], PlainKey> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
};

/** Both explained first, neither, or the one that is. */
function explainDetail(settings: ExplainSettings): PlainKey {
  const grammar = explainsGrammar(settings);
  const kanji = explainsKanji(settings);
  if (grammar && kanji) return 'settings.catExplainFirst';
  if (grammar) return 'settings.catExplainGrammar';
  return kanji ? 'settings.catExplainKanji' : 'settings.catSkipFirst';
}

function sessionsDetail(t: Translate, settings: Settings | undefined): string {
  const minutes = t('settings.sessionMinutes', {
    n: settings?.sessionMinutes ?? DEFAULT_SESSION_MINUTES,
  });
  return t('settings.catSessionsLine', { minutes, explain: t(explainDetail(settings ?? {})) });
}

/** "Dark", or "Dark · Sound off" once sound is off. */
function appearanceDetail(t: Translate, settings: Settings | undefined): string {
  const theme = t(THEME[settings?.theme ?? 'system']);
  return settings?.sound === false ? `${theme} · ${t('settings.catSoundOff')}` : theme;
}

export const CATEGORIES: readonly (readonly Category[])[] = [
  [
    {
      id: 'sessions',
      title: 'settings.catSessions',
      icon: <TimerIcon />,
      tone: 'accent',
      detail: sessionsDetail,
      render: ({ settings, patch, generation }) => (
        <ReadingSection key={`reading-${generation}`} settings={settings} onPatch={patch} />
      ),
    },
    {
      id: 'tutor',
      title: 'settings.catTutor',
      icon: <ChatIcon />,
      tone: 'ink',
      detail: (t) => t('settings.catTutorDetail'),
      render: ({ settings, patch, generation }) => (
        <>
          <KeySection settings={settings} onPatch={patch} />
          <ModelSection key={`model-${generation}`} settings={settings} onPatch={patch} />
          <TutorSection settings={settings} onPatch={patch} />
          <AiUseSection key={`ai-${generation}`} />
        </>
      ),
    },
    {
      id: 'language',
      title: 'settings.catLanguage',
      icon: <GlobeIcon />,
      tone: 'ink',
      detail: (t) => t('settings.catLanguageDetail'),
      render: ({ settings, patch }) => (
        <>
          <LanguageSection settings={settings} onPatch={patch} />
          <ImmersionSection settings={settings} onPatch={patch} />
        </>
      ),
    },
    {
      id: 'appearance',
      title: 'settings.catAppearance',
      icon: <ContrastIcon />,
      tone: 'muted',
      detail: appearanceDetail,
      render: ({ settings, patch }) => (
        <>
          <ThemeSection settings={settings} onPatch={patch} />
          <SoundSection settings={settings} onPatch={patch} />
        </>
      ),
    },
  ],
  [
    {
      id: 'words',
      title: 'settings.catWords',
      icon: <ListIcon />,
      tone: 'accent',
      detail: (t) => t('settings.catWordsDetail'),
      render: ({ settings, patch }) => <KnownWordsSection settings={settings} onPatch={patch} />,
    },
    {
      id: 'backup',
      title: 'settings.catBackup',
      icon: <TrayIcon />,
      tone: 'muted',
      detail: (t) => t('settings.catBackupDetail'),
      render: ({ settings, replace, onImported }) => (
        <>
          <BackupSection settings={settings} onExported={replace} onImported={onImported} />
          <StorageSection />
          <EraseSection onExported={replace} />
        </>
      ),
    },
    {
      id: 'cloud',
      title: 'account.cloudTitle',
      icon: <CloudIcon />,
      tone: 'accent',
      detail: (t) => t('account.cloudDetail'),
      render: () => <CloudSection />,
    },
    {
      id: 'install',
      title: 'settings.catInstall',
      icon: <PhoneIcon />,
      tone: 'muted',
      detail: (t) => t('settings.catInstallDetail'),
      render: () => <InstallSection />,
    },
    {
      id: 'about',
      title: 'settings.catAbout',
      icon: <InfoIcon />,
      tone: 'muted',
      detail: (t) => t('settings.catAboutDetail'),
      render: ({ settings, patch, onWelcomeAgain }) => (
        <>
          <VersionSection />
          <AboutSection onWelcomeAgain={onWelcomeAgain} />
          <DeveloperSection settings={settings} onPatch={patch} />
        </>
      ),
    },
  ],
];

/**
 * The groups as listed: Install goes once the app is installed, as it has nothing to say, and
 * Cloud saves when the build has no server.
 */
export function visibleCategories(installed: boolean): readonly (readonly Category[])[] {
  const hidden = new Set([...(installed ? ['install'] : []), ...(syncServer() ? [] : ['cloud'])]);
  return CATEGORIES.map((group) => group.filter((category) => !hidden.has(category.id)));
}

/** The category with this id, or undefined. */
export function categoryById(id: string | undefined): Category | undefined {
  return CATEGORIES.flat().find((category) => category.id === id);
}
