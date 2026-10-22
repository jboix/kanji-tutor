import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClozeDrill, FamilyDrill, ReadingsDrill } from '../../domain/drills/index.ts';
import type { Repos } from '../../domain/repos.ts';
import { drillRepos, swap } from '../../test/drill-fixtures.ts';
import { S, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { DrillScreen } from './drill-screen.tsx';
import { ReadScreen } from './read-screen.tsx';

function show(repos: Repos, drill: Parameters<typeof DrillScreen>[0]['drill']) {
  const onDone = vi.fn();
  renderWithServices(<DrillScreen drill={drill} topBar={null} onDone={onDone} />, {
    services: fakeServices({ repos }),
  });
  return onDone;
}

/** Reads every sentence card right (by its dictionary reading) until a drill shows. */
async function readUntilDrill() {
  const readings: Record<string, string> = { 来: 'ki', 学生: 'gakusei', 先生: 'sensei' };
  for (let i = 0; i < 4 && !screen.queryByText(/Which kanji fits/); i++) {
    const input = await screen.findByLabelText(/^Reading of /);
    const surface = input.closest('form')?.textContent?.replace('Reading of ', '') ?? '';
    await userEvent.type(input, `${readings[surface] ?? 'nu'}{Enter}`);
    await userEvent.click(await screen.findByRole('button', { name: /^Next (sentence|word)$/ }));
  }
}

describe('drills in the read screen', () => {
  it('shows a lookalike drill after a sentence, records a wrong choice, then moves on', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(swap);
    renderWithServices(<ReadScreen />, {
      services: fakeServices({ repos }),
      path: '/read?drills=1',
    });
    await readUntilDrill();
    expect(screen.getByText(/swapped recently/)).toBeTruthy();
    expect(document.querySelector('main [lang="ja"]')?.textContent).toContain('〇');
    await userEvent.click(screen.getByRole('button', { name: '持' }));
    expect(await screen.findByText('You chose')).toBeTruthy();
    expect(screen.getByRole('deletion').textContent).toBe('持');
    const readings = screen.getByRole('list', { name: 'Readings' });
    expect(within(readings).getByText('も・つ', { exact: false })).toBeTruthy();
    const logged = (await repos.reviews.all()).at(-1);
    expect(logged).toMatchObject({ mode: 'drill', verdict: 'wrong', errorType: 'wrong-kanji' });
    const next = screen.getByRole('button', { name: 'Next sentence' });
    expect(document.activeElement).toBe(next);
    await userEvent.click(next);
    expect(screen.queryByText(/Which kanji fits/)).toBeNull();
  });
});

describe('DrillScreen', () => {
  it('asks each reading of 生 in turn, with feedback per word', async () => {
    const repos = await drillRepos();
    const item = (form: string, wordId: string, reading: string, kanjiReading: string) => ({
      wordId,
      itemId: `word:${wordId}` as const,
      form,
      kanjiReading,
      readings: [reading],
    });
    const drill: ReadingsDrill = {
      kind: 'readings',
      kanji: '生',
      items: [
        item('生きる', W.ikiru.id, 'いきる', 'い.きる'),
        item('一生', W.issho.id, 'いっしょう', 'ショウ'),
      ],
    };
    const onDone = show(repos, drill);
    await userEvent.type(screen.getByLabelText('Reading of 生きる'), 'ikiru{Enter}');
    expect(await screen.findByText('いきる')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Next word' }));
    await userEvent.type(await screen.findByLabelText('Reading of 一生'), 'issho{Enter}');
    expect(await screen.findByText('· long vowel')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'readings', right: false });
    expect((await repos.reviews.all()).map((r) => r.mode)).toEqual(['drill', 'drill']);
  });

  it('asks for the on reading of a family member and reveals it', async () => {
    const repos = await drillRepos();
    const drill: FamilyDrill = {
      kind: 'family',
      part: '生',
      sound: 'セイ',
      known: ['生', '星'],
      guess: '性',
      itemId: 'kanjiReading:性:セイ',
      accepted: ['せい', 'しょう'],
      word: { form: '性', reading: 'せい' },
    };
    const onDone = show(repos, drill);
    expect(screen.getByText('guess it')).toBeTruthy();
    expect(screen.getAllByText('known')).toHaveLength(2);
    await userEvent.type(screen.getByLabelText("On'yomi of 性"), 'sei{Enter}');
    expect(await screen.findByText('As a word')).toBeTruthy();
    expect(screen.queryByText('guess it')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'family', right: true });
  });

  it('offers the lesson patterns for a grammar cloze', async () => {
    const repos = await drillRepos();
    const drill: ClozeDrill = {
      kind: 'cloze',
      sentence: S.waiting,
      grammarId: 'ている',
      itemId: 'grammar:ている',
      meaning: 'ongoing action',
      start: 7,
      end: 10,
      choices: [
        { grammarId: 'ながら', pattern: 'ながら' },
        { grammarId: 'ている', pattern: 'ている' },
        { grammarId: 'ことにする', pattern: 'ことにする' },
      ],
    };
    const onDone = show(repos, drill);
    expect(screen.getByText('Which pattern fits?')).toBeTruthy();
    expect(screen.getByText('＿＿＿')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'ている' }));
    expect(await screen.findByText('· ongoing action')).toBeTruthy();
    expect(screen.queryByText('You chose')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'cloze', right: true });
    expect((await repos.reviews.all())[0]).toMatchObject({
      itemId: 'grammar:ている',
      verdict: 'correct',
    });
  });
});
