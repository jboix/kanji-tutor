import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from 'react-router';
import { PackGate } from '../features/onboarding/pack-gate.tsx';
import { paths } from '../ui/paths.ts';
import { syncServer } from '../ui/sync-server.ts';
import { RouteError } from './route-error.tsx';

/** Lazy route: each feature is its own chunk, keeping the app shell small (N4). */
function screen(path: string, load: () => Promise<ComponentType>): RouteObject {
  return { path, lazy: async () => ({ Component: await load() }), ErrorBoundary: RouteError };
}

const today = async () => (await import('../features/today/today-screen.tsx')).TodayScreen;
const kanji = async () => (await import('../features/kanji/kanji-screen.tsx')).KanjiScreen;
const units = () => import('../features/units/index.ts');
const grammar = async () => (await import('../features/grammar/grammar-screen.tsx')).GrammarScreen;
const guides = async () => (await import('../features/guides/guides-screen.tsx')).GuidesScreen;
const settings = () => import('../features/settings/settings-screen.tsx');
const settingsSection = () => import('../features/settings/settings-section-screen.tsx');

/** Screens that need the dictionary packs. Paths come from `src/ui/paths.ts`. */
const GATED: RouteObject[] = [
  screen(paths.today, today),
  screen(paths.learn, async () => (await import('../features/learn/learn-screen.tsx')).LearnScreen),
  screen(paths.tutor, async () => (await import('../features/tutor/tutor-screen.tsx')).TutorScreen),
  { path: paths.oldAdd, element: <Navigate to={paths.tutor} replace /> },
  screen(paths.start, async () => (await import('../features/start/start-screen.tsx')).StartScreen),
  screen(paths.plan, async () => (await import('../features/today/plan-screen.tsx')).PlanScreen),
  screen(paths.read, async () => (await import('../features/read/read-screen.tsx')).ReadScreen),
  screen(paths.kanji, kanji),
  screen(
    paths.kanjiWall(),
    async () => (await import('../features/kanji/kanji-wall-screen.tsx')).KanjiWallScreen,
  ),
  screen('/kanji/:char', kanji),
  screen(
    paths.capture,
    async () => (await import('../features/capture/capture-screen.tsx')).CaptureScreen,
  ),
  screen(paths.wild, async () => (await import('../features/wild/wild-screen.tsx')).WildScreen),
  screen(
    '/wild/:id',
    async () => (await import('../features/wild/wild-photo-screen.tsx')).WildPhotoScreen,
  ),
  screen(paths.notes, async () => (await import('../features/notes/notes-screen.tsx')).NotesScreen),
  screen(
    paths.compose,
    async () => (await import('../features/compose/compose-screen.tsx')).ComposeScreen,
  ),
  screen(
    paths.handwrite,
    async () => (await import('../features/handwrite/handwrite-screen.tsx')).HandwriteScreen,
  ),
  screen(
    paths.knownImport,
    async () => (await import('../features/import/import-screen.tsx')).ImportScreen,
  ),
  screen(
    paths.learned,
    async () => (await import('../features/learned/learned-screen.tsx')).LearnedScreen,
  ),
  screen(paths.units, async () => (await units()).UnitsScreen),
  screen('/units/:id', async () => (await units()).UnitScreen),
  screen('/units/:id/episode', async () => (await units()).EpisodeScreen),
  screen(
    paths.placement,
    async () => (await import('../features/placement/placement-screen.tsx')).PlacementScreen,
  ),
  screen(paths.grammarIndex, grammar),
  screen('/grammar/:id', grammar),
  screen(paths.guides, guides),
  screen('/guides/:id', guides),
  screen('*', today),
];

/**
 * Settings and its categories (IA5) stay reachable before the packs load, so the key can be
 * entered first; so does Log in, which a new device opens from the welcome, when there is a
 * cloud-save server.
 */
const ROUTES: RouteObject[] = [
  {
    element: (
      <PackGate>
        <Outlet />
      </PackGate>
    ),
    children: GATED,
  },
  screen(paths.settings, async () => (await settings()).SettingsScreen),
  screen('/settings/:section', async () => (await settingsSection()).SettingsSectionScreen),
  screen(
    paths.onboarding,
    async () => (await import('../features/onboarding/onboarding-screen.tsx')).OnboardingScreen,
  ),
  // Log in exists only when the build has a cloud-save server.
  ...(syncServer()
    ? [
        screen(
          paths.logIn,
          async () => (await import('../features/account/log-in-screen.tsx')).LogInScreen,
        ),
        screen(
          paths.cloudJoin,
          async () => (await import('../features/account/join-screen.tsx')).JoinScreen,
        ),
      ]
    : []),
  // The component gallery is for development only; it is not routed in production builds.
  ...(import.meta.env.DEV
    ? [screen(paths.devUi, async () => (await import('../ui/dev-gallery.tsx')).DevGallery)]
    : []),
];

/**
 * An invite link (`…/?invite=KD7M-3XQP`, printed by the server's `invite` command) opens the
 * screen that turns cloud saves on, with the code filled in.
 */
function followInvite(basename: string) {
  const code = new URLSearchParams(window.location.search).get('invite');
  if (!code || !syncServer()) return;
  const join = `${paths.cloudJoin}?${new URLSearchParams({ code }).toString()}`;
  window.history.replaceState(null, '', `${basename === '/' ? '' : basename}${join}`);
}

export function createRouter() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  followInvite(basename);
  return createBrowserRouter(ROUTES, { basename });
}
