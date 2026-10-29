import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Word } from '../../domain/types.ts';
import { dictionaryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { GuidesScreen } from './guides-screen.tsx';

const ASOBU: Word = {
  id: '1',
  forms: ['遊ぶ'],
  readings: ['あそぶ'],
  glosses: ['to play'],
  common: true,
  pos: ['v5b'],
};

function open(path: string) {
  const repos = dictionaryRepos([ASOBU], []);
  renderWithServices(
    <Routes>
      <Route path="/guides" element={<GuidesScreen />} />
      <Route path="/guides/:id" element={<GuidesScreen />} />
    </Routes>,
    { path, services: fakeServices({ repos }) },
  );
}

describe('the guides', () => {
  it('lists every guide with its level', () => {
    open('/guides');
    for (const name of ['Verb groups', 'The て-form and た-form', 'Keigo', 'Conjugation table']) {
      expect(screen.getByRole('link', { name: new RegExp(name) })).toBeTruthy();
    }
  });

  it('shows the て-form’s sound changes with worked examples', () => {
    open('/guides/te-form');
    expect(screen.getByRole('heading', { name: 'て形とた形' })).toBeTruthy();
    const rules = screen.getByRole('table', { name: 'Group 1, by the last kana' });
    expect(within(rules).getByText('買う → 買って')).toBeTruthy();
    expect(within(rules).getByText('読む → 読んで')).toBeTruthy();
  });

  it('conjugates a picked verb, then one typed in kana, in every form', async () => {
    open('/guides/conjugation');
    await userEvent.click(screen.getByRole('button', { name: '食べる' }));
    expect(screen.getByRole('table', { name: /^食べる/ })).toBeTruthy();
    // Potential and passive alike.
    expect(screen.getAllByText('食べられる')).toHaveLength(2);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Any verb' }), 'あそぶ{Enter}');
    const table = await screen.findByRole('table', { name: /^遊ぶ · Group 1/ });
    expect(within(table).getByText('遊んで')).toBeTruthy();
  });

  it('says when a typed word is not a verb', async () => {
    open('/guides/conjugation');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Any verb' }), 'ほん{Enter}');
    expect(await screen.findByRole('status')).toBeTruthy();
  });

  it('lists keigo’s verbs with their own words', () => {
    open('/guides/keigo');
    expect(screen.getByRole('table', { name: 'Verbs with their own words' })).toBeTruthy();
    expect(screen.getByText('召し上がる')).toBeTruthy();
  });
});
