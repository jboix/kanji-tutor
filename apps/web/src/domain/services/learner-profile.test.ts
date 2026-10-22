import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { withJlptIndex } from '../../test/jlpt-index.ts';
import { NOW, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import type { Repos } from '../repos.ts';
import type { Review } from '../types.ts';
import { createLearnerView, estimateLevel, findGrammar, knownState } from './learner-profile.ts';
import { finishLessonPart } from './units.ts';

const DAY = 86_400_000;

function review(at: number, extra: Partial<Review> = {}, error = true): Review {
  const row: Review = {
    at,
    itemId: `word:${W.matsu.id}`,
    answer: 'もつ',
    expected: 'まつ',
    verdict: 'wrong',
    errorType: 'wrong-kanji',
    durationMs: 3000,
    mode: 'typed',
    ...extra,
  };
  if (!error) delete row.errorType;
  return row;
}

async function setup(settings = {}): Promise<Repos> {
  const repos = withJlptIndex(await readingRepos(settings));
  await track(repos, [
    [W.eki, 3],
    [W.hon, 4],
    [W.tomodachi, 3],
    [W.matsu, 1],
  ]);
  await repos.grammar.put({
    id: 'wake-dewa-nai',
    pattern: '〜わけではない',
    meaning: 'it is not that',
    level: 3,
    exampleSentenceIds: [S.student.id, S.waiting.id],
  });
  return repos;
}

describe('knownState and estimateLevel', () => {
  it('maps knowledge levels to unseen, learning and known', () => {
    expect([undefined, 0, 1, 2, 3, 4].map((l) => knownState(l as never))).toEqual([
      'unseen',
      'unseen',
      'learning',
      'learning',
      'known',
      'known',
    ]);
  });

  it('moves up past a level only at 80% known, and starts at N5 without lists', () => {
    expect(estimateLevel([])).toBe(3);
    expect(estimateLevel([{ level: 5, known: 0, total: 0 }])).toBe(5);
    expect(
      estimateLevel([
        { level: 5, known: 8, total: 10 },
        { level: 4, known: 1, total: 10 },
      ]),
    ).toBe(4);
  });
});

describe('getLearnerProfile', () => {
  it('names the current unit with its step, words and grammar (A10)', async () => {
    const repos = await curriculumRepos();
    const view = createLearnerView(repos, () => NOW);
    expect((await view.getLearnerProfile()).currentUnit).toBeUndefined();
    expect((await view.getLearnerProfile({ withUnit: true })).currentUnit).toMatchObject({
      id: 'i-am-a-student',
      level: 5,
      step: 'words',
    });
    await finishLessonPart(repos, 'i-am-a-student', 'words', 1, NOW);
    const before = await repos.settings.get();
    const unit = (await view.getLearnerProfile({ withUnit: true })).currentUnit;
    expect(unit).toMatchObject({ id: 'i-am-a-student', step: 'grammar' });
    expect(unit?.titleJa).toMatch(/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u);
    expect(unit?.theme).not.toBe('');
    expect(unit?.words.length).toBeGreaterThanOrEqual(8);
    expect(unit?.grammar.length).toBeGreaterThan(0);
    expect(unit?.grammar.every((pattern) => pattern.length > 0)).toBe(true);
    expect(await repos.settings.get()).toEqual(before);
  });

  it('estimates the level, reports coverage, language and the lesson', async () => {
    const repos = await setup({ currentLesson: 'Tobira 第4課', uiLanguage: 'fr' });
    const profile = await createLearnerView(repos, () => NOW).getLearnerProfile();
    expect(profile).toMatchObject({
      level: 5,
      levelSource: 'estimated',
      explanationLanguage: 'fr',
      currentLesson: 'Tobira 第4課',
      recentMistakes: [],
    });
    expect(profile.coverage.words[0]).toEqual({ level: 5, known: 3, total: 11 });
    expect(profile.coverage.grammar.find((c) => c.level === 3)).toEqual({
      level: 3,
      known: 0,
      total: 1,
    });
    expect(profile.coverage.kanji).toHaveLength(3);
    expect(profile).not.toHaveProperty('currentUnit');
  });

  it('uses the level the learner set and lists recent mistakes newest first', async () => {
    const repos = await setup({ learnerLevel: 4 });
    await repos.reviews.add(review(NOW - 2 * DAY));
    await repos.reviews.add(
      review(NOW - DAY, { verdict: 'near-miss', itemId: 'kanjiReading:間:ま' }),
    );
    await repos.reviews.add(review(NOW - DAY, { verdict: 'correct' }));
    await repos.reviews.add(review(NOW - DAY, { skipped: true }));
    await repos.reviews.add(review(NOW - 40 * DAY));
    await repos.reviews.add(review(NOW - 3 * DAY, { itemId: 'grammar:x' }, false));
    const { level, levelSource, recentMistakes } = await createLearnerView(
      repos,
      () => NOW,
    ).getLearnerProfile();
    expect([level, levelSource]).toEqual([4, 'set']);
    expect(recentMistakes.map((m) => [m.target, m.verdict, m.errorType])).toEqual([
      ['間', 'near-miss', 'wrong-kanji'],
      ['待つ', 'wrong', 'wrong-kanji'],
      ['x', 'wrong', undefined],
    ]);
    expect(recentMistakes[1]).toMatchObject({ expected: 'まつ', given: 'もつ' });
  });
});

describe('checkKnown', () => {
  it('answers per word, kanji and grammar point with state and JLPT level', async () => {
    const repos = await setup();
    await repos.kanjiReadings.put({
      id: '駅:エキ',
      kanji: '駅',
      reading: 'エキ',
      level: 3,
      wordIds: [],
    });
    const checks = await createLearnerView(repos).checkKnown({
      words: ['駅', '待つ', '鉛筆'],
      kanji: ['駅', '鉛'],
      grammar: ['わけではない', 'nope'],
    });
    expect(checks.map((c) => [c.kind, c.text, c.found, c.state, c.jlpt])).toEqual([
      ['word', '駅', true, 'known', 5],
      ['word', '待つ', true, 'learning', 5],
      ['word', '鉛筆', false, 'unseen', undefined],
      ['kanji', '駅', true, 'known', undefined],
      ['kanji', '鉛', false, 'unseen', undefined],
      ['grammar', 'わけではない', true, 'unseen', 3],
      ['grammar', 'nope', false, 'unseen', undefined],
    ]);
  });

  it('answers an empty query with nothing and caps long lists', async () => {
    const view = createLearnerView(await setup());
    expect(await view.checkKnown({})).toEqual([]);
    const many = Array.from({ length: 40 }, () => '駅');
    expect(await view.checkKnown({ words: many })).toHaveLength(30);
  });
});

describe('lookupWord and knownExamples', () => {
  it('looks a word up with readings, meanings, JLPT and state', async () => {
    const hits = await createLearnerView(await setup()).lookupWord(' 間 ');
    expect(hits.map((h) => [h.readings[0], h.jlpt, h.state])).toEqual([
      ['あいだ', 4, 'unseen'],
      ['ま', 3, 'unseen'],
    ]);
    expect(hits[0]?.meanings).toEqual(['space; interval']);
  });

  it('gives known words for a kanji', async () => {
    const examples = await createLearnerView(await setup()).knownExamples('駅');
    expect(examples).toEqual([{ kind: 'word', text: '駅', reading: 'えき', meaning: 'station' }]);
  });

  it('gives verified sentences for a grammar point or a word, fewest unknown words first', async () => {
    const repos = await setup();
    await repos.sentences.put({ ...S.waitPlain, id: 's-unverified', verified: false });
    const view = createLearnerView(repos);
    expect((await view.knownExamples('〜わけではない')).map((e) => e.text)).toEqual([
      S.student.text,
      S.waiting.text,
    ]);
    const forWord = await view.knownExamples('待つ');
    expect(forWord.map((e) => e.text)).toEqual([S.waitPlain.text, S.waiting.text]);
    expect(forWord[0]).toMatchObject({ kind: 'sentence', meaning: 's-wait-plain in English' });
  });

  it('finds grammar by id or by pattern without the wave dash', () => {
    const points = [{ id: 'nagara', pattern: '〜ながら', meaning: '', exampleSentenceIds: [] }];
    expect(findGrammar(points, 'nagara')?.id).toBe('nagara');
    expect(findGrammar(points, '~ながら')?.id).toBe('nagara');
    expect(findGrammar(points, 'のに')).toBeUndefined();
  });
});
