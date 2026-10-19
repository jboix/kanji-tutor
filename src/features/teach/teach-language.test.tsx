import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ContentLookup } from '../../domain/content-language.ts';
import { sentenceGrammar } from '../../domain/grammar/index.ts';
import { ES_GRAMMAR, lookupWithout } from '../../test/content-fixtures.ts';
import { TARGET } from '../../test/explain-results.ts';
import { readingRepos, S } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { hardestGrammar } from './grammar-line.ts';
import { SentenceHelp } from './sentence-help.tsx';
import { SentenceWrapUp } from './sentence-wrap-up.tsx';

const content = vi.hoisted(() => ({ lookup: undefined as ContentLookup | undefined }));

vi.mock('../../domain/content-language.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../domain/content-language.ts')>();
  return { ...real, loadContentLanguage: async () => content.lookup ?? real.ENGLISH_CONTENT };
});

async function render(ui: React.ReactElement, lang: 'fr' | 'es', missing: string[] = []) {
  content.lookup = lookupWithout(lang, missing);
  const repos = await readingRepos();
  await repos.settings.patch({ uiLanguage: lang });
  return renderWithServices(ui, { services: fakeServices({ repos }) });
}

const grammar = sentenceGrammar(S.waiting);
const hardest = hardestGrammar(grammar);

describe('teach grammar lines in the learner’s language (N9)', () => {
  it('gives the wrap-up grammar line in Spanish', async () => {
    await render(<SentenceWrapUp sentence={S.waiting} />, 'es');
    const wrap = await screen.findByRole('region', { name: 'This sentence' });
    const meaning = ES_GRAMMAR[hardest?.id ?? '']?.meaning ?? '';
    await waitFor(() => expect(wrap.textContent).toContain(meaning));
    expect(within(wrap).queryByRole('note', { name: 'in English' })).toBeNull();
  });

  it('marks an English catalogue note (en) in the sentence help', async () => {
    const first = grammar[0];
    await render(
      <SentenceHelp card={{ sentence: S.waiting, targets: [TARGET], reason: 'new' }} step={0} />,
      'fr',
      [first?.id ?? ''],
    );
    await userEvent.click(screen.getByRole('button', { name: 'Explain this sentence' }));
    const sheet = await screen.findByRole('dialog', { name: 'About this sentence' });
    const notes = within(sheet).getByRole('region', { name: 'Grammar in it' });
    expect(await within(notes).findByRole('note', { name: 'in English' })).toBeTruthy();
    expect(notes.textContent).toContain(first?.meaning);
  });
});
