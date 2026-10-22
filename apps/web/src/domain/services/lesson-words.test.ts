import { describe, expect, it } from 'vitest';
import { knowBasics, NOW, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { isoWeek } from '../ids.ts';
import { addLessonWords } from './lesson-words.ts';
import { buildSession } from './session.ts';

describe('addLessonWords', () => {
  it('adds pasted words as new textbook words of the lesson and week, fresh in sessions', async () => {
    const repos = await readingRepos();
    await knowBasics(repos);
    const result = await addLessonWords(repos, {
      pasted: '学生\nふぉお\n学生',
      lesson: 'Tobira 第5課',
      now: NOW,
    });
    expect(result).toEqual({ added: 1, tracked: 0, notFound: ['ふぉお'], lesson: 'Tobira 第5課' });
    const item = await repos.items.get(`word:${W.gakusei.id}`);
    expect(item).toMatchObject({
      level: 0,
      source: { kind: 'textbook', lesson: 'Tobira 第5課', week: isoWeek(new Date(NOW)) },
    });
    expect((await repos.settings.get()).currentLesson).toBe('Tobira 第5課');
    const cards = await buildSession(repos, { now: NOW, size: 5 });
    expect(cards.some((c) => c.targets.some((t) => t.wordId === W.gakusei.id))).toBe(true);
  });

  it('defaults to the current lesson and leaves tracked words alone', async () => {
    const repos = await readingRepos({ currentLesson: 'Tobira 第4課' });
    await track(repos, [[W.eki, 3]]);
    const result = await addLessonWords(repos, { pasted: '駅\n本', now: NOW });
    expect(result).toEqual({ added: 1, tracked: 1, notFound: [], lesson: 'Tobira 第4課' });
    expect((await repos.items.get(`word:${W.eki.id}`))?.level).toBe(3);
    expect((await repos.items.get(`word:${W.hon.id}`))?.source.lesson).toBe('Tobira 第4課');
  });

  it('adds words without a tag when there is no lesson', async () => {
    const repos = await readingRepos();
    const result = await addLessonWords(repos, { pasted: '本', now: NOW });
    expect(result).toEqual({ added: 1, tracked: 0, notFound: [] });
    expect((await repos.items.get(`word:${W.hon.id}`))?.source.lesson).toBeUndefined();
  });
});
