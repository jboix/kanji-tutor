import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Word } from '../../domain/types.ts';
import { readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import { ExplainWordSheet } from './word-sheet.tsx';

/** Token 7 of 駅で友達を待っている間に、本を読みました。 is 間. */
const AIDA = 7;

async function open(language: UiLanguage, patch: Partial<Word> = {}) {
  const repos = await readingRepos();
  await track(repos, [[W.aida, 2]]);
  const word = repos.dictionary.word.bind(repos.dictionary);
  repos.dictionary.word = async (id) => {
    const found = await word(id);
    return found && id === W.aida.id ? { ...found, ...patch } : found;
  };
  const ai = fakeAi({ peek: vi.fn(async () => undefined) });
  renderWithServices(
    <ExplainWordSheet sentence={S.waiting} tokenIndex={AIDA} onClose={vi.fn()} />,
    {
      services: fakeServices({ ai, repos }),
      language,
    },
  );
}

describe('the word sheet in the learner language (N7b, N9)', () => {
  it('speaks French, with French glosses unmarked when the pack has them', async () => {
    await open('fr', { glossesByLang: { fr: ['espace ; intervalle'] } });
    const sheet = screen.getByRole('dialog', { name: '間 dans cette phrase' });
    const dictionary = await within(sheet).findByRole('region', { name: 'Dans le dictionnaire' });
    expect(dictionary.textContent).toContain('espace ; intervalle');
    expect(within(dictionary).queryByText('(en)')).toBeNull();
    const says = within(sheet).getByRole('region', { name: 'Ce qu’elle dit' });
    expect(within(says).getByText('(en)')).toBeTruthy();
    expect(
      within(sheet).getByRole('button', { name: /^Demander au tuteur à propos de ce mot, / }),
    ).toBeTruthy();
    expect(within(sheet).getByRole('region', { name: 'Ses kanji' })).toBeTruthy();
  });

  it('speaks Spanish and marks English glosses and translation "(en)"', async () => {
    await open('es');
    const sheet = screen.getByRole('dialog', { name: '間 en esta frase' });
    const dictionary = await within(sheet).findByRole('region', { name: 'En el diccionario' });
    expect(dictionary.textContent).toContain('space; interval');
    expect(within(dictionary).getByRole('note', { name: 'en inglés' })).toBeTruthy();
    const says = within(sheet).getByRole('region', { name: 'Qué dice' });
    expect(within(says).getByText('(en)')).toBeTruthy();
    expect(within(sheet).getByRole('button', { name: /^Desglosar con el tutor, / })).toBeTruthy();
  });

  it('shows no mark in English', async () => {
    await open('en');
    const sheet = screen.getByRole('dialog', { name: '間 in this sentence' });
    await within(sheet).findByRole('region', { name: 'In the dictionary' });
    expect(within(sheet).queryByText('(en)')).toBeNull();
  });
});
