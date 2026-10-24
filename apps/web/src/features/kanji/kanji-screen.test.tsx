import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import { rebuildKanjiReadings } from '../../domain/services/kanji-readings.ts';
import { createLang } from '../../lang/index.ts';
import { NOW, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import type { ReadingHookSlotProps, TutorSheetSlotProps } from '../../ui/slots.tsx';
import { KanjiScreen } from './kanji-screen.tsx';

function render(repos: Repos, path: string, slots = {}, language: UiLanguage = 'en') {
  const lang = createLang({
    dictionary: repos.dictionary,
    tokenizer: { tokenize: async () => [] },
  });
  return renderWithServices(
    <Routes>
      <Route path="/kanji" element={<KanjiScreen />} />
      <Route path="/kanji/:char" element={<KanjiScreen />} />
      <Route path="/read" element={<p>read page</p>} />
    </Routes>,
    { services: fakeServices({ repos, lang }), path, slots, language },
  );
}

async function seiRepos(): Promise<Repos> {
  const repos = await readingRepos();
  await track(
    repos,
    [
      [W.gakusei, 4],
      [W.sensei, 3],
      [W.ikiru, 3],
    ],
    {
      kind: 'textbook',
      lesson: 'Minna 第1課',
    },
  );
  await track(repos, [[W.issho, 1]], { kind: 'capture' });
  for (const verdict of ['wrong', 'near-miss'] as const) {
    await repos.reviews.add({
      at: Date.now() - 1000,
      itemId: `word:${W.issho.id}`,
      answer: 'いっしょ',
      expected: 'いっしょう',
      verdict,
      durationMs: 3000,
      mode: 'typed',
    });
  }
  await rebuildKanjiReadings(repos);
  return repos;
}

function Hook({ reading }: ReadingHookSlotProps) {
  return <p>hook for {reading}</p>;
}

// The fixture's words were added in NOW's week; "this week" must be that week, whatever today is.
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('KanjiScreen detail', () => {
  it('shows the hero, readings with dots, and how well each is read', async () => {
    render(await seiRepos(), '/kanji/生', { readingHook: Hook });
    expect(await screen.findByRole('heading', { name: '生' })).toBeTruthy();
    expect(screen.getByText('life, birth')).toBeTruthy();
    expect(screen.getByText('3 readings · in 4 of your words')).toBeTruthy();
    expect(screen.getByText('Known since Minna 第1課')).toBeTruthy();
    const jisho = screen.getByRole('link', { name: 'Open on Jisho (new tab)' });
    expect(jisho.getAttribute('href')).toBe('https://jisho.org/search/%E7%94%9F%20%23kanji');
    expect(jisho.getAttribute('target')).toBe('_blank');
    expect(
      screen.getByRole('link', { name: 'Open on Wiktionary (new tab)' }).getAttribute('href'),
    ).toBe('https://en.wiktionary.org/wiki/%E7%94%9F');
    const rows = within(screen.getByRole('region', { name: 'How well you read it' })).getAllByRole(
      'listitem',
    );
    expect(rows.map((row) => row.querySelector('span')?.textContent)).toEqual([
      'セイ',
      'い・きる',
      'ショウ',
    ]);
    expect(
      within(rows[0] as HTMLElement)
        .getByRole('img')
        .getAttribute('aria-label'),
    ).toBe('Reads it in new words');
    expect(rows[0]?.textContent).toContain('学生 · 先生');
    expect(
      within(rows[2] as HTMLElement)
        .getByRole('img')
        .getAttribute('aria-label'),
    ).toBe('Recognized, often misread');
    expect(rows[2]?.textContent).toContain('一生 · new this week');
    expect(screen.getByText('hook for ショウ')).toBeTruthy();
  });

  it('shows the sound family and practises the often-misread reading', async () => {
    render(await seiRepos(), '/kanji/生');
    const family = await screen.findByRole('region', { name: 'Same part, same sound' });
    expect(family.textContent).toContain('セイ');
    expect(within(family).getByRole('link', { name: /星/ }).textContent).toBe('星guess it');
    await userEvent.click(screen.getByRole('button', { name: 'Read 5 sentences with ショウ' }));
    expect(await screen.findByText('read page')).toBeTruthy();
  });

  it('says when a kanji is not in the dictionary, or not in your words', async () => {
    const repos = await readingRepos();
    render(repos, '/kanji/鬱');
    expect(await screen.findByText(/is not in the dictionary/)).toBeTruthy();
  });
});

describe('KanjiScreen index', () => {
  it('suggests words from romaji and shows the kanji of the picked word (I1)', async () => {
    const repos = await readingRepos();
    render(repos, '/kanji');
    const input = await screen.findByLabelText('Look up a kanji or a reading');
    await userEvent.type(input, 'gakuse');
    expect((input as HTMLInputElement).value).toBe('がくせ');
    await userEvent.click(await screen.findByRole('button', { name: '学生' }));
    expect(screen.getByText(/student/)).toBeTruthy();
    expect(screen.getByRole('link', { name: '学' }).getAttribute('href')).toBe('/kanji/%E5%AD%A6');
  });

  it('opens a typed kanji on Enter and lists this week’s kanji', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.eki, 1]]);
    render(repos, '/kanji');
    expect(await screen.findByRole('link', { name: '駅' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Draw a kanji/ }).getAttribute('href')).toBe(
      '/handwrite',
    );
    await userEvent.type(screen.getByLabelText('Look up a kanji or a reading'), '生{Enter}');
    expect(await screen.findByRole('heading', { name: '生' })).toBeTruthy();
    expect(screen.getByText('Not in your words yet')).toBeTruthy();
    expect(screen.getByText(/Dictionary readings:/).textContent).toContain(
      'セイ · ショウ · い・きる',
    );
  });
});

describe('KanjiScreen in French and Spanish (N7b, N9)', () => {
  it('shows the kanji page in French', async () => {
    render(await seiRepos(), '/kanji/生', {}, 'fr');
    expect(await screen.findByText('3 lectures · dans 4 de vos mots')).toBeTruthy();
    expect(screen.getByText('Connu depuis Minna 第1課')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Votre lecture' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lire 5 phrases avec ショウ' })).toBeTruthy();
  });

  it('shows the index in Spanish and marks an English gloss', async () => {
    const repos = await readingRepos();
    render(repos, '/kanji', {}, 'es');
    expect(await screen.findByRole('region', { name: 'Esta semana' })).toBeTruthy();
    const input = screen.getByLabelText('Buscar un kanji o una lectura');
    await userEvent.type(input, 'gakuse');
    await userEvent.click(await screen.findByRole('button', { name: '学生' }));
    const line = screen.getByText(/student/);
    expect(line.textContent).toContain('(en)');
    expect(within(line).getByRole('note', { name: 'en inglés' })).toBeTruthy();
  });

  it('shows a Spanish gloss from the language pack, unmarked', async () => {
    const base = await readingRepos();
    const prefix = base.dictionary.wordsByReadingPrefix.bind(base.dictionary);
    const withSpanish = async (kana: string, limit: number) =>
      (await prefix(kana, limit)).map((w) => ({ ...w, glossesByLang: { es: ['estudiante'] } }));
    const repos = {
      ...base,
      dictionary: { ...base.dictionary, wordsByReadingPrefix: withSpanish },
    };
    render(repos, '/kanji', {}, 'es');
    await userEvent.type(await screen.findByLabelText('Buscar un kanji o una lectura'), 'gakuse');
    await userEvent.click(await screen.findByRole('button', { name: '学生' }));
    expect(screen.getByText(/estudiante/).textContent).not.toContain('(en)');
  });

  describe('the tutor on a kanji page', () => {
    it('sits under the hero and floats over the page, opening on the kanji and its words', async () => {
      const tutorSheet = ({ topic }: TutorSheetSlotProps) => <p>tutor: {topic.sentence.text}</p>;
      render(await seiRepos(), '/kanji/生', { tutorSheet });
      await userEvent.click(
        await screen.findByRole('button', { name: /^Talk it through with the tutor/ }),
      );
      expect(screen.getByText(/^tutor: 生、/).textContent).toContain('学生');
      expect(screen.getByRole('button', { name: 'Ask the tutor about 生' })).toBeTruthy();
    });
  });
});
