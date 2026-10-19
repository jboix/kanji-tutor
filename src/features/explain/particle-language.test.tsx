import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ContentLookup } from '../../domain/content-language.ts';
import { ES_PARTICLES, lookupWithout } from '../../test/content-fixtures.ts';
import { readingRepos, S } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { ParticleSheet } from './particle-sheet.tsx';

const content = vi.hoisted(() => ({ lookup: undefined as ContentLookup | undefined }));

vi.mock('../../domain/content-language.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../domain/content-language.ts')>();
  return { ...real, loadContentLanguage: async () => content.lookup ?? real.ENGLISH_CONTENT };
});

/** で in 駅で待っています (token 1). */
const DE = 1;

async function open(lang: 'fr' | 'es', missing: string[] = []) {
  content.lookup = lookupWithout(lang, missing);
  const repos = await readingRepos();
  await repos.settings.patch({ uiLanguage: lang });
  renderWithServices(<ParticleSheet sentence={S.waiting} tokenIndex={DE} onClose={vi.fn()} />, {
    services: fakeServices({ repos }),
  });
  return screen.getByRole('dialog', { name: 'で in this sentence' });
}

describe('particle sheet in the learner’s language (N9)', () => {
  it('shows the Spanish note and uses, keeping the Japanese examples', async () => {
    const sheet = await open('es');
    const text = ES_PARTICLES['particle-de'];
    const note = await within(sheet).findByRole('region', { name: `で: ${text?.meaning}` });
    expect(note.textContent).toContain(text?.uses[0]?.use);
    expect(note.textContent).toContain(text?.uses[0]?.translation);
    expect(within(note).getByText('図書館で勉強します。').getAttribute('lang')).toBe('ja');
    expect(within(note).queryByRole('note', { name: 'in English' })).toBeNull();
  });

  it('marks the English note (en) when French lacks the particle', async () => {
    const sheet = await open('fr', ['particle-de']);
    const note = within(sheet).getByRole('region', { name: 'で: at, in, by, with' });
    expect(await within(note).findByRole('note', { name: 'in English' })).toBeTruthy();
    expect(note.textContent).toContain('Where an action happens');
  });
});
