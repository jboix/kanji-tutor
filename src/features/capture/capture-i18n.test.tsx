import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CAPTURE_LINES,
  captureDictionary,
  fixtureTokenize,
} from '../../domain/services/capture-fixtures.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeLang, fakeServices, renderWithServices } from '../../test/render.tsx';
import { CaptureScreen } from './capture-screen.tsx';

const TEXT = CAPTURE_LINES.map((line) => line.text).join('\n');

function services() {
  return fakeServices({
    repos: createMemoryRepos({ dictionary: captureDictionary() }),
    lang: fakeLang({ tokenize: fixtureTokenize }),
  });
}

describe('CaptureScreen in French and Spanish (N7b, N9)', () => {
  it('reads a pasted text in French and marks English glosses (en)', async () => {
    renderWithServices(<CaptureScreen />, {
      services: services(),
      path: '/capture',
      language: 'fr',
    });
    expect(screen.getByRole('heading', { name: 'Capturer en cours' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Coller du texte à la place' }));
    fireEvent.change(screen.getByLabelText('Texte japonais, une ligne par phrase'), {
      target: { value: TEXT },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ce texte' }));
    expect(await screen.findByRole('heading', { name: /^Vous pouvez lire \d+ % de ce texte$/ }));
    expect(screen.getByText('Texte collé · ajouté aujourd’hui')).toBeTruthy();
    const list = screen.getByRole('region', { name: 'Mots et points de grammaire nouveaux' });
    fireEvent.click(within(list).getByRole('button', { name: 'Voir la liste' }));
    expect(within(list).getAllByRole('note', { name: 'en anglais' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: CAPTURE_LINES[0]?.text ?? '' }));
    const words = await screen.findByRole('region', { name: 'Mots de cette ligne' });
    expect(within(words).getAllByText('(en)').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^Demander au tuteur à propos de cette ligne, / }));
  });

  it('shows the capture home in Spanish', () => {
    renderWithServices(<CaptureScreen />, {
      services: services(),
      path: '/capture',
      language: 'es',
    });
    expect(screen.getByRole('heading', { name: 'Capturar de clase' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Fotografiar una página, / })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Elegir de la galería, / })).toBeTruthy();
    expect(screen.queryByText(/Photograph/)).toBeNull();
  });
});
