/** Every route path in one place, so links cannot drift from the router. */
export const paths = {
  today: '/',
  /** The Learn hub (IA4): lessons, kanji, grammar, what you've learned, notes. */
  learn: '/learn',
  /** The Tutor tab: ask the tutor, and bring in what you study in class. */
  tutor: '/tutor',
  /** The Tutor tab's old name, still redirected for old links and installed shortcuts. */
  oldAdd: '/add',
  /** The centre button (IA3): resolves the next round and hands over to the session. */
  start: '/start',
  /** This week's plan, opened from Today's "Change" (IA6). */
  plan: '/plan',
  read: '/read',
  kanji: '/kanji',
  kanjiDetail: (char: string) => `/kanji/${encodeURIComponent(char)}`,
  capture: '/capture',
  notes: '/notes',
  compose: '/compose',
  handwrite: '/handwrite',
  settings: '/settings',
  /** One Settings category (IA5). */
  settingsSection: (id: SettingsSectionId) => `/settings/${id}`,
  /** Bulk import of already-known items (K6). */
  knownImport: '/import',
  /** Kanji, words and grammar by JLPT level (P3). */
  learned: '/learned',
  /** The lesson path and the JLPT picture (T4). */
  units: '/units',
  /** One thematic unit and its steps (T3). */
  unit: (id: string) => `/units/${encodeURIComponent(id)}`,
  /** One part of a unit lesson's section as a session (S3). */
  lessonPart: (unit: string, section: string, part: number) =>
    `/read?${new URLSearchParams({ unit, section, part: String(part) }).toString()}`,
  /** Find my level: a short adaptive placement (A11). */
  placement: '/placement',
  /** Every catalogue grammar point by level and family (P3). */
  grammarIndex: '/grammar',
  grammar: (id: string) => `/grammar/${encodeURIComponent(id)}`,
  onboarding: '/welcome',
  /** Log in from the welcome: bring progress from another device (cloud saves). */
  logIn: '/log-in',
  /** Turning on cloud saves with an invite, opened from the invite link. */
  cloudJoin: '/cloud/join',
  devUi: '/dev/ui',
} as const;

/** The Settings categories (IA5), each a sub-screen. */
export const SETTINGS_SECTIONS = [
  'sessions',
  'tutor',
  'language',
  'appearance',
  'words',
  'backup',
  'cloud',
  'install',
  'about',
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number];
