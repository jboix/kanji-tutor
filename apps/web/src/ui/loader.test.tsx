import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inLanguage } from '../test/render.tsx';
import { Loader } from './loader.tsx';
import { LOADER_KANJI } from './loader-kanji.ts';

describe('Loader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows nothing for a quick load, then a kanji writing itself, named Loading', () => {
    render(inLanguage(<Loader />));
    expect(screen.queryByRole('status')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const status = screen.getByRole('status', { name: 'Loading' });
    const strokes = status.querySelectorAll('path[pathLength="1"]');
    expect(strokes.length).toBeGreaterThan(0);
    expect(status.querySelector('[lang="ja"]')?.textContent).toMatch(/^\p{Script=Hiragana}+$/u);
    expect(status.textContent).toMatch(new RegExp(`· ${strokes.length} strokes?$`));
  });

  it('goes on to the next kanji once one is written', () => {
    render(inLanguage(<Loader delay={0} />));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const first = screen.getByRole('status').textContent;
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('status').textContent).not.toBe(first);
  });

  it('gives the meaning in the interface language', () => {
    render(inLanguage(<Loader delay={0} />, 'fr'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const text = screen.getByRole('status', { name: 'Chargement' }).textContent ?? '';
    const shown = LOADER_KANJI.find((kanji) => text.startsWith(kanji.reading));
    expect(text).toContain(`${shown?.meaning.fr} · `);
    expect(text).toMatch(/traits?$/);
  });

  it('draws every kanji of the set from real stroke paths', () => {
    expect(LOADER_KANJI.length).toBeGreaterThanOrEqual(12);
    for (const kanji of LOADER_KANJI) {
      expect(kanji.strokes.length).toBeGreaterThan(0);
      for (const stroke of kanji.strokes) expect(stroke).toMatch(/^M[\d.]+,[\d.]+[cC]/);
    }
  });
});
