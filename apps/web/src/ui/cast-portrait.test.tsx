import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithServices } from '../test/render.tsx';
import { CastStack, Portrait } from './cast-portrait.tsx';
import { castNames, UnitCast } from './unit-cast.tsx';

describe('the cast portraits', () => {
  it('draws each portrait on its own disc, hidden from screen readers', () => {
    const { container } = render(<Portrait who="mori" size={40} />);
    const disc = container.firstElementChild as HTMLElement;
    expect(disc.dataset.who).toBe('mori');
    expect(disc.getAttribute('aria-hidden')).toBe('true');
    expect(disc.style.width).toBe('40px');
  });

  it('stacks the portraits in order', () => {
    const { container } = render(<CastStack who={['yuki', 'ken', 'mori']} />);
    const who = [...container.querySelectorAll<HTMLElement>('[data-who]')].map(
      (d) => d.dataset.who,
    );
    expect(who).toEqual(['yuki', 'ken', 'mori']);
  });

  it('names the cast as a list in the interface language', () => {
    const cast = [
      { id: 'yuki', speaker: 'ユキ', name: 'Yuki' },
      { id: 'ken', speaker: 'ケン', name: 'Ken' },
      { id: 'mori', speaker: '森', name: 'Mori-san' },
    ] as const;
    expect(castNames(cast, 'en')).toBe('Yuki, Ken, and Mori-san');
    expect(castNames(cast.slice(0, 2), 'fr')).toBe('Yuki et Ken');
  });

  it("shows a unit's cast with a lead line, and nothing for a unit without one", async () => {
    renderWithServices(
      <>
        <UnitCast unit={{ id: 'a', grammar: ['koto-ni-suru'] }} lead={(n) => `With ${n}`} />
        <UnitCast unit={{ id: 'b', grammar: [] }} lead={(n) => `Also ${n}`} />
      </>,
    );
    expect(await screen.findByText('With Yuki and Ken')).toBeTruthy();
    expect(screen.queryByText(/^Also/)).toBeNull();
  });
});
