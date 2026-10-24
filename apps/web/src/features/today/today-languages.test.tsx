import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { knowBasics, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import { TodayScreen } from './today-screen.tsx';

async function renderToday(language: UiLanguage) {
  const repos = await readingRepos({ currentLesson: 'Tobira 第4課' });
  await knowBasics(repos);
  await track(repos, [[W.matsu, 2]], { lesson: 'Tobira 第4課' });
  await repos.reviews.add({
    at: Date.now() - 1000,
    itemId: `word:${W.shoukai.id}`,
    answer: 'shokai',
    expected: 'しょうかい',
    verdict: 'near-miss',
    errorType: 'long-vowel',
    durationMs: 3000,
    mode: 'typed',
  });
  renderWithServices(<TodayScreen />, { services: fakeServices({ repos }), language });
}

describe('TodayScreen in other languages (N7b)', () => {
  it('reads in French', async () => {
    await renderToday('fr');
    expect(
      await screen.findByRole('link', { name: /^Mélange du jour\s?\d+ phrases? · \d+ minutes?$/ }),
    ).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Où vous en êtes' }).textContent).toContain(
      'La seule erreur portait sur une voyelle longue, comme しょかい pour しょうかい.',
    );
    expect(screen.getByRole('region', { name: 'S’entraîner' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Réglages' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Commencer une série' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Cette semaine en cours' })).toBeTruthy();
  });

  it('reads in Spanish', async () => {
    await renderToday('es');
    expect(
      await screen.findByRole('link', { name: /^Mezcla del día\s?\d+ frases? · \d+ minutos?$/ }),
    ).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Dónde estás' }).textContent).toContain(
      'El único fallo fue una vocal larga, como しょかい por しょうかい.',
    );
    expect(screen.getByRole('link', { name: 'Aprender' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Practicar' })).toBeTruthy();
  });
});
