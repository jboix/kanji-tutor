import { fireEvent, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeLang, fakeServices, renderWithServices } from '../../test/render.tsx';
import { LearnScreen } from './learn-screen.tsx';
import { grammarMatches, kanjiIn } from './look-up.ts';

describe('look-up (IA4)', () => {
  it('finds the kanji typed and the grammar whose pattern matches', () => {
    expect(kanjiIn('学生々')).toEqual(['学', '生']);
    expect(grammarMatches('てもいい').map((g) => g.id)).toContain('te-mo-ii');
    expect(grammarMatches('〜てもいい')[0]?.id).toBe('te-mo-ii');
    expect(grammarMatches('から').some((g) => g.id.startsWith('particle-'))).toBe(true);
    expect(grammarMatches('  ')).toEqual([]);
  });
});

describe('LearnScreen (IA4)', () => {
  it('has a tile for each place to study, and the import', async () => {
    const repos = await curriculumRepos();
    renderWithServices(<LearnScreen />, { services: fakeServices({ repos }), path: '/learn' });
    expect(screen.getByRole('heading', { name: 'Learn' })).toBeTruthy();
    const href = (name: RegExp) => screen.getByRole('link', { name }).getAttribute('href');
    expect(href(/^Lessons/)).toBe('/units');
    expect(href(/^Kanji/)).toBe('/kanji');
    expect(href(/^Grammar/)).toBe('/grammar');
    expect(href(/^What you've learned/)).toBe('/learned');
    expect(href(/^Notes/)).toBe('/notes');
    expect(href(/^Draw a kanji/)).toBe('/handwrite');
    expect(href(/^Mark what you already know/)).toBe('/import');
    expect(await screen.findByText(/^Unit 1 of \d+ · N5$/)).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Learn' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('looks up a kanji, a kana word and a grammar pattern', async () => {
    const repos = await readingRepos();
    const lang = fakeLang({ suggestWords: async () => [W.shoukai] });
    renderWithServices(
      <Routes>
        <Route path="/learn" element={<LearnScreen />} />
        <Route path="/grammar/:id" element={<p>grammar page</p>} />
      </Routes>,
      { services: fakeServices({ repos, lang }), path: '/learn' },
    );
    const field = screen.getByRole('searchbox', { name: 'Look up' });
    fireEvent.change(field, { target: { value: '待つ' } });
    expect(screen.getByRole('link', { name: '待' }).getAttribute('href')).toBe('/kanji/%E5%BE%85');
    fireEvent.change(field, { target: { value: 'shoukai' } });
    expect(field).toHaveProperty('value', 'しょうかい');
    const words = await screen.findByRole('list', { name: 'Words' });
    expect(within(words).getByRole('link', { name: '紹' })).toBeTruthy();
    fireEvent.change(field, { target: { value: 'てもいい' } });
    const grammar = screen.getByRole('list', { name: 'Grammar' });
    expect(within(grammar).getByRole('link', { name: '〜てもいい' }).getAttribute('href')).toBe(
      '/grammar/te-mo-ii',
    );
    fireEvent.submit(field.closest('form') as HTMLFormElement);
    expect(await screen.findByText('grammar page')).toBeTruthy();
  });
});
