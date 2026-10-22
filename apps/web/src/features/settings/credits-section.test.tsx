import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithServices } from '../../test/render.tsx';
import { CreditsSection } from './credits-section.tsx';

describe('CreditsSection', () => {
  it('lists each work with its licence and offers the full texts', () => {
    renderWithServices(<CreditsSection />);
    expect(screen.getByRole('heading', { name: 'Credits' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByRole('link', { name: 'Tatoeba' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'CC BY 2.0 FR' })).toBeTruthy();
    const download = screen.getByRole('link', { name: 'Download the full licence texts' });
    expect(download.getAttribute('href')).toBe('/third-party-licenses.txt');
    expect(download.hasAttribute('download')).toBe(true);
  });
});
