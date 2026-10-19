import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { ContentLookup } from '../../domain/content-language.ts';
import {
  ES_GRAMMAR,
  ES_PARTICLES,
  FR_GRAMMAR,
  lookupWithout,
} from '../../test/content-fixtures.ts';
import { grammarRepos } from '../../test/grammar-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { GrammarScreen } from './grammar-screen.tsx';

const content = vi.hoisted(() => ({ lookup: undefined as ContentLookup | undefined }));

vi.mock('../../domain/content-language.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../domain/content-language.ts')>();
  return { ...real, loadContentLanguage: async () => content.lookup ?? real.ENGLISH_CONTENT };
});

async function open(path: string, lang: 'fr' | 'es', missing: string[] = []) {
  content.lookup = lookupWithout(lang, missing);
  const repos = await grammarRepos({ lang });
  renderWithServices(
    <Routes>
      <Route path="/grammar/:id" element={<GrammarScreen />} />
    </Routes>,
    { services: fakeServices({ repos }), path },
  );
}

describe('grammar page in the learner’s language (N9)', () => {
  it('shows the French meaning, formation and explanation, unmarked', async () => {
    await open('/grammar/masu', 'fr');
    const text = FR_GRAMMAR.masu;
    expect((await screen.findAllByText(text?.meaning ?? '')).length).toBeGreaterThan(0);
    const formed = screen.getByRole('region', { name: "How it's formed" });
    expect(within(formed).getByText('V-radical')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'What it does' }).textContent).toContain(
      'rend un verbe poli',
    );
    expect(screen.queryByRole('note', { name: 'in English' })).toBeNull();
  });

  it('shows the Spanish text on a particle page', async () => {
    await open('/grammar/particle-ga', 'es');
    const text = ES_PARTICLES['particle-ga'];
    expect((await screen.findAllByText(text?.meaning ?? '')).length).toBeGreaterThan(0);
    const uses = screen.getByRole('region', { name: "How it's used" });
    expect(within(uses).getByText(`“${text?.uses[0]?.translation}”`)).toBeTruthy();
    expect(within(uses).getByText('雨が降っています。')).toBeTruthy();
  });

  it('falls back to English, marked (en), for an id the language lacks', async () => {
    await open('/grammar/te-mo-ii', 'fr', ['te-mo-ii']);
    const hero = (await screen.findAllByText('it is all right to; may'))[0]?.closest('p');
    const mark = within(hero as HTMLElement).getByRole('note', { name: 'in English' });
    expect(mark.textContent).toBe('(en)');
    expect(mark.getAttribute('lang')).toBe('en');
  });

  it('shows the intro card in the learner’s language', async () => {
    await open('/grammar/te-mo-ii?intro=1', 'es');
    const card = await screen.findByRole('region', { name: 'New grammar: 〜てもいい' });
    expect(await within(card).findByText(ES_GRAMMAR['te-mo-ii']?.meaning ?? '')).toBeTruthy();
  });
});
