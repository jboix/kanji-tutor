/** Renders a feature component with fake services, slots and a memory router, for tests. */
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import type { AiClient } from '../ai/types.ts';
import type { Repos } from '../domain/repos.ts';
import type { Lang } from '../lang/types.ts';
import { I18nProvider } from '../ui/i18n/i18n.tsx';
import { ENGLISH } from '../ui/i18n/load.ts';
import { es } from '../ui/i18n/messages/es/index.ts';
import { fr } from '../ui/i18n/messages/fr/index.ts';
import type { UiLanguage } from '../ui/languages.ts';
import { type Services, ServicesProvider } from '../ui/services.tsx';
import { type Slots, SlotsProvider } from '../ui/slots.tsx';
import { createMemoryRepos } from './memory-repos.ts';

const unwired = (name: string) => () =>
  Promise.reject(new Error(`not wired in this test: ${name}`));

/** AI client whose every task rejects unless overridden. */
export function fakeAi(overrides: Partial<AiClient> = {}): AiClient {
  const handler: ProxyHandler<object> = {
    get: (target, name) => Reflect.get(target, name) ?? unwired(String(name)),
  };
  return Object.assign(new Proxy({}, handler) as AiClient, overrides);
}

/** Lang whose every call rejects unless overridden. */
export function fakeLang(overrides: Partial<Lang> = {}): Lang {
  const handler: ProxyHandler<object> = {
    get: (target, name) => Reflect.get(target, name) ?? unwired(String(name)),
  };
  return Object.assign(new Proxy({}, handler) as Lang, overrides);
}

/** Services with memory repos and unwired lang/ai, overridable piece by piece. */
export function fakeServices(overrides: Partial<Services> & { repos?: Repos } = {}): Services {
  return {
    repos: createMemoryRepos(),
    lang: fakeLang(),
    ai: fakeAi(),
    backup: {
      exportJson: async () => '{}',
      importJson: async () => ({ ok: true }),
      eraseAll: async () => undefined,
    },
    packs: {
      installed: async () => 'test',
      manifest: async () => ({ version: 'test', files: [] }),
      install: async () => undefined,
    },
    ...overrides,
  };
}

const CATALOGUES = { en: ENGLISH, fr, es } as const;

/** Wraps `ui` in the interface language, loaded synchronously (English by default). */
export function inLanguage(ui: ReactElement, language: UiLanguage = 'en'): ReactElement {
  return <I18nProvider initial={{ language, messages: CATALOGUES[language] }}>{ui}</I18nProvider>;
}

/** Renders `ui` inside services, the language, slots and a memory router at `path`. */
export function renderWithServices(
  ui: ReactElement,
  options: { services?: Services; slots?: Slots; path?: string; language?: UiLanguage } = {},
) {
  const services = options.services ?? fakeServices();
  const view = render(
    <ServicesProvider value={services}>
      {inLanguage(
        <SlotsProvider value={options.slots ?? {}}>
          <MemoryRouter initialEntries={[options.path ?? '/']}>{ui}</MemoryRouter>
        </SlotsProvider>,
        options.language,
      )}
    </ServicesProvider>,
  );
  return { ...view, services };
}
