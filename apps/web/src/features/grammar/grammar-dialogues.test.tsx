import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { grammarRepos } from '../../test/grammar-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { entryById, type Point } from './grammar-data.ts';
import { GrammarIntro } from './grammar-intro.tsx';
import { GrammarPage } from './grammar-page.tsx';

const point = (id: string) => entryById(id) as Point;

describe('grammar dialogues beside the intro card and the page', () => {
  it('add one conversation under the introduction, its lines tapped for their translation', async () => {
    const onDone = vi.fn();
    const services = fakeServices({ repos: await grammarRepos() });
    renderWithServices(<GrammarIntro grammarId="koto-ni-naru" onDone={onDone} />, { services });
    const card = screen.getByRole('region', { name: 'New grammar: 〜ことになる' });
    expect(within(card).getByText('it has been decided that')).toBeTruthy();
    const talk = await within(card).findByRole('region', { name: 'In a conversation' });
    const lines = within(talk).getByRole('list', { name: 'A conversation between リン and 田中' });
    expect(lines.querySelector('[data-focus="focus"]')?.textContent).toBe('ことになった');
    const [, line] = within(lines).getAllByRole('button');
    if (!line) throw new Error('no line');
    expect(line.getAttribute('aria-expanded')).toBe('false');
    expect(line.textContent).toContain('田中:');
    const translation = within(talk).getByText(/work at the Osaka shop/);
    expect(line.getAttribute('aria-controls')).toBe(translation.id);
    expect(translation.hidden).toBe(true);
    await userEvent.click(line);
    expect(line.getAttribute('aria-expanded')).toBe('true');
    expect(translation.hidden).toBe(false);
    await userEvent.click(line);
    expect(translation.hidden).toBe(true);
    await userEvent.click(within(card).getByRole('button', { name: 'Got it' }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('add nothing to a point without dialogues, nor to the compact card', async () => {
    const services = fakeServices({ repos: await grammarRepos() });
    renderWithServices(
      <>
        <GrammarIntro grammarId="te-mo-ii" onDone={() => undefined} />
        <GrammarIntro grammarId="koto-ni-naru" onDone={() => undefined} compact />
      </>,
      { services },
    );
    expect(await screen.findByText('“May I take a photo?”')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'In a conversation' })).toBeNull();
  });

  it('list every dialogue on the page, with its register and a link to compare', async () => {
    const services = fakeServices({ repos: await grammarRepos() });
    renderWithServices(<GrammarPage entry={point('koto-ni-naru')} />, { services });
    const section = await screen.findByRole('region', { name: 'In conversation' });
    expect(within(section).getAllByRole('article')).toHaveLength(3);
    expect(within(section).getAllByText('At work · polite')).toHaveLength(2);
    expect(within(section).getByText('At school · plain')).toBeTruthy();
    const compare = within(section).getByRole('link', { name: 'Compare with 〜ことにする' });
    expect(compare.getAttribute('href')).toBe('/grammar/koto-ni-suru');
    expect(screen.getByRole('region', { name: "Where you'll see it" })).toBeTruthy();
  });

  it('show the lines in French with French translations', async () => {
    const services = fakeServices({ repos: await grammarRepos() });
    renderWithServices(<GrammarPage entry={point('sou-look')} />, { services, language: 'fr' });
    const section = await screen.findByRole('region', { name: 'En conversation' });
    expect(within(section).getByText('Entre amis · familier')).toBeTruthy();
    const [line] = within(section).getAllByRole('button', { expanded: false });
    if (!line) throw new Error('no line');
    await userEvent.click(line);
    expect(
      await within(section).findByText(
        'Regarde, le ciel est très sombre. On dirait qu’il va pleuvoir.',
      ),
    ).toBeTruthy();
  });
});
