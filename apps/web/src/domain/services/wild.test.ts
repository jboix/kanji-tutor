import { describe, expect, it } from 'vitest';
import { NOW, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { rebuildKanjiReadings } from './kanji-readings.ts';
import { addWildWords, type SignInput, wildView } from './wild.ts';

const SIGN: SignInput = {
  place: 'Station sign',
  kanji: [
    { char: '学', box: [0, 0, 100, 100] },
    { char: '生', box: [0, 100, 100, 200] },
    { char: '待', box: [200, 0, 300, 100] },
  ],
  words: [
    { surface: '学生', reading: 'がくせい', meaning: 'student' },
    { surface: '待つ', reading: 'まつ', meaning: 'to wait' },
  ],
  readings: [
    { surface: '学生', reading: 'がくせい', verified: true },
    { surface: '待つ', reading: 'まつ', verified: false },
  ],
};

async function knowing() {
  const repos = await readingRepos();
  await track(repos, [[W.gakusei, 4]], { kind: 'textbook' });
  await rebuildKanjiReadings(repos);
  return repos;
}

describe('In the wild', () => {
  it('marks each kanji known or new, once each, and keeps every box', async () => {
    const view = await wildView(await knowing(), SIGN);
    expect(view.kanji.map((k) => [k.char, k.known])).toEqual([
      ['学', true],
      ['生', true],
      ['待', false],
    ]);
    expect(view.boxes.map((b) => b.known)).toEqual([true, true, false]);
    expect(view.place).toBe('Station sign');
  });

  it('lists only the words with a new kanji, with their checked reading and dictionary id', async () => {
    const view = await wildView(await knowing(), SIGN);
    expect(view.words).toEqual([
      expect.objectContaining({
        surface: '待つ',
        verified: false,
        wordId: W.matsu.id,
        added: false,
      }),
    ]);
  });

  it('adds words to study as captures, and then shows them added', async () => {
    const repos = await knowing();
    await addWildWords(repos, [W.matsu.id], NOW);
    expect((await repos.items.get(`word:${W.matsu.id}`))?.source.kind).toBe('capture');
    expect((await wildView(repos, SIGN)).words[0]?.added).toBe(true);
  });
});
