import { describe, expect, it } from 'vitest';
import { HON, withJlptIndex } from '../../test/jlpt-index.ts';
import { knowBasics, NOW, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import { buildSession } from './session.ts';

const DAY = 86_400_000;

describe('buildSession', () => {
  it('puts a due word in an i+1 sentence with readings that include attached endings', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]]);
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    const card = cards.find((c) => c.targets.some((t) => t.wordId === W.matsu.id));
    expect(card?.reason).toBe('due');
    const target = card?.targets.find((t) => t.wordId === W.matsu.id);
    expect(target?.readings[0]).toBe(card?.sentence.id === S.waiting.id ? 'まっ' : 'まつ');
    for (const c of cards.filter((c) => !c.drill))
      expect(c.targets.length).toBeGreaterThanOrEqual(1);
  });

  it('never shows an N4 sentence to an N5 learner (G3)', async () => {
    const repos = await readingRepos({ learnerLevel: 5 });
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]]);
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    expect(cards.map((c) => c.sentence.id)).not.toContain(S.waiting.id);
    expect(cards.every((c) => (c.sentence.level ?? 5) === 5)).toBe(true);
  });

  it('accepts まって as well as まっ for 待っ + て, and keeps 間 read あいだ', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await repos.sentences.delete(S.waitPlain.id);
    await track(repos, [[W.matsu, 2]]);
    const [card] = await buildSession(repos, { now: NOW, size: 5 });
    expect(card?.sentence.id).toBe(S.waiting.id);
    const readings = Object.fromEntries(card?.targets.map((t) => [t.surface, t.readings]) ?? []);
    expect(readings).toEqual({ 待っ: ['まっ', 'まって'], 間: ['あいだ'] });
  });

  it('skips a sentence where a lone-kanji target has an unlikely reading (間 → ま)', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [[W.ma, 1]]);
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    expect(cards.map((c) => c.sentence.id)).not.toContain(S.ma.id);
  });

  it('skips sentences whose token reading JMdict does not know (金 → きむ)', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [[W.kane, 1]]);
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    expect(cards.map((c) => c.sentence.id)).not.toContain(S.misfit.id);
  });

  it('accepts a 来る stem read き', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [[W.kuru, 2]]);
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    const card = cards.find((c) => c.sentence.id === S.came.id);
    expect(card?.targets[0]?.readings).toEqual(['き', 'きまし', 'きました']);
  });

  it('introduces new words that are the only unknown word of a sentence', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    const student = cards.find((c) => c.sentence.id === S.student.id);
    expect(student?.reason).toBe('new');
    expect(student?.targets.map((t) => t.surface)).toEqual(['学生']);
  });

  it('includes fresh words of the current lesson that are not due yet', async () => {
    const repos = await readingRepos({ currentLesson: 'Tobira 第4課', learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [[W.gakusei, 1]], { dueIn: 5 * DAY, lesson: 'Tobira 第4課' });
    const cards = await buildSession(repos, { now: NOW, size: 1 });
    expect(cards[0]?.targets[0]?.wordId).toBe(W.gakusei.id);
    expect(cards[0]?.reason).toBe('new');
  });

  it('builds a focused session from the words that prove a kanji reading', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [[W.matsu, 3]], { dueIn: 10 * DAY });
    await repos.kanjiReadings.put({
      id: '待:ま.つ',
      kanji: '待',
      reading: 'ま.つ',
      level: 3,
      wordIds: [W.matsu.id],
    });
    const cards = await buildSession(repos, { now: NOW, focus: { kanji: '待', reading: 'ま.つ' } });
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.reason === 'focus')).toBe(true);
    const none = await buildSession(repos, { now: NOW, focus: { kanji: '待', reading: 'タイ' } });
    expect(none).toEqual([]);
  });

  it('sizes the session from an accepted plan', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [
      [W.matsu, 2],
      [W.gakusei, 1],
    ]);
    await repos.plans.put({
      id: '2026-W42',
      createdAt: NOW,
      letter: [],
      lines: [],
      status: 'accepted',
      mix: { dailyMinutes: 1, focusErrorTypes: { sokuon: 0.5 }, grammarIds: [], drillShare: 0 },
    });
    const cards = await buildSession(repos, { now: NOW });
    expect(cards.length).toBeLessThanOrEqual(5);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('prefers sentences not read in the last two days', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]]);
    await repos.reviews.add({
      at: NOW - DAY,
      itemId: `word:${W.matsu.id}`,
      sentenceId: S.waitPlain.id,
      answer: 'まつ',
      expected: 'まつ',
      verdict: 'correct',
      durationMs: 3000,
      mode: 'typed',
    });
    const cards = await buildSession(repos, { now: NOW, size: 1 });
    expect(cards[0]?.sentence.id).toBe(S.waiting.id);
  });

  it('returns nothing for a learner with no words', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    expect(await buildSession(repos, { now: NOW })).toEqual([]);
  });

  it('starts a learner from zero on sentences whose one kanji word is N5 (P1)', async () => {
    const repos = withJlptIndex(await readingRepos({ learnerLevel: 5 }));
    await repos.sentences.put(HON);
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    expect(cards.map((c) => c.sentence.id)).toEqual(['s-hon']);
    expect(cards[0]?.targets.map((t) => t.wordId)).toEqual([W.hon.id]);
    expect(await repos.items.count()).toBe(0);
  });
});

describe('buildSession own sentences', () => {
  it('serves a capture sentence and a verified AI sentence over stored ones (R6)', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [
      [W.gakusei, 1],
      [W.matsu, 2],
    ]);
    const capture = { ...S.student, id: 'capture:c1:0', source: 'capture' as const };
    const ai = { ...S.waitPlain, id: 'ai:wait', source: 'ai' as const };
    const unverified = { ...S.waitPlain, id: 'ai:unchecked', source: 'ai' as const };
    await repos.sentences.putMany([capture, ai, { ...unverified, verified: false }]);
    const ids = (await buildSession(repos, { now: NOW, size: 5 })).map((c) => c.sentence.id);
    expect(ids).toContain(capture.id);
    expect(ids).toContain(ai.id);
    expect(ids).not.toContain(unverified.id);
    expect(ids).not.toContain(S.student.id);
  });
});

describe('buildSession fresh words', () => {
  it('leaves words met in a session to FSRS: not fresh, not rediscovered', async () => {
    const repos = await readingRepos({ learnerLevel: 3 });
    await knowBasics(repos);
    await track(repos, [[W.gakusei, 1]], { dueIn: DAY, kind: 'session' });
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    expect(cards.map((c) => c.sentence.id)).not.toContain(S.student.id);
    expect(cards.length).toBeGreaterThan(0);
  });
});
