import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithServices } from '../test/render.tsx';
import { PlayerBar, useLinePlayer } from './line-player.tsx';

const speech = vi.hoisted(() => ({ spoken: [] as string[], ends: [] as (() => void)[] }));
vi.mock('../lang/speech.ts', () => ({
  canSpeak: () => true,
  speak: (text: string) => {
    speech.spoken.push(text);
    return new Promise<void>((resolve) => speech.ends.push(resolve));
  },
  stopSpeaking: () => {
    for (const end of speech.ends.splice(0)) end();
  },
}));

const LINES = ['一つ目。', '二つ目。', '三つ目。'];

function Player() {
  const player = useLinePlayer(LINES);
  return (
    <>
      <p>{`at ${player.current ?? '-'}`}</p>
      <PlayerBar
        player={player}
        total={LINES.length}
        translated={false}
        onTranslate={() => undefined}
      />
    </>
  );
}

/** Ends the line being spoken, as the voice reaching its end would. */
const finish = () => act(async () => speech.ends.shift()?.());

describe('the line player', () => {
  it('plays line by line, pauses where it is, and plays that line again', async () => {
    speech.spoken = [];
    renderWithServices(<Player />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Play the conversation from this line' }),
    );
    expect(screen.getByText('at 0')).toBeTruthy();
    await finish();
    expect(screen.getByText('at 1')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('at 1')).toBeTruthy();
    await userEvent.click(
      screen.getByRole('button', { name: 'Play the conversation from this line' }),
    );
    expect(speech.spoken).toEqual(['一つ目。', '二つ目。', '二つ目。']);
  });

  it('moves to a line on the track, and plays from there when playing', async () => {
    speech.spoken = [];
    renderWithServices(<Player />);
    const track = screen.getByRole('slider', { name: 'Line of the conversation' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Play the conversation from this line' }),
    );
    fireEvent.change(track, { target: { value: '2' } });
    expect(screen.getByText('at 2')).toBeTruthy();
    expect(speech.spoken.at(-1)).toBe('三つ目。');
    expect(track.getAttribute('aria-valuetext')).toBe('Line 3 of 3');
  });
});
