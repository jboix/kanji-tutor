import { act, fireEvent, screen, within } from '@testing-library/react';
import { Link } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeServices, renderWithServices } from '../test/render.tsx';
import { activeColumn, BottomNav, resetIndicator } from './bottom-nav.tsx';

function navAt(path: string) {
  renderWithServices(<BottomNav install={false} />, { services: fakeServices(), path });
  return screen.getByRole('navigation', { name: 'Main' });
}

const current = (nav: HTMLElement) =>
  within(nav)
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent);

const indicator = (nav: HTMLElement) => {
  const el = nav.querySelector<HTMLElement>('[data-nav-indicator]');
  if (!el) throw new Error('no indicator');
  return el;
};

describe('BottomNav (IA3)', () => {
  beforeEach(resetIndicator);

  it('has Home, Learn, Start, Tutor and Settings, with Start in the middle', () => {
    const nav = navAt('/');
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/learn',
      '/tutor',
      '/settings',
    ]);
    // Start sits between Learn and Tutor, and opens the sheet of rounds rather than a screen.
    const start = within(nav).getByRole('button', { name: 'Start a round' });
    expect(start.getAttribute('aria-haspopup')).toBe('dialog');
    expect(links[1]?.compareDocumentPosition(start)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(start.compareDocumentPosition(links[2] as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(current(nav)).toEqual(['Home']);
  });

  it.each([
    ['/learn', 'Learn'],
    ['/kanji/%E5%BE%85', 'Learn'],
    ['/notes', 'Learn'],
    ['/capture', 'Tutor'],
    ['/import', 'Tutor'],
    ['/settings/backup', 'Settings'],
    ['/plan', 'Home'],
  ])('marks the tab of %s', (path, tab) => {
    expect(current(navAt(path))).toEqual([tab]);
  });

  it('draws line art for Learn, and the 解 seal for Tutor, with no dot', async () => {
    const nav = navAt('/learn');
    const learn = within(nav).getByRole('link', { name: 'Learn' });
    expect(learn.querySelector('svg')).toBeTruthy();
    expect(learn.textContent).toBe('Learn');
    const tutor = within(nav).getByRole('link', { name: 'Tutor' });
    expect(tutor.querySelector('[data-seal="解"]')).toBeTruthy();
    await Promise.resolve();
    expect(tutor.querySelector('[data-unset]')).toBeNull();
  });

  it('dashes the seal and shows the dot while the tutor is not set up', async () => {
    renderWithServices(<BottomNav install={false} />, {
      services: fakeServices({ tutorReady: () => false }),
      path: '/',
    });
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const tutor = await within(nav).findByRole('link', { name: 'Tutor, not set up yet' });
    expect(tutor.querySelector('[data-unset]')).toBeTruthy();
  });

  it('puts the highlight on the active column, and hides it where no tab owns the screen', () => {
    expect(activeColumn('/')).toBe(0);
    expect(activeColumn('/grammar/te-form')).toBe(1);
    expect(activeColumn('/compose')).toBe(3);
    expect(activeColumn('/settings/tutor')).toBe(4);
    expect(activeColumn('/start')).toBeUndefined();
    expect(activeColumn('/read')).toBeUndefined();
    const nav = navAt('/settings');
    expect(indicator(nav).style.getPropertyValue('--column')).toBe('4');
    expect(indicator(nav).dataset.hidden).toBeUndefined();
  });

  it('moves the highlight when the route changes', () => {
    renderWithServices(
      <>
        <Link to="/tutor">go</Link>
        <BottomNav install={false} />
      </>,
      { services: fakeServices(), path: '/' },
    );
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(indicator(nav).style.getPropertyValue('--column')).toBe('0');
    act(() => {
      fireEvent.click(screen.getByRole('link', { name: 'go' }));
    });
    expect(indicator(nav).style.getPropertyValue('--column')).toBe('3');
  });

  it("starts a new screen's highlight where the last screen's was, then moves it", async () => {
    const first = renderWithServices(<BottomNav install={false} />, {
      services: fakeServices(),
      path: '/learn',
    });
    first.unmount();
    const moves: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) if (record.oldValue) moves.push(record.oldValue);
    });
    observer.observe(document.body, {
      subtree: true,
      attributeFilter: ['style'],
      attributeOldValue: true,
    });
    const nav = navAt('/settings');
    await Promise.resolve();
    observer.disconnect();
    // It was drawn on Learn's column first, then moved to Settings'.
    expect(moves).toContain('--column: 1;');
    expect(indicator(nav).style.getPropertyValue('--column')).toBe('4');
  });
});
