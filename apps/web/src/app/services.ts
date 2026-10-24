import {
  createAiClient,
  createGeminiProvider,
  createMockProvider,
  type MockProbe,
  sharedLimiter,
} from '../ai/index.ts';
import type { AiContext, AiProvider } from '../ai/types.ts';
import {
  createBackupPort,
  createCloudPort,
  createDexieRepos,
  createPackLoader,
  KanjiTutorDb,
} from '../data/index.ts';
import { explanationLanguageOf, teacherModelOf } from '../domain/defaults.ts';
import { immersionMode } from '../domain/immersion.ts';
import type { LearnerView } from '../domain/learner-view.ts';
import type { Repos, SettingsRepo } from '../domain/repos.ts';
import { createLearnerView } from '../domain/services/learner-profile.ts';
import type { Settings } from '../domain/types.ts';
import { createLang, createWorkerTokenizer, muteListening } from '../lang/index.ts';
import { rememberWelcomed } from '../ui/launch.ts';
import type { Services } from '../ui/services.tsx';
import { applySound } from '../ui/sound.ts';
import { syncServer } from '../ui/sync-server.ts';
import { learnerProfile } from './profile.ts';

/** The mock's request counter and failure switch, on `window` for e2e (`VITE_AI_PROVIDER=mock`). */
function mockProbe(): MockProbe {
  const holder = window as unknown as { __kanjiMockAi?: MockProbe };
  holder.__kanjiMockAi ??= { calls: 0 };
  return holder.__kanjiMockAi;
}

/**
 * `VITE_AI_PROVIDER=mock` is for e2e and screenshots only; real builds use Gemini. Both go
 * through the app-wide rate limiter (A14).
 */
function providerFor(settings: Settings): AiProvider | undefined {
  if (import.meta.env.VITE_AI_PROVIDER === 'mock') {
    return createMockProvider({ limiter: sharedLimiter, probe: mockProbe() });
  }
  return settings.apiKey ? createGeminiProvider(settings.apiKey) : undefined;
}

/**
 * The AI context, resolved per call. The app layer owns the learner view the teacher's tools read
 * (A10); features never construct tools.
 */
function aiContext(
  repos: Repos,
  lang: AiContext['lang'],
  learner: LearnerView,
): () => Promise<AiContext> {
  return async () => {
    const settings = await repos.settings.get();
    return {
      provider: providerFor(settings),
      model: settings.modelId,
      teacherModel: teacherModelOf(settings),
      explanationLanguage: explanationLanguageOf(settings),
      learner,
      immersion: (profile) => immersionMode(profile, settings.immersion),
      cache: repos.aiCache,
      log: repos.aiLog,
      lang,
      profile: await learnerProfile(repos, settings),
      isOnline: () => navigator.onLine,
      now: Date.now,
    };
  };
}

/**
 * Settings → Sound follows every settings read and write, so boot, a change, an import
 * and the welcome all mute or unmute the tones, speech and listening exercises at once. So
 * does the launch screen's "welcome done" mark, which index.html reads before the first paint.
 */
export function soundFollows(repo: SettingsRepo): SettingsRepo {
  const apply = (settings: Settings) => {
    applySound(settings.sound, settings.soundVolume);
    muteListening(settings.listening === false);
    rememberWelcomed(settings.onboarded);
    return settings;
  };
  return {
    get: () => repo.get().then(apply),
    patch: (change) => repo.patch(change).then(apply),
  };
}

/** Wires storage, language and AI services for the running app. */
export function createServices(db = new KanjiTutorDb()): Services {
  const stored = createDexieRepos(db);
  const repos: Repos = { ...stored, settings: soundFollows(stored.settings) };
  const base = import.meta.env.BASE_URL;
  // Before anything reads the database, so the cloud hears every change.
  const server = syncServer();
  const cloud = server ? { cloud: createCloudPort(db, server) } : {};
  const lang = createLang({
    dictionary: repos.dictionary,
    tokenizer: createWorkerTokenizer(`${base}dict/`),
  });
  return {
    repos,
    lang,
    ai: createAiClient(aiContext(repos, lang, createLearnerView(repos))),
    backup: createBackupPort(db),
    packs: createPackLoader(
      db,
      `${base}packs/${import.meta.env.VITE_PACKS === 'fixture' ? 'fixture/' : ''}`,
    ),
    ...cloud,
  };
}
