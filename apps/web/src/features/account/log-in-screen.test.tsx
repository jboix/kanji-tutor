import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithServices } from '../../test/render.tsx';
import { LogInScreen } from './log-in-screen.tsx';

describe('LogInScreen', () => {
  it('shows the three ways in, not yet available, and goes back to the welcome', () => {
    renderWithServices(<LogInScreen />, { path: '/log-in' });
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeTruthy();
    for (const name of [/^Link from your phone/, /^Use a passkey/, /^Email me a code/]) {
      expect(screen.getByRole('button', { name })).toHaveProperty('disabled', true);
    }
    expect(screen.getByText(/Cloud saves are not available yet/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to the welcome' })).toBeTruthy();
  });

  it('reads in French and Spanish', () => {
    const { unmount } = renderWithServices(<LogInScreen />, { language: 'fr' });
    expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    unmount();
    renderWithServices(<LogInScreen />, { language: 'es' });
    expect(screen.getByRole('button', { name: /^Usar una llave de acceso/ })).toBeTruthy();
  });
});
