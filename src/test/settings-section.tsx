/** Renders one Settings category (IA5) at `/settings/<section>`, for tests. */
import { Route, Routes } from 'react-router';
import { SettingsSectionScreen } from '../features/settings/settings-section-screen.tsx';
import type { UiLanguage } from '../ui/languages.ts';
import type { SettingsSectionId } from '../ui/paths.ts';
import type { Services } from '../ui/services.tsx';
import { renderWithServices } from './render.tsx';

export function renderSettingsSection(
  section: SettingsSectionId,
  options: { services?: Services; language?: UiLanguage } = {},
) {
  return renderWithServices(
    <Routes>
      <Route path="/settings/:section" element={<SettingsSectionScreen />} />
    </Routes>,
    { ...options, path: `/settings/${section}` },
  );
}
