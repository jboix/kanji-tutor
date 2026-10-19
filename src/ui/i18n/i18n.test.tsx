import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { EnMark } from '../en-mark.tsx';
import { I18nProvider, loadInitialLanguage, useI18n, useT } from './i18n.tsx';
import { ENGLISH } from './load.ts';

function Probe() {
  const { setLanguage, rich, language } = useI18n();
  const t = useT();
  return (
    <div>
      <p>{t('common.next')}</p>
      <p data-testid="rich">{rich('ai.refused', { status: <b>403</b> })}</p>
      <button type="button" onClick={() => void setLanguage(language === 'en' ? 'es' : 'en')}>
        switch
      </button>
      <EnMark />
      <EnMark english={false} />
    </div>
  );
}

describe('I18nProvider', () => {
  it('is English outside a provider', () => {
    render(<Probe />);
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('switches the whole tree and <html lang> at once', async () => {
    render(
      <I18nProvider initial={{ language: 'en', messages: ENGLISH }}>
        <Probe />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'switch' }));
    expect(await screen.findByText('Siguiente')).toBeTruthy();
    await waitFor(() => expect(document.documentElement.lang).toBe('es'));
    expect(screen.getByRole('note', { name: 'en inglés' })).toBeTruthy();
  });

  it('puts React nodes in the holes of a rich message', () => {
    render(<Probe />);
    const rich = screen.getByTestId('rich');
    expect(rich.querySelector('b')?.textContent).toBe('403');
    expect(rich.textContent).toContain('Gemini refused the request (403)');
  });

  it('marks English fallbacks once, with a spoken label', () => {
    render(<Probe />);
    expect(screen.getAllByText('(en)')).toHaveLength(1);
    expect(screen.getByRole('note', { name: 'in English' })).toBeTruthy();
  });
});

describe('loadInitialLanguage', () => {
  it('uses the saved language, else the browser, else English', async () => {
    const repos = createMemoryRepos();
    await repos.settings.patch({ uiLanguage: 'fr' });
    expect((await loadInitialLanguage(repos)).language).toBe('fr');
    const broken = { settings: { get: () => Promise.reject(new Error('x')) } };
    await act(async () => {
      const loaded = await loadInitialLanguage(broken as never);
      expect(loaded.language).toBe('en');
    });
  });
});
