import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SettingsRepo } from '../domain/repos.ts';
import { canSpeak } from '../lang/speech.ts';
import { createMemoryRepos } from '../test/memory-repos.ts';
import { applySound } from '../ui/sound.ts';
import { soundFollows } from './services.ts';

describe('Sound follows the settings (D125)', () => {
  afterEach(() => {
    applySound(true);
    vi.unstubAllGlobals();
  });

  it('mutes speech on a read or a change, and unmutes it again', async () => {
    vi.stubGlobal('speechSynthesis', { cancel: () => undefined });
    const repo: SettingsRepo = soundFollows(
      createMemoryRepos({ settings: { sound: false } }).settings,
    );
    expect(canSpeak()).toBe(true);
    await repo.get();
    expect(canSpeak()).toBe(false);
    expect((await repo.patch({ sound: true })).sound).toBe(true);
    expect(canSpeak()).toBe(true);
    await repo.patch({ sound: false });
    expect(canSpeak()).toBe(false);
  });

  it('keeps sound on for a learner who never set it (an older install)', async () => {
    vi.stubGlobal('speechSynthesis', { cancel: () => undefined });
    applySound(false);
    const repo = soundFollows(createMemoryRepos().settings);
    expect((await repo.get()).sound).toBeUndefined();
    expect(canSpeak()).toBe(true);
  });
});
