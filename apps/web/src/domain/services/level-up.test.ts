import { describe, expect, it } from 'vitest';
import { fixtureRepos } from '../../test/fixture-pack.ts';
import { withJlptIndex } from '../../test/jlpt-index.ts';
import { ALL_WORDS, NOW, readingRepos } from '../../test/reading-fixtures.ts';
import type { Repos } from '../repos.ts';
import { importKnown } from './import-known.ts';
import { newWordItem } from './items.ts';
import {
  LEVEL_UP_SNOOZE_MS,
  levelProgress,
  levelUpSuggestion,
  moveUpLevel,
  snoozeLevelUp,
} from './level-up.ts';

const n5 = ALL_WORDS.filter((w) => w.jlpt === 5 && w.forms.length > 0);

async function knowShare(repos: Repos, share: number) {
  const words = n5.slice(0, Math.round(n5.length * share));
  await repos.items.putMany(
    words.map((w) => newWordItem({ wordId: w.id, kind: 'import', now: NOW, level: 3 })),
  );
}

describe('levelUpSuggestion (P4)', () => {
  it('suggests the next level at 80% of the level known, and only then', async () => {
    const repos = withJlptIndex(await readingRepos({ learnerLevel: 5 }));
    await knowShare(repos, 0.5);
    expect(await levelUpSuggestion(repos, NOW)).toBeUndefined();
    await knowShare(repos, 1);
    expect(await levelUpSuggestion(repos, NOW)).toEqual({ level: 5, next: 4, percent: 100 });
    expect((await repos.settings.get()).learnerLevel).toBe(5);
  });

  it('suggests N4 on the e2e fixture pack once its N5 list is marked known (D88)', async () => {
    const repos = await fixtureRepos();
    await importKnown(repos, { lists: ['n5'], now: NOW });
    // Marking a whole level known moves the learner past it; back to N5 for the suggestion.
    await repos.settings.patch({ learnerLevel: 5 });
    expect(await levelUpSuggestion(repos, NOW)).toMatchObject({ level: 5, next: 4 });
  });

  it('reads the level lists once per pack version (N10)', async () => {
    const repos = withJlptIndex(await readingRepos({ learnerLevel: 5, packVersion: 'v1' }));
    const reads = { words: 0, kanji: 0 };
    const { wordsByJlpt, kanjiByJlpt } = repos.dictionary;
    repos.dictionary.wordsByJlpt = (level) => {
      reads.words++;
      return wordsByJlpt?.(level) ?? Promise.resolve([]);
    };
    repos.dictionary.kanjiByJlpt = (level) => {
      reads.kanji++;
      return kanjiByJlpt?.(level) ?? Promise.resolve([]);
    };
    await knowShare(repos, 1);
    const first = await levelUpSuggestion(repos, NOW);
    expect(await levelUpSuggestion(repos, NOW)).toEqual(first);
    expect(reads).toEqual({ words: 1, kanji: 1 });
    await repos.settings.patch({ packVersion: 'v2' });
    await levelUpSuggestion(repos, NOW);
    expect(reads).toEqual({ words: 2, kanji: 2 });
  });

  it('hides it for a week after "Not now", moves only when chosen, and stops at N3', async () => {
    const repos = withJlptIndex(await readingRepos({ learnerLevel: 5 }));
    await knowShare(repos, 1);
    await snoozeLevelUp(repos, NOW);
    expect(await levelUpSuggestion(repos, NOW + 1)).toBeUndefined();
    expect(await levelUpSuggestion(repos, NOW + LEVEL_UP_SNOOZE_MS + 1)).toBeDefined();
    await moveUpLevel(repos, 3);
    expect(await levelUpSuggestion(repos, NOW + LEVEL_UP_SNOOZE_MS + 1)).toBeUndefined();
  });
});

describe('levelProgress (IA2)', () => {
  it("counts the level's kanji, words and grammar known", async () => {
    const repos = withJlptIndex(await readingRepos({ learnerLevel: 5 }));
    const before = await levelProgress(repos);
    expect(before.level).toBe(5);
    expect(before.words).toEqual({
      known: 0,
      total: n5.filter((w) => w.forms.some(Boolean)).length,
    });
    expect(before.kanji.known).toBe(0);
    await knowShare(repos, 1);
    const after = await levelProgress(repos);
    expect(after.words.known).toBe(after.words.total);
    expect(after.grammar.known).toBeLessThanOrEqual(after.grammar.total);
  });
});
