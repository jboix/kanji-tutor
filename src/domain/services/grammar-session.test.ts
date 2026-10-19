import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { fixturePack } from '../../test/fixture-pack.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import { itemId } from '../ids.ts';
import { introduceGrammar } from './grammar-intro.ts';
import { newWordItem } from './items.ts';
import { buildSession } from './session.ts';

async function knownLearner() {
  const repos = await curriculumRepos();
  const items = fixturePack().words.map((w) => {
    const item = newWordItem({ wordId: w.id, kind: 'import', now: NOW, level: 3 });
    return item.card ? { ...item, card: { ...item.card, due: NOW + 30 * 86_400_000 } } : item;
  });
  await repos.items.putMany(items);
  await repos.settings.patch({ learnerLevel: 4 });
  return repos;
}

describe('a grammar focus session (/read?grammar=…)', { timeout: 30_000 }, () => {
  it('introduces the point, then reads and asks only sentences and questions with it', async () => {
    const repos = await knownLearner();
    const cards = await buildSession(repos, { now: NOW, grammar: 'te-iru' });
    expect(cards[0]?.grammarIntro).toBe('te-iru');
    const rest = cards.slice(1);
    expect(rest.length).toBeGreaterThan(1);
    for (const card of rest.filter((c) => !c.question)) {
      expect(card.sentence.grammarIds).toContain('te-iru');
      expect(card.sentence.level ?? 0).toBeGreaterThanOrEqual(4);
    }
    const asked = rest.flatMap((c) => (c.question?.kind === 'grammar-form' ? [c.question] : []));
    expect(asked.every((q) => q.itemId === itemId('grammar', 'te-iru'))).toBe(true);
    expect(rest.some((c) => c.question)).toBe(true);
  });

  it('skips the introduction once the point is introduced, and is empty for an unknown point', async () => {
    const repos = await knownLearner();
    await introduceGrammar(repos, 'te-iru', NOW);
    const cards = await buildSession(repos, { now: NOW, grammar: 'te-iru' });
    expect(cards.some((c) => c.grammarIntro)).toBe(false);
    expect(await buildSession(repos, { now: NOW, grammar: 'nope' })).toEqual([]);
  });
});
