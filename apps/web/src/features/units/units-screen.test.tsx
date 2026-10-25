import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import { finishLessonPart, startLessonSection } from '../../domain/services/index.ts';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { UnitScreen } from './unit-screen.tsx';
import { UnitsScreen } from './units-screen.tsx';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

function renderUnit(repos: Repos, id: string) {
  return renderWithServices(
    <Routes>
      <Route path="/units/:id" element={<UnitScreen />} />
      <Route path="*" element={<Where />} />
    </Routes>,
    {
      services: fakeServices({ repos }),
      path: `/units/${id}`,
    },
  );
}

describe('UnitsScreen (T4)', { timeout: 20_000 }, () => {
  it('shows the path by level, each unit as a card with its progress and each level with its counts', async () => {
    const repos = await curriculumRepos();
    renderWithServices(<UnitsScreen />, { services: fakeServices({ repos }) });
    const n5 = await screen.findByRole('region', { name: 'N5 units' });
    expect(within(n5).getByText('N5 · your level')).toBeTruthy();
    expect(within(n5).getByText('0 of 13 done')).toBeTruthy();
    const first = within(n5).getByRole('link', { name: /わたしは学生です/ });
    expect(first.getAttribute('href')).toBe('/units/i-am-a-student');
    expect(first.textContent).toContain('Current · Words');
    expect(first.textContent).toMatch(/\d+ words · 3 grammar points/);
    expect(first.textContent).toContain('Not started');
    const bar = within(first).getByRole('progressbar', { name: 'Progress: Not started' });
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    const known = await within(n5).findByRole('region', { name: 'N5 known' });
    expect(known.textContent).toMatch(/Words\s*0 of \d+/);
    expect(n5.querySelector('details')?.open).toBe(true);
    const n3 = screen.getByRole('region', { name: 'N3 units' });
    expect(n3.querySelector('details')?.open).toBe(false);
  });
});

describe('UnitScreen (T3)', { timeout: 30_000 }, () => {
  it('lists the lesson sections and opens one as a session part (S3)', async () => {
    const repos = await curriculumRepos();
    renderUnit(repos, 'self-introduction');
    expect(await screen.findByRole('heading', { name: 'はじめまして' })).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: /Progress: 0 of 5 sections/ })).toBeTruthy();
    const sections = screen.getByRole('region', { name: 'Sections' });
    const rows = within(sections).getAllByRole('button');
    expect(rows.map((row) => row.textContent?.split('·').slice(0, 3).join('·'))).toEqual([
      '1 · 言葉 · WordsNew words, then quick checks',
      '2 · 文法 · GrammarEach point explained, then its drills',
      '3 · 練習 · PracticeMixed exercises from the unit',
      '4 · 読み物 · ReadingThe passage and its questions',
      '5 · まとめ · Wrap-upA mixed review of the lesson',
    ]);
    expect(sections.querySelector('[aria-current="step"]')?.getAttribute('data-section')).toBe(
      'words',
    );
    for (const ja of within(sections).getAllByText(/^(言葉|文法|練習|読み物|まとめ)$/)) {
      expect(ja.getAttribute('lang')).toBe('ja');
    }
    await userEvent.click(within(sections).getByRole('button', { name: /1 · 言葉/ }));
    expect((await screen.findByTestId('where')).textContent).toBe(
      '/read?unit=self-introduction&section=words&part=1',
    );
  });

  it('shows a section part done and opens its next part', async () => {
    const repos = await curriculumRepos();
    await startLessonSection(repos, 'family', 'words', 2, Date.now());
    await finishLessonPart(repos, 'family', 'words', 1, Date.now());
    renderUnit(repos, 'family');
    const row = await screen.findByRole('button', { name: /1 · 言葉/ });
    expect(row.textContent).toContain('Part 1 of 2 done');
    await userEvent.click(await screen.findByRole('button', { name: /3 · 練習/ }));
    expect((await screen.findByTestId('where')).textContent).toBe(
      '/read?unit=family&section=practice&part=1',
    );
  });

  it('reads the passage, then goes to its questions', async () => {
    const repos = await curriculumRepos();
    renderUnit(repos, 'self-introduction');
    await userEvent.click(await screen.findByRole('button', { name: /4 · 読み物/ }));
    const passage = await screen.findByRole('region', { name: 'Passage' });
    await waitFor(() => expect(passage.textContent).toContain('はじめまして。'));
    await userEvent.click(screen.getByRole('button', { name: 'Show the English' }));
    expect(passage.textContent).toContain('Nice to meet you.');
    await userEvent.click(screen.getByRole('button', { name: /Answer the questions/ }));
    expect((await screen.findByTestId('where')).textContent).toBe(
      '/read?unit=self-introduction&section=reading&part=1',
    );
    expect((await repos.settings.get()).unitStatus?.['self-introduction']?.readAt).toBeDefined();
  });

  it('lets a review unit below the level be marked done', async () => {
    const repos = await curriculumRepos();
    await repos.settings.patch({ learnerLevel: 4 });
    renderUnit(repos, 'family');
    await userEvent.click(await screen.findByRole('button', { name: 'Mark as done' }));
    await waitFor(async () =>
      expect((await repos.settings.get()).unitStatus?.family?.doneAt).toBeDefined(),
    );
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Mark as done' })).toBeNull());
  });

  it('says so for an unknown unit', async () => {
    renderUnit(await curriculumRepos(), 'nope');
    expect(await screen.findByText('There is no such unit.')).toBeTruthy();
  });
});

describe('units in French and Spanish (N7b)', { timeout: 20_000 }, () => {
  it('shows the path in French', async () => {
    const repos = await curriculumRepos();
    renderWithServices(<UnitsScreen />, { services: fakeServices({ repos }), language: 'fr' });
    const n5 = await screen.findByRole('region', { name: 'Unités N5' });
    expect(within(n5).getByText('N5 · votre niveau')).toBeTruthy();
    expect(within(n5).getByText('0 sur 13 terminées')).toBeTruthy();
    const first = within(n5).getByRole('link', { name: /わたしは学生です/ });
    expect(first.textContent).toContain('En cours · Vocabulaire');
    expect(screen.getByRole('heading', { level: 1, name: 'Leçons' })).toBeTruthy();
  });

  it('shows a unit in Spanish', async () => {
    const repos = await curriculumRepos();
    renderWithServices(
      <Routes>
        <Route path="/units/:id" element={<UnitScreen />} />
      </Routes>,
      { services: fakeServices({ repos }), path: '/units/self-introduction', language: 'es' },
    );
    const steps = await screen.findByRole('region', { name: 'Secciones' });
    expect(within(steps).getByRole('button', { name: /1 · 言葉 · Vocabulario/ })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'En esta unidad' })).toBeTruthy();
  });
});
