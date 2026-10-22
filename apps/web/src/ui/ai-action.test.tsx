import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient } from '../ai/types.ts';
import { fakeAi, fakeServices, renderWithServices } from '../test/render.tsx';
import { AiAction, AiAskInput } from './ai-action.tsx';
import { READ_SENTENCE } from './dev-gallery-data.ts';
import { RuledSentence } from './ruled-sentence.tsx';
import { TutorMark } from './tutor-mark.tsx';

describe('AiAction (A18)', () => {
  it('carries the seal, "uses AI" in its name and a visible "1 request"', async () => {
    const run = vi.fn();
    const ai = fakeAi({});
    renderWithServices(<AiAction label="Ask the tutor why" run={run} />, {
      services: fakeServices({ ai }),
    });
    const button = screen.getByRole('button', { name: 'Ask the tutor why, 1 request, uses AI' });
    expect(button.textContent).toBe('Ask the tutor why 1 request');
    expect(button.querySelector('[lang="ja"]')?.getAttribute('data-seal')).toBe('解');
    await userEvent.click(button);
    expect(run.mock.calls[0]?.[0]).toBe(ai);
  });

  it('says "Saved" when the cache has the answer, and no request is named', async () => {
    const peek = vi.fn(async (client: AiClient) =>
      client.peek('explainWord', { surface: '間' } as never),
    );
    const ai = fakeAi({ peek: vi.fn(async () => ({ nuance: 'cached' })) as AiClient['peek'] });
    renderWithServices(<AiAction label="Ask about it" run={vi.fn()} peek={peek} />, {
      services: fakeServices({ ai }),
    });
    const saved = await screen.findByRole('button', {
      name: 'Ask about it, saved, uses AI: no request',
    });
    expect(saved.textContent).toContain('Saved');
    expect(saved.getAttribute('data-ai-action')).toBe('saved');
  });

  it('runs by itself only with `auto`, and never while disabled', async () => {
    const services = fakeServices({ ai: fakeAi({}) });
    const off = vi.fn();
    renderWithServices(<AiAction label="Why" run={off} auto disabled />, { services });
    const on = vi.fn();
    renderWithServices(<AiAction label="How" run={on} auto />, { services });
    await waitFor(() => expect(on).toHaveBeenCalledTimes(1));
    expect(off).not.toHaveBeenCalled();
  });
});

describe('AiAskInput (A4, A18)', () => {
  it('sends one question with the client, from Enter or the seal button', async () => {
    const onAsk = vi.fn();
    const ai = fakeAi({});
    renderWithServices(
      <AiAskInput label="Ask about 間" onAsk={onAsk} dictateLabel="Ask by voice" />,
      {
        services: fakeServices({ ai }),
      },
    );
    expect(screen.getByText('Uses AI · 1 request per question')).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Ask about 間'), 'Why?{Enter}');
    expect(onAsk.mock.lastCall?.[0]).toBe(ai);
    expect(onAsk.mock.lastCall?.[1]).toBe('Why?');
    await userEvent.type(screen.getByLabelText('Ask about 間'), 'How?');
    await userEvent.click(screen.getByRole('button', { name: 'Ask, 1 request, uses AI' }));
    expect(onAsk.mock.lastCall?.[1]).toBe('How?');
  });
});

describe('TutorMark (A18)', () => {
  it('marks a sentence the tutor wrote, wherever RuledSentence shows it', () => {
    render(<RuledSentence sentence={{ ...READ_SENTENCE, source: 'ai' }} />);
    expect(screen.getByText('Written by the tutor')).toBeTruthy();
  });

  it('marks a line the tutor read from a photo', () => {
    render(<TutorMark of={{ source: 'capture', aiRead: true }} />);
    expect(screen.getByText('Read from a photo by the tutor')).toBeTruthy();
  });

  it('leaves pack, unit, typed and composed sentences unmarked', () => {
    for (const source of ['tatoeba', 'unit', 'capture', 'compose']) {
      const { container, unmount } = render(
        <RuledSentence sentence={{ ...READ_SENTENCE, source }} />,
      );
      expect(container.querySelector('[data-tutor-mark]')).toBeNull();
      unmount();
    }
  });
});
