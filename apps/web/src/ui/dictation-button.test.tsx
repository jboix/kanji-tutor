import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeRecognition, installRecognition } from '../test/voice-fakes.ts';
import { DictationButton } from './dictation-button.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

function recognition(): FakeRecognition {
  if (!FakeRecognition.last) throw new Error('not listening');
  return FakeRecognition.last;
}

describe('DictationButton', () => {
  it('renders nothing without speech recognition', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const { container } = render(<DictationButton onText={() => undefined} />);
    expect(container.innerHTML).toBe('');
  });

  it('listens on press and sends the final text when recognition ends by itself', async () => {
    installRecognition();
    const onText = vi.fn();
    const onInterim = vi.fn();
    render(<DictationButton onText={onText} onInterim={onInterim} label="Ask by voice" />);
    const mic = screen.getByRole('button', { name: 'Ask by voice' });
    expect(mic.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(mic);
    expect(mic.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('status').textContent).toMatch('Listening');
    act(() => recognition().hear('これは', false));
    expect(onInterim).toHaveBeenCalledWith('これは');
    act(() => recognition().hear('これは何ですか', true));
    act(() => recognition().end());
    expect(onText).toHaveBeenCalledExactlyOnceWith('これは何ですか');
    expect(mic.getAttribute('aria-pressed')).toBe('false');
  });

  it('stops on a second press', async () => {
    installRecognition();
    const onText = vi.fn();
    render(<DictationButton onText={onText} />);
    const mic = screen.getByRole('button', { name: 'Dictate' });
    await userEvent.click(mic);
    act(() => recognition().hear('先生', false));
    await userEvent.click(mic);
    expect(onText).toHaveBeenCalledWith('先生');
    expect(mic.getAttribute('aria-pressed')).toBe('false');
  });

  it('reports errors in plain words', async () => {
    installRecognition();
    const onError = vi.fn();
    render(<DictationButton onText={() => undefined} onError={onError} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dictate' }));
    act(() => {
      recognition().fail('not-allowed');
      recognition().end();
    });
    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/Microphone access is blocked/));
    expect(screen.getByRole('status').textContent).toMatch(/Microphone access is blocked/);
  });

  it('stops listening when it unmounts', async () => {
    installRecognition();
    const { unmount } = render(<DictationButton onText={() => undefined} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dictate' }));
    unmount();
    expect(recognition().started).toBe(false);
  });
});
