import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import type { Kanji, Word } from '../../domain/types.ts';
import { withJlptIndex } from '../../test/jlpt-index.ts';
import { ALL_WORDS, K, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { LearnedScreen } from './learned-screen.tsx';

const KANJI: Kanji[] = K.map((k) => (['駅', '本', '読'].includes(k.char) ? { ...k, jlpt: 5 } : k));

async function repos(words: readonly Word[] = ALL_WORDS): Promise<Repos> {
  return withJlptIndex(await readingRepos(), words, KANJI);
}

function render(r: Repos) {
  renderWithServices(<LearnedScreen />, { services: fakeServices({ repos: r }), path: '/learned' });
}

describe('LearnedScreen', () => {
  it('shows kanji coverage per level and links a kanji to its page', async () => {
    const r = await repos();
    await r.kanjiReadings.put({
      id: '駅:エキ',
      kanji: '駅',
      reading: 'エキ',
      level: 3,
      wordIds: ['1'],
    });
    render(r);
    const n5 = await screen.findByRole('button', { name: /N5 kanji: 1 of 3 known/ });
    expect(screen.queryByRole('button', { name: /N4 kanji/ })).toBeNull();
    await userEvent.click(n5);
    expect(n5.getAttribute('aria-expanded')).toBe('true');
    const link = screen.getByRole('link', { name: '駅, known' });
    expect(link.getAttribute('href')).toBe(`/kanji/${encodeURIComponent('駅')}`);
    expect(screen.queryByRole('link', { name: '本, not started' })).toBeNull();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Show not started' }));
    expect(screen.getByRole('link', { name: '本, not started' })).toBeTruthy();
  });

  it('lists words by level with their state', async () => {
    const r = await repos();
    await track(r, [
      [W.eki, 3],
      [W.matsu, 2],
    ]);
    render(r);
    await userEvent.click(await screen.findByRole('radio', { name: 'Words' }));
    const n5 = await screen.findByRole('button', { name: /N5 words: 1 of 11 known, 1 learning/ });
    await userEvent.click(n5);
    const region = screen.getByRole('region', { name: 'N5 words' });
    const rows = within(region).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      '待つまつto waitLearning',
      '駅えきstationKnown',
    ]);
  });

  it('renders at most 200 rows at a time, with show more', async () => {
    const many = Array.from(
      { length: 450 },
      (_, i): Word => ({
        id: `9${i}`,
        forms: [`字${i}`],
        readings: ['じ'],
        glosses: ['letter'],
        common: true,
        jlpt: 4,
      }),
    );
    const r = await repos(many);
    render(r);
    await userEvent.click(await screen.findByRole('radio', { name: 'Words' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Show not started' }));
    await userEvent.click(await screen.findByRole('button', { name: /N4 words: 0 of 450/ }));
    const region = screen.getByRole('region', { name: 'N4 words' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(200);
    await userEvent.click(within(region).getByRole('button', { name: 'Show more (200 of 250)' }));
    expect(within(region).getAllByRole('listitem')).toHaveLength(400);
  });

  it('shows grammar without a level under other, and says when there is none', async () => {
    const r = await repos();
    render(r);
    await userEvent.click(await screen.findByRole('radio', { name: 'Grammar' }));
    expect(await screen.findByText(/No grammar points yet/)).toBeTruthy();
  });

  it('links each grammar row to its page and the tab to the grammar index (G4)', async () => {
    const r = await repos();
    await r.grammar.put({
      id: 'te-mo-ii',
      pattern: '〜てもいい',
      meaning: 'may',
      level: 5,
      exampleSentenceIds: [],
    });
    render(r);
    await userEvent.click(await screen.findByRole('radio', { name: 'Grammar' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Show not started' }));
    await userEvent.click(await screen.findByRole('button', { name: /^N5 grammar/ }));
    const row = await screen.findByRole('link', { name: /〜てもいい/ });
    expect(row.getAttribute('href')).toBe('/grammar/te-mo-ii');
    const all = screen.getByRole('link', { name: /All grammar points/ });
    expect(all.getAttribute('href')).toBe('/grammar');
  });

  it('applies the N5 list again without changing the counts the second time (P2)', async () => {
    const r = await repos();
    render(r);
    await userEvent.click(await screen.findByRole('radio', { name: 'Words' }));
    await screen.findByRole('button', { name: /N5 words: 0 of 11 known/ });
    const apply = screen.getByRole('button', { name: 'Mark N5 words known' });
    await userEvent.click(apply);
    expect((await screen.findByRole('status')).textContent).toBe('N5: 11 words marked as known.');
    await screen.findByRole('button', { name: /N5 words: 11 of 11 known/ });
    await userEvent.click(apply);
    expect((await screen.findByRole('status')).textContent).toBe(
      'N5: Nothing new to mark; 11 words were already known.',
    );
    expect(screen.getByRole('button', { name: /N5 words: 11 of 11 known/ })).toBeTruthy();
    expect(await r.items.count()).toBe(11);
    expect((await r.settings.get()).learnerLevel).toBe(4);
  });
});
