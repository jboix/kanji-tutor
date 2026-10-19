import { describe, expect, it } from 'vitest';
import { NOW, readingRepos, S } from '../../test/reading-fixtures.ts';
import type { SessionCard } from '../session-types.ts';
import { unitById } from '../themes/index.ts';
import {
  exercisesGrammar,
  grammarIntroCard,
  grammarQueue,
  introducedGrammar,
  introduceGrammar,
  unintroducedGrammar,
  withGrammarIntros,
} from './grammar-intro.ts';

const reading = (grammarIds: string[]): SessionCard => ({
  sentence: { ...S.came, grammarIds },
  targets: [],
  reason: 'new',
});

describe('grammar introductions (G4)', () => {
  it('queues the unit grammar first, then later units of the level, never easier or known ones', () => {
    const unit = unitById('my-day')?.grammar ?? [];
    const queue = grammarQueue({
      level: 5,
      unitGrammar: unit,
      introduced: new Set([unit[0] ?? '']),
    });
    expect(queue).toEqual(unit.slice(1, 3));
    const n4 = grammarQueue({ level: 4, unitGrammar: ['desu'], introduced: new Set(), count: 3 });
    expect(n4).toHaveLength(3);
    expect(n4).not.toContain('desu');
  });

  it('keeps unintroduced points of the level out of questions, but not easier ones', () => {
    const skip = unintroducedGrammar(4, new Set(), ['te-mo-ii']);
    expect(skip.has('desu')).toBe(false);
    expect(skip.has('te-mo-ii')).toBe(false);
    expect(skip.size).toBeGreaterThan(10);
  });

  it('puts the introduction right before the first card that uses the point, first too (L8)', () => {
    const cards = [reading(['te-iru']), reading([]), reading(['te-iru'])];
    const out = withGrammarIntros(cards, ['te-iru', 'mashita']);
    expect(out.map((c) => c.grammarIntro ?? 'card')).toEqual(['te-iru', 'card', 'card', 'card']);
    const later = withGrammarIntros([reading([]), reading(['te-iru'])], ['te-iru']);
    expect(later.map((c) => c.grammarIntro ?? 'card')).toEqual(['card', 'te-iru', 'card']);
    expect(exercisesGrammar(grammarIntroCard('x'), 'x')).toBe(false);
  });

  it('marks the first exercise with a "New grammar" chip instead, when explanations are skipped (L7)', () => {
    const cards = [reading([]), reading(['te-iru']), reading(['te-iru'])];
    const out = withGrammarIntros(cards, ['te-iru'], false);
    expect(out.some((c) => c.grammarIntro)).toBe(false);
    expect(out.map((c) => c.newGrammar ?? [])).toEqual([[], ['te-iru'], []]);
  });

  it('records the point as an item with an FSRS card, once', async () => {
    const repos = await readingRepos();
    await introduceGrammar(repos, 'te-iru', NOW);
    await introduceGrammar(repos, 'te-iru', NOW + 1);
    const item = await repos.items.get('grammar:te-iru');
    expect(item).toMatchObject({ kind: 'grammar', level: 1, updatedAt: NOW });
    expect(introducedGrammar(await repos.items.byKind('grammar'))).toEqual(new Set(['te-iru']));
  });
});
