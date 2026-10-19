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
    // The day's session mixes in exercises (S7): "6 phrases et 2 exercices, environ 5 minutes."
    const lead = await screen.findByText(/, environ \d+ minutes?\./);
    expect(lead.textContent).toMatch(/^\d+ phrases? et \d+ exercices?, environ \d+ minutes?\. /);
    expect(lead.textContent).toContain('de Tobira 第4課.');
    expect(screen.getByRole('region', { name: 'Où vous en êtes' }).textContent).toContain(
      'La seule erreur portait sur une voyelle longue, comme しょかい pour しょうかい.',
    );
    expect(await screen.findByRole('button', { name: 'Mélange du jour' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Réglages' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Commencer la prochaine série' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Cette semaine en cours' })).toBeTruthy();
  });

  it('reads in Spanish', async () => {
    await renderToday('es');
    const lead = await screen.findByText(/, unos \d+ minutos?\./);
    expect(lead.textContent).toMatch(/^\d+ frases? y \d+ ejercicios?, unos \d+ minutos?\. /);
    expect(screen.getByRole('region', { name: 'Dónde estás' }).textContent).toContain(
      'El único fallo fue una vocal larga, como しょかい por しょうかい.',
    );
    expect(screen.getByRole('link', { name: 'Aprender' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Mezcla del día' })).toBeTruthy();
  });
});
