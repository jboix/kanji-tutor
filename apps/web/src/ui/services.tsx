import { createContext, type ReactNode, use } from 'react';
import type { AiClient } from '../ai/types.ts';
import type { CloudPort } from '../domain/cloud.ts';
import type { BackupPort, PackLoader, Repos } from '../domain/repos.ts';
import type { Lang } from '../lang/types.ts';

/** What features get from the app: storage, language services and AI. */
export interface Services {
  repos: Repos;
  lang: Lang;
  ai: AiClient;
  backup: BackupPort;
  packs: PackLoader;
  /** Cloud saves; absent when the build has no sync server. */
  cloud?: CloudPort;
}

const ServicesContext = createContext<Services | null>(null);

/** Provides services to the tree; `src/app` wires the real ones, tests pass fakes. */
export function ServicesProvider({ value, children }: { value: Services; children: ReactNode }) {
  return <ServicesContext value={value}>{children}</ServicesContext>;
}

/** Storage, language and AI services for the current app. */
export function useServices(): Services {
  const services = use(ServicesContext);
  if (!services) throw new Error('useServices() outside <ServicesProvider>');
  return services;
}
