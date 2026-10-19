import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import { createLang } from '../../lang/index.ts';
import { readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { ImportScreen } from './import-screen.tsx';

function render(repos: Repos) {
  const lang = createLang({
    dictionary: repos.dictionary,
    tokenizer: { tokenize: async () => [] },
  });
  renderWithServices(<ImportScreen />, {
    services: fakeServices({ repos, lang }),
    path: '/import',
  });
}

describe('ImportScreen', () => {
  it('imports the N5 list and reports the count', async () => {
    const repos = await readingRepos();
    render(repos);
    expect(screen.getByRole('checkbox', { name: 'JLPT N5 (approximate list)' })).toHaveProperty(
      'checked',
      true,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect((await screen.findByRole('status')).textContent).toContain('11 words marked as known.');
    expect((await repos.items.get(`word:${W.eki.id}`))?.level).toBe(3);
    expect(screen.getByRole('link', { name: /Back to Home/ }).getAttribute('href')).toBe('/');
  });

  it('applies the N5 list again from the same page without duplicating (P2)', async () => {
    const repos = await readingRepos();
    render(repos);
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect((await screen.findByRole('status')).textContent).toContain('11 words marked');
    await userEvent.click(screen.getByRole('button', { name: 'Mark more' }));
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect((await screen.findByRole('status')).textContent).toContain(
      '11 words were already known.',
    );
    expect(await repos.items.count()).toBe(11);
    expect((await repos.settings.get()).learnerLevel).toBe(4);
  });

  it('imports a pasted list with romaji and a lesson tag, listing lines not found', async () => {
    const repos = await readingRepos();
    render(repos);
    await userEvent.click(screen.getByRole('checkbox', { name: 'JLPT N5 (approximate list)' }));
    expect(screen.getByRole('button', { name: 'Import' })).toHaveProperty('disabled', true);
    await userEvent.type(
      screen.getByLabelText('One word per line, in kanji or kana'),
      'shoukai{Enter}一生{Enter}ふぉお',
    );
    await userEvent.type(
      screen.getByLabelText('Lesson tag for these words (optional)'),
      'Tobira 第1課',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    const status = await screen.findByRole('status');
    expect(status.querySelector('p')?.textContent).toBe(
      '2 words marked as known; 1 line not found: ふぉお.',
    );
    expect((await repos.items.get(`word:${W.issho.id}`))?.source.lesson).toBe('Tobira 第1課');
  });

  it('adds a pasted list as new words from class, tagged with the current lesson', async () => {
    const repos = await readingRepos({ currentLesson: 'Tobira 第4課' });
    render(repos);
    await userEvent.click(screen.getByRole('checkbox', { name: 'JLPT N5 (approximate list)' }));
    await userEvent.type(
      screen.getByLabelText('One word per line, in kanji or kana'),
      '学生{Enter}本',
    );
    expect(screen.getByRole('radiogroup', { name: 'These words are' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'I already know these' })).toHaveProperty(
      'checked',
      true,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'New words from class' }));
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    const status = await screen.findByRole('status');
    expect(status.querySelector('p')?.textContent).toBe('2 words added as new to Tobira 第4課.');
    expect(await repos.items.get(`word:${W.gakusei.id}`)).toMatchObject({
      level: 0,
      source: { kind: 'textbook', lesson: 'Tobira 第4課' },
    });
  });

  it('marks lists known and adds the pasted list as new in one go', async () => {
    const repos = await readingRepos();
    render(repos);
    await userEvent.type(screen.getByLabelText('One word per line, in kanji or kana'), '紹介');
    await userEvent.click(screen.getByRole('radio', { name: 'New words from class' }));
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    const status = await screen.findByRole('status');
    expect(status.querySelector('p')?.textContent).toBe(
      '11 words marked as known; 1 word added as new.',
    );
    expect((await repos.items.get(`word:${W.shoukai.id}`))?.level).toBe(0);
  });

  it('maps Minna lessons to the lists and reports words already known', async () => {
    const repos = await readingRepos();
    render(repos);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Minna no Nihongo up to lesson' }));
    const lesson = screen.getByLabelText('Last Minna lesson');
    await userEvent.clear(lesson);
    await userEvent.type(lesson, '40');
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect((await screen.findByRole('status')).textContent).toContain('14 words marked as known.');
  });

  it('says so when the import fails', async () => {
    const repos = await readingRepos();
    repos.items.putMany = async () => {
      throw new Error('quota');
    };
    render(repos);
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect((await screen.findByRole('alert')).textContent).toContain('did not finish');
  });
});
