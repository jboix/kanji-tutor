import { useSyncExternalStore } from 'react';
import type { CloudPort, CloudState } from '../domain/cloud.ts';
import { useServices } from './services.tsx';

const OFF: CloudState = { signedIn: false, status: 'saved' };
const none = () => () => undefined;

/** The cloud port, if the build has a server, and its state, kept current. */
export function useCloud(): { cloud: CloudPort | undefined; state: CloudState } {
  const { cloud } = useServices();
  const state = useSyncExternalStore(
    cloud ? (listener) => cloud.subscribe(listener) : none,
    () => cloud?.state() ?? OFF,
  );
  return { cloud, state };
}
