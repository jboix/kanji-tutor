import { useMemo } from 'react';
import { RouterProvider } from 'react-router';
import { I18nProvider, type LoadedLanguage } from '../ui/i18n/i18n.tsx';
import { type Services, ServicesProvider } from '../ui/services.tsx';
import { SlotsProvider } from '../ui/slots.tsx';
import { createRouter } from './routes.tsx';
import { SLOTS } from './slots.tsx';

/** Root component: services, the interface language, slots and the router. */
export function App({ services, language }: { services: Services; language: LoadedLanguage }) {
  const router = useMemo(() => createRouter(), []);
  return (
    <ServicesProvider value={services}>
      <I18nProvider initial={language}>
        <SlotsProvider value={SLOTS}>
          <RouterProvider router={router} />
        </SlotsProvider>
      </I18nProvider>
    </ServicesProvider>
  );
}
