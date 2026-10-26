import { useEffect, useState } from 'react';
import { useServices } from './services.tsx';

/** Whether the tutor can answer, and with what. */
export interface TutorSetup {
  /** A key is set (or the mock tutor of tests): the tutor answers. */
  ready: boolean;
  /** The fast model's id, e.g. "gemini-3.5-flash-lite". */
  modelId: string;
  /** The learner's own Gemini key is set. */
  ownKey: boolean;
}

/**
 * The tutor's setup, read from the settings each time a screen mounts, so a key entered in
 * Settings shows on the way back. Undefined while it is read: show neither state yet.
 */
export function useTutorSetup(): TutorSetup | undefined {
  const { repos, tutorReady } = useServices();
  const [setup, setSetup] = useState<TutorSetup>();
  useEffect(() => {
    let live = true;
    void repos.settings.get().then((settings) => {
      if (!live) return;
      const ownKey = Boolean(settings.apiKey);
      setSetup({ ready: tutorReady(settings), modelId: settings.modelId, ownKey });
    });
    return () => {
      live = false;
    };
  }, [repos, tutorReady]);
  return setup;
}

/** "gemini-3.5-flash-lite" → "Gemini 3.5 Flash-Lite"; any other id as it is. */
export function modelName(modelId: string): string {
  const match = /^gemini-([\d.]+)-(.+)$/.exec(modelId);
  if (!match) return modelId;
  const [, version, rest = ''] = match;
  const tier = rest
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
  return `Gemini ${version} ${tier}`;
}
