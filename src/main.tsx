import '@fontsource/klee-one/400.css';
import '@fontsource/klee-one/600.css';
import '@fontsource/zen-kaku-gothic-new/latin-400.css';
import '@fontsource/zen-kaku-gothic-new/latin-500.css';
import '@fontsource/zen-kaku-gothic-new/latin-700.css';
import './ui/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/app.tsx';
import { boot } from './app/boot.ts';
import { createServices } from './app/services.ts';
import { loadInitialLanguage } from './ui/i18n/i18n.tsx';
import { endLaunch } from './ui/launch.ts';

const services = createServices();
const root = document.getElementById('root');
/** If no screen ever mounts (an error before the first one), the launch screen still goes. */
const LAUNCH_TIMEOUT_MS = 10_000;

if (root) {
  setTimeout(endLaunch, LAUNCH_TIMEOUT_MS);
  void boot(services);
  // The saved language's messages load before the first paint, so it never flashes English.
  void loadInitialLanguage(services.repos).then((language) =>
    createRoot(root).render(
      <StrictMode>
        <App services={services} language={language} />
      </StrictMode>,
    ),
  );
}
