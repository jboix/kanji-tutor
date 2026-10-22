import { describe, expect, it, vi } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { newWordItem } from './items.ts';
import { sharedReads } from './read-cache.ts';

const NOW = Date.UTC(2026, 9, 17);

describe('sharedReads (N10)', () => {
  it('reads word items, settings and kanji readings once for callers side by side', async () => {
    const repos = createMemoryRepos();
    await repos.items.put(newWordItem({ wordId: '1', kind: 'import', now: NOW, level: 3 }));
    const byKind = vi.spyOn(repos.items, 'byKind');
    const get = vi.spyOn(repos.settings, 'get');
    const all = vi.spyOn(repos.kanjiReadings, 'all');
    const shared = sharedReads(repos);
    const [a, b] = await Promise.all([shared.items.byKind('word'), shared.items.byKind('word')]);
    await Promise.all([shared.settings.get(), shared.settings.get()]);
    await Promise.all([shared.kanjiReadings.all(), shared.kanjiReadings.all()]);
    expect([byKind, get, all].map((spy) => spy.mock.calls.length)).toEqual([1, 1, 1]);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('reads again after a write through it, and keeps the other methods', async () => {
    const repos = createMemoryRepos();
    const shared = sharedReads(repos);
    expect(await shared.items.byKind('word')).toEqual([]);
    await shared.items.put(newWordItem({ wordId: '2', kind: 'import', now: NOW }));
    expect(await shared.items.byKind('word')).toHaveLength(1);
    expect(await shared.items.count()).toBe(1);
    await shared.settings.get();
    await shared.settings.patch({ learnerLevel: 4 });
    expect((await shared.settings.get()).learnerLevel).toBe(4);
    await shared.kanjiReadings.all();
    await shared.kanjiReadings.put({
      id: '待:タイ',
      kanji: '待',
      reading: 'タイ',
      level: 1,
      wordIds: [],
    });
    expect(await shared.kanjiReadings.all()).toHaveLength(1);
  });
});
