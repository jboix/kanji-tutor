import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import { dialogueCard } from './dialogue-card.ts';
import { recordDrillAnswer } from './drill-answer.ts';
import { exercisesGrammar, introduceGrammar } from './grammar-intro.ts';
import { cardItems } from './lesson-sections.ts';
import { buildSession } from './session.ts';
import { grammarSection, lessonData } from './unit-lesson.ts';

describe('the "complete the line" card (grammar dialogues)', { timeout: 60_000 }, () => {
  it('is made on one of the point’s dialogues, and on none for a point without', async () => {
    const card = await dialogueCard('koto-ni-naru', 'a');
    expect(card?.reason).toBe('drill');
    expect(card?.targets).toEqual([]);
    expect(card?.sentence.id).toMatch(/^drill:dialogue:koto-ni-naru-/);
    expect(card?.drill?.kind).toBe('dialogue');
    expect(card && exercisesGrammar(card, 'koto-ni-naru')).toBe(true);
    expect(card && cardItems(card)).toEqual([]);
    expect(await dialogueCard('te-mo-ii', 'a')).toBeUndefined();
  });

  it('comes last in a focus session, after the introduction of a new point', async () => {
    const repos = await curriculumRepos();
    const cards = await buildSession(repos, { now: NOW, grammar: 'koto-ni-naru' });
    expect(cards[0]?.grammarIntro).toBe('koto-ni-naru');
    expect(cards.at(-1)?.drill).toMatchObject({ kind: 'dialogue', grammarId: 'koto-ni-naru' });
    await introduceGrammar(repos, 'koto-ni-naru', NOW);
    const again = await buildSession(repos, { now: NOW, grammar: 'koto-ni-naru' });
    expect(again.some((c) => c.grammarIntro)).toBe(false);
    expect(again.at(-1)?.drill?.kind).toBe('dialogue');
  });

  it('follows a point’s drills in a lesson’s 文法 section', async () => {
    const repos = await curriculumRepos();
    const lesson = await lessonData(repos, 'i-am-a-student', { now: NOW, listening: false });
    if (!lesson) throw new Error('no lesson');
    // The points of the N4 unit "part-time-job", over the fixture pack's N5 lesson.
    const unit = { ...lesson.unit, grammar: ['you-ni-suru', 'tsumori', 'te-kureru'] };
    const cards = await grammarSection({ ...lesson, unit });
    const intro = cards.findIndex((c) => c.grammarIntro === 'you-ni-suru');
    const line = cards.findIndex((c) => c.drill?.kind === 'dialogue');
    const next = cards.findIndex((c, i) => i > intro && c.grammarIntro !== undefined);
    expect(intro).toBeGreaterThanOrEqual(0);
    expect(line).toBeGreaterThan(intro);
    expect(line).toBeLessThan(next);
    expect(cards.filter((c) => c.drill?.kind === 'dialogue')).toHaveLength(2);
  });

  it('logs a skip against the grammar point', async () => {
    const repos = await curriculumRepos();
    const card = await dialogueCard('tsumori', 'b');
    if (!card?.drill) throw new Error('no card');
    const grade = await recordDrillAnswer(repos, {
      drill: card.drill,
      step: 0,
      answer: '',
      durationMs: 900,
      now: NOW,
      skipped: true,
    });
    expect(grade).toMatchObject({ verdict: 'wrong', skipped: true, given: '' });
    expect((await repos.reviews.all()).at(-1)).toMatchObject({
      itemId: 'grammar:tsumori',
      skipped: true,
      mode: 'drill',
    });
  });
});
