import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Dialogue } from '../domain/dialogues/index.ts';
import { renderWithServices } from '../test/render.tsx';
import { DialogueLines, PlayDialogue } from './dialogue.tsx';

const speech = vi.hoisted(() => ({ ends: [] as (() => void)[], stopped: 0 }));
vi.mock('../lang/speech.ts', () => ({
  canSpeak: () => true,
  speak: () => new Promise<void>((resolve) => speech.ends.push(resolve)),
  stopSpeaking: () => {
    speech.stopped += 1;
    for (const end of speech.ends.splice(0)) end();
  },
}));

const line = (by: 0 | 1, ja: string) => ({ by, ja, tr: { en: ja, fr: ja, es: ja } });

function dialogue(speakers: [string, string]): Dialogue {
  return {
    id: 'test',
    setting: 'friends',
    register: 'plain',
    speakers,
    lines: [line(0, 'おはよう。'), line(1, 'おはよう！')],
    blank: {
      line: 1,
      distractors: ['おはよ', 'おはようございます', 'こんにちは'],
      why: { en: '', fr: '', es: '' },
    },
  };
}

describe('DialogueLines', () => {
  it("shows a cast member's portrait and a guest's initial, each named for screen readers", () => {
    const { container } = renderWithServices(
      <DialogueLines dialogue={dialogue(['ユキ', 'リン'])} />,
    );
    const faces = [...container.querySelectorAll<HTMLElement>('[data-who]')];
    expect(faces.map((face) => face.dataset.who)).toEqual(['yuki']);
    expect(container.textContent).toContain('リ');
    expect(screen.getByText('ユキ:')).toBeTruthy();
    expect(screen.getByText('リン:')).toBeTruthy();
  });

  it('plays the lines and stops at once on Stop', async () => {
    renderWithServices(<PlayDialogue lines={['おはよう。', 'おはよう！']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Play the conversation' }));
    expect(speech.ends).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Stop the conversation' }));
    expect(speech.stopped).toBeGreaterThan(0);
    expect(await screen.findByRole('button', { name: 'Play the conversation' })).toBeTruthy();
    expect(speech.ends).toHaveLength(0);
  });
});
