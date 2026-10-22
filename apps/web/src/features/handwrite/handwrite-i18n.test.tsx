import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { rebuildKanjiReadings } from '../../domain/services/kanji-readings.ts';
import { readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import { HandwriteScreen } from './handwrite-screen.tsx';
import { SAMPLES } from './recognizer/sample-strokes.ts';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

async function render(language: UiLanguage) {
  const repos = await readingRepos();
  await track(repos, [
    [W.matsu, 3],
    [W.motsu, 2],
    [W.ji, 3],
  ]);
  await rebuildKanjiReadings(repos);
  renderWithServices(<HandwriteScreen />, { services: fakeServices({ repos }), language });
}

function draw(name: RegExp) {
  const canvas = screen.getByRole('img', { name });
  for (const stroke of SAMPLES.待 ?? []) {
    const [first, ...rest] = stroke;
    if (!first) continue;
    const at = ([x, y]: readonly [number, number]) => ({ clientX: x, clientY: y, isPrimary: true });
    fireEvent.pointerDown(canvas, { ...at(first), pointerId: 1, button: 0 });
    for (const point of rest) fireEvent.pointerMove(canvas, at(point));
    fireEvent.pointerUp(canvas, at(stroke.at(-1) ?? first));
  }
}

describe('HandwriteScreen in French and Spanish (N7b)', () => {
  it('draws and explains a candidate in French', async () => {
    await render('fr');
    expect(
      screen.getByText('Dessinez un kanji, dans n’importe quel ordre de traits.'),
    ).toBeTruthy();
    draw(/Zone de dessin/);
    const detail = await screen.findByRole('region', { name: 'À propos de 待' });
    expect(detail.textContent).toContain(
      'Dans 1 de vos mots. Partage 寺 avec 持 et 時, que vous avez aussi rencontrés.',
    );
    expect(screen.getByRole('button', { name: 'Annuler le dernier trait' })).toBeTruthy();
  });

  it('switches to describing in Spanish', async () => {
    await render('es');
    expect(screen.getByText('Dibuja un kanji, en cualquier orden de trazos.')).toBeTruthy();
    await userEvent.click(screen.getByRole('radio', { name: 'Describir' }));
    expect(screen.getByLabelText('Describe el kanji')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Buscar el kanji, / })).toBeTruthy();
  });
});
