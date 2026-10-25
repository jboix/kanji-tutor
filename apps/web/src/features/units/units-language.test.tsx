import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { ContentLookup } from '../../domain/content-language.ts';
import { ES_UNITS, FR_GRAMMAR, FR_UNITS, lookupWithout } from '../../test/content-fixtures.ts';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { UnitScreen } from './unit-screen.tsx';
import { UnitsScreen } from './units-screen.tsx';

const content = vi.hoisted(() => ({ lookup: undefined as ContentLookup | undefined }));

vi.mock('../../domain/content-language.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../domain/content-language.ts')>();
  return { ...real, loadContentLanguage: async () => content.lookup ?? real.ENGLISH_CONTENT };
});

async function reposIn(lang: 'fr' | 'es', missing: string[] = []) {
  content.lookup = lookupWithout(lang, missing);
  const repos = await curriculumRepos();
  await repos.settings.patch({ uiLanguage: lang });
  return repos;
}

async function openUnit(lang: 'fr' | 'es', id: string, missing: string[] = []) {
  const services = fakeServices({ repos: await reposIn(lang, missing) });
  renderWithServices(
    <Routes>
      <Route path="/units/:id" element={<UnitScreen />} />
    </Routes>,
    { services, path: `/units/${id}` },
  );
  return screen.findByRole('heading', { name: 'はじめまして' });
}

describe('units in the learner’s language (N9)', { timeout: 30_000 }, () => {
  it('lists French themes, marking a unit French lacks', async () => {
    const repos = await reposIn('fr', ['family']);
    renderWithServices(<UnitsScreen />, { services: fakeServices({ repos }) });
    const n5 = await screen.findByRole('region', { name: 'N5 units' });
    const first = within(n5).getByRole('link', { name: /わたしは学生です/ });
    await waitFor(() => expect(first.textContent).toContain(FR_UNITS['i-am-a-student']?.theme));
    expect(within(first).queryByRole('note', { name: 'in English' })).toBeNull();
    const family = within(n5).getByRole('link', { name: /家族/ });
    expect(family.textContent).toContain('My family');
    expect(within(family).getByRole('note', { name: 'in English' }).textContent).toBe('(en)');
  });

  it('shows a unit’s Spanish theme, summary and passage translations', async () => {
    await openUnit('es', 'self-introduction');
    const text = ES_UNITS['self-introduction'];
    expect(await screen.findByText(text?.summary ?? '')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /^読み物/ }));
    const passage = await screen.findByRole('region', { name: 'Passage' });
    await userEvent.click(screen.getByRole('button', { name: 'Show the English' }));
    expect(passage.textContent).toContain(text?.sentences[1]);
  });

  it('shows the unit’s grammar meanings in French', async () => {
    await openUnit('fr', 'self-introduction');
    const unit = screen.getByRole('region', { name: 'In this unit' });
    expect(await within(unit).findByText(FR_GRAMMAR.desu?.meaning ?? '')).toBeTruthy();
  });

  it('falls back to the English unit, marked, when the id is missing', async () => {
    await openUnit('fr', 'self-introduction', ['self-introduction']);
    const theme = screen.getByText('Introducing yourself');
    expect(await within(theme).findByRole('note', { name: 'in English' })).toBeTruthy();
  });
});
