import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient, KanjiStory } from '../../ai/types.ts';
import { readingRepos } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { KanjiStoryCard } from './kanji-story.tsx';

const STORY: KanjiStory = {
  line: 'Someone on the move 彳 waits at the temple 寺.',
  story: { text: '駅で友達を待ちました。', translation: 'I waited for a friend at the station.' },
  readings: [
    { surface: '駅', reading: 'えき', verified: true },
    { surface: '友達', reading: 'ともだち', verified: true },
    { surface: '待ちました', reading: 'まちました', verified: true },
  ],
};

async function render(kanjiStory: AiClient['kanjiStory']) {
  const services = fakeServices({
    repos: await readingRepos(),
    ai: fakeAi({ kanjiStory, peek: async () => undefined }),
  });
  return renderWithServices(<KanjiStoryCard char="待" />, { services });
}

const answer = (value: KanjiStory) => ({ ok: true as const, cached: false, value });

describe('a kanji story', () => {
  it('shows the parts as a sum, and asks the tutor only on request', async () => {
    const kanjiStory = vi.fn<AiClient['kanjiStory']>(async () => answer(STORY));
    await render(kanjiStory);
    const section = await screen.findByRole('region', { name: 'Its story' });
    expect(section.textContent).toContain('彳');
    expect(section.textContent).toContain('寺');
    expect(within(section).getByText('=')).toBeTruthy();
    expect(kanjiStory).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /^Ask the tutor for its story, / }));
    const note = await screen.findByRole('note', { name: 'Its story, from the tutor' });
    expect(note.textContent).toContain('A way to remember it');
    expect(note.textContent).toContain('Readings checked in the dictionary');
    expect(note.querySelector('rt')?.textContent).toBe('えき');
    expect(kanjiStory.mock.calls[0]?.[0]).toMatchObject({
      kanji: { char: '待', parts: [{ char: '彳' }, { char: '寺' }] },
      take: 0,
    });
  });

  it('shows the translation on demand, and asks for another story as a new take', async () => {
    const kanjiStory = vi.fn<AiClient['kanjiStory']>(async () => answer(STORY));
    await render(kanjiStory);
    await userEvent.click(
      await screen.findByRole('button', { name: /^Ask the tutor for its story, / }),
    );
    await screen.findByRole('note', { name: 'Its story, from the tutor' });
    expect(screen.queryByText(STORY.story.translation)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Translation' }));
    expect(screen.getByText(STORY.story.translation)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /^Another story, / }));
    await screen.findByRole('note', { name: 'Its story, from the tutor' });
    expect(kanjiStory.mock.calls.at(-1)?.[0]).toMatchObject({ take: 1 });
  });

  it('marks a reading the dictionary did not confirm, and gives it no furigana', async () => {
    const unsure: KanjiStory = {
      ...STORY,
      readings: [{ surface: '駅', reading: 'えけ', verified: false }],
    };
    await render(async () => answer(unsure));
    await userEvent.click(
      await screen.findByRole('button', { name: /^Ask the tutor for its story, / }),
    );
    const note = await screen.findByRole('note', { name: 'Its story, from the tutor' });
    expect(note.textContent).toContain('Not confirmed by the dictionary');
    expect(note.querySelector('rt')).toBeNull();
  });
});
