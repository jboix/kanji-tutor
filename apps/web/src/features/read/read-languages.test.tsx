import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import { knowBasics, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import { ReadScreen } from './read-screen.tsx';

async function waitingRepos(): Promise<Repos> {
  const repos = await readingRepos({ currentLesson: 'Tobira 第4課', learnerLevel: 3 });
  await knowBasics(repos);
  await repos.sentences.delete(S.waitPlain.id);
  await repos.sentences.delete(S.came.id);
  await repos.sentences.delete(S.student.id);
  await track(repos, [[W.matsu, 2]], { lesson: 'Tobira 第4課' });
  return repos;
}

async function open(language: UiLanguage, label: string) {
  const repos = await waitingRepos();
  renderWithServices(<ReadScreen />, { services: fakeServices({ repos }), language });
  return screen.findByLabelText(label);
}

describe('the reading session in French and Spanish (N7b)', () => {
  it('labels the answer, the skip and the feedback in French', async () => {
    const input = await open('fr', 'Lecture de 待って');
    expect(input.getAttribute('placeholder')).toBe('Tapez la lecture');
    expect(screen.getByRole('button', { name: 'Je ne sais pas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Terminer la session' })).toBeTruthy();
    await userEvent.type(input, 'mate{Enter}');
    expect(await screen.findByText('Vous avez écrit')).toBeTruthy();
    expect(screen.getByText('Attendu')).toBeTruthy();
    expect(screen.getByText('Presque : petit っ')).toBeTruthy();
  });

  it('labels the answer and the next step in Spanish', async () => {
    const input = await open('es', 'Lectura de 待って');
    expect(input.getAttribute('placeholder')).toBe('Escribe la lectura');
    await userEvent.type(input, 'matte{Enter}');
    expect(await screen.findByText('Se lee')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Siguiente palabra' })).toBeTruthy();
  });
});
