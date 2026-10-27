import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { grammarRepos } from '../../test/grammar-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { PeekProvider } from '../../ui/peek-link.tsx';
import { GrammarIntro } from './grammar-intro.tsx';

describe('grammar intro card (G4)', () => {
  it('shows pattern, meaning, formation, explanation and two examples', async () => {
    const onDone = vi.fn();
    const services = fakeServices({ repos: await grammarRepos() });
    renderWithServices(<GrammarIntro grammarId="te-mo-ii" onDone={onDone} />, { services });
    expect(screen.getByText('New grammar · N5')).toBeTruthy();
    expect(screen.getByText('〜てもいい')).toBeTruthy();
    expect(screen.getByText('it is all right to; may')).toBeTruthy();
    expect(screen.getByText('もいい')).toBeTruthy();
    expect(await screen.findByText('“May I take a photo?”')).toBeTruthy();
    expect(screen.getByText('“You may sit.”')).toBeTruthy();
    const more = screen.getByRole('link', { name: 'More about this' });
    expect(more.getAttribute('href')).toBe('/grammar/te-mo-ii');
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('introduces a particle with two of its uses', () => {
    renderWithServices(<GrammarIntro grammarId="particle-ga" onDone={() => undefined} />);
    const card = screen.getByRole('region', { name: 'New grammar: が' });
    expect(card.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('subject marker')).toBeTruthy();
  });

  it('has a compact "about this grammar" form, with no examples and no Got it (L4)', () => {
    renderWithServices(<GrammarIntro grammarId="te-mo-ii" onDone={() => undefined} compact />);
    const card = screen.getByRole('region', { name: 'About 〜てもいい' });
    expect(card.textContent).toContain('About this grammar · N5');
    expect(card.textContent).toContain('it is all right to; may');
    expect(screen.getByText('もいい')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull();
    expect(screen.queryByText('“May I take a photo?”')).toBeNull();
    expect(screen.getByRole('link', { name: 'More about this' })).toBeTruthy();
  });

  it('has no "More about this" on the point’s own page, which it would only open again', () => {
    renderWithServices(<GrammarIntro grammarId="te-mo-ii" onDone={() => undefined} compact />, {
      path: '/grammar/te-mo-ii',
    });
    expect(screen.getByRole('region', { name: 'About 〜てもいい' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'More about this' })).toBeNull();
  });

  it('opens "More about this" in a sheet inside a session, the exercise kept', () => {
    const pagePeek = ({ id }: { id: string }) => <p>page of {id}</p>;
    renderWithServices(
      <PeekProvider>
        <GrammarIntro grammarId="te-mo-ii" onDone={() => undefined} compact />
      </PeekProvider>,
      { slots: { pagePeek } },
    );
    fireEvent.click(screen.getByRole('link', { name: 'More about this' }));
    expect(screen.getByText('page of te-mo-ii')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'About 〜てもいい' })).toBeTruthy();
  });

  it('calls onDone at once for an id outside the catalogue', async () => {
    const onDone = vi.fn();
    const { container } = renderWithServices(<GrammarIntro grammarId="nope" onDone={onDone} />);
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(container.textContent).toBe('');
  });
});
