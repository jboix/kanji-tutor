import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { AddScreen } from './add-screen.tsx';

describe('AddScreen (IA3)', () => {
  it('chooses between a photo of a page, a sentence of your own and words from class', () => {
    renderWithServices(<AddScreen />, { services: fakeServices(), path: '/add' });
    expect(screen.getByRole('heading', { name: 'Add' })).toBeTruthy();
    const href = (name: RegExp) => screen.getByRole('link', { name }).getAttribute('href');
    expect(href(/^Scanned lessons/)).toBe('/capture');
    expect(href(/^Write a sentence/)).toBe('/compose');
    expect(href(/^Words from class/)).toBe('/import');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Add' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('reads in French and Spanish', () => {
    const { unmount } = renderWithServices(<AddScreen />, { language: 'fr' });
    expect(screen.getByRole('heading', { name: 'Ajouter' })).toBeTruthy();
    unmount();
    renderWithServices(<AddScreen />, { language: 'es' });
    expect(screen.getByRole('link', { name: /^Escribir una frase/ })).toBeTruthy();
  });
});
