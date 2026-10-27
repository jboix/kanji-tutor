import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExternalLink, ExternalLinks, KanjiLinks, SentenceSource } from './external-link.tsx';
import { jishoKanjiUrl } from './external-links.ts';

afterEach(() => vi.restoreAllMocks());

describe('ExternalLink (R9)', () => {
  it('opens the site in a new tab with no referrer, named for screen readers', () => {
    render(<ExternalLink site="jisho" href="https://jisho.org/search/x" />);
    const link = screen.getByRole('link', { name: 'Open on Jisho (new tab)' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('href')).toBe('https://jisho.org/search/x');
    expect(link.textContent).toBe('Jisho');
    expect(link.querySelector('svg')).toBeTruthy();
  });

  it('names what it looks up', () => {
    render(<ExternalLink site="jisho" href={jishoKanjiUrl('待')} subject="待" />);
    expect(screen.getByRole('link', { name: 'Open 待 on Jisho (new tab)' })).toBeTruthy();
  });

  it('links a kanji to Jisho and to Wiktionary', () => {
    render(<KanjiLinks char="待" />);
    const jisho = screen.getByRole('link', { name: 'Open 待 on Jisho (new tab)' });
    expect(jisho.getAttribute('href')).toBe(jishoKanjiUrl('待'));
    const wiktionary = screen.getByRole('link', { name: 'Open 待 on Wiktionary (new tab)' });
    expect(wiktionary.getAttribute('href')).toBe('https://en.wiktionary.org/wiki/%E5%BE%85');
  });

  it('says it needs a connection when offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(
      <ExternalLinks>
        <ExternalLink site="wiktionary" href="https://en.wiktionary.org/wiki/x" />
      </ExternalLinks>,
    );
    const link = screen.getByRole('link', {
      name: 'Open on Wiktionary (new tab), needs a connection',
    });
    expect(link.textContent).toContain('needs a connection');
  });
});

describe('SentenceSource (R9)', () => {
  it('credits a Tatoeba sentence with a link to it', () => {
    render(<SentenceSource source="tatoeba" sourceRef="4711" />);
    const link = screen.getByRole('link', { name: 'Open #4711 on Tatoeba (new tab)' });
    expect(link.getAttribute('href')).toBe('https://tatoeba.org/en/sentences/show/4711');
    expect(link.closest('p')?.textContent).toContain('Sentence from');
  });

  it('shows nothing for other sources', () => {
    const { container } = render(<SentenceSource source="unit" sourceRef="unit:x:1" />);
    expect(container.textContent).toBe('');
  });
});
