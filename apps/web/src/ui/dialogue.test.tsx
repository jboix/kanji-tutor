import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Dialogue } from '../domain/dialogues/index.ts';
import { renderWithServices } from '../test/render.tsx';
import { DialogueLines } from './dialogue.tsx';

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
});
