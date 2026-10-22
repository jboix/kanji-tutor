import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fixtureRepos } from '../../test/fixture-pack.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { PlacementScreen } from './placement-screen.tsx';

describe('Find my level in French and Spanish (N7b)', () => {
  it('asks in French, with the instruction and the count in French', async () => {
    const repos = await fixtureRepos();
    renderWithServices(<PlacementScreen />, { services: fakeServices({ repos }), language: 'fr' });
    expect(screen.getByRole('heading', { name: 'Trouver mon niveau' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Commencer' }));
    const card = await screen.findByRole('region', { name: 'Question 1 sur environ 15' });
    expect(card.textContent).toContain('Je ne sais pas');
    expect(card.textContent).toMatch(/Comment se lit le mot souligné \?|d’après le texte/);
  });

  it('introduces the placement in Spanish', async () => {
    const repos = await fixtureRepos();
    renderWithServices(<PlacementScreen />, { services: fakeServices({ repos }), language: 'es' });
    expect(screen.getByRole('heading', { name: 'Encontrar mi nivel' })).toBeTruthy();
    expect(screen.getByText(/nunca una puntuación/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Empezar' })).toBeTruthy();
  });
});
