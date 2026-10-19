import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionCard } from '../../domain/session-types.ts';
import { noKey, TARGET } from '../../test/explain-results.ts';
import { readingRepos, S } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import { resetIntroduced } from './intro-once.ts';
import { NewItemIntro } from './new-item-intro.tsx';
import { TargetHint } from './target-hint.tsx';

const CARD: SessionCard = { sentence: S.waiting, targets: [TARGET], reason: 'new' };

async function render(ui: React.ReactElement, language: UiLanguage) {
  const services = fakeServices({ repos: await readingRepos(), ai: fakeAi({ memoryHook: noKey }) });
  return renderWithServices(ui, { services, language });
}

beforeEach(() => {
  resetIntroduced();
  localStorage.clear();
});

describe('teaching in the learner language (N7b, N9)', () => {
  it('introduces a word in French, its English meaning marked (en)', async () => {
    await render(<NewItemIntro card={CARD} target={TARGET} onDone={vi.fn()} />, 'fr');
    const card = await screen.findByRole('region', { name: 'Nouveau mot : 待つ' });
    expect(card.textContent).toContain('verbe godan');
    expect(card.textContent).toContain('Nouveau à votre niveau : un mot du JLPT N5.');
    expect(within(card).getByRole('note', { name: 'en anglais' })).toBeTruthy();
    expect(within(card).getByRole('button', { name: 'Compris' })).toBeTruthy();
  });

  it('gives a hint in Spanish', async () => {
    await render(
      <TargetHint card={CARD} target={TARGET} onShowReading={vi.fn()} onClose={vi.fn()} />,
      'es',
    );
    const sheet = await screen.findByRole('dialog', { name: 'Pista para 待って' });
    expect(await within(sheet).findByRole('button', { name: 'Mostrar la lectura' })).toBeTruthy();
    expect(sheet.textContent).toContain('Ver la lectura cuenta como “No lo sé”.');
  });
});
