import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiClient, AiErrorKind } from '../../ai/types.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import { S } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { FakeMediaRecorder, installMedia } from '../../test/voice-fakes.ts';
import { voiceSlots } from './index.ts';
import { VoiceAnswer } from './voice-answer.tsx';

const target: Target = {
  tokenIndex: 0,
  itemId: 'word:6',
  wordId: '6',
  surface: '学生',
  readings: ['がくせい'],
};
const card: SessionCard = { sentence: S.student, targets: [target], reason: 'due' };

const heard = (kana: string) =>
  vi.fn(async () => ({ ok: true as const, value: { kana }, cached: false }));
const refused = (kind: AiErrorKind) =>
  vi.fn(async () => ({ ok: false as const, error: { kind, message: kind } }));

function open(transcribeReading: AiClient['transcribeReading']) {
  const onAnswer = vi.fn();
  const onTypeInstead = vi.fn();
  const services = fakeServices({ ai: fakeAi({ transcribeReading }) });
  const view = renderWithServices(
    <VoiceAnswer card={card} target={target} onAnswer={onAnswer} onTypeInstead={onTypeInstead} />,
    { services },
  );
  const button = screen.getByRole('button', { name: /^Hold to speak, / });
  return { onAnswer, onTypeInstead, button, unmount: view.unmount };
}

/** Holds the button for `ms` of (mocked) time, then lets go. */
async function hold(button: HTMLElement, ms = 1200) {
  const user = userEvent.setup();
  const start = Date.now();
  await user.pointer({ keys: '[MouseLeft>]', target: button });
  await waitFor(() => expect(button.getAttribute('aria-pressed')).toBe('true'));
  await waitFor(() => expect(FakeMediaRecorder.last?.state).toBe('recording'));
  vi.spyOn(Date, 'now').mockReturnValue(start + ms);
  await user.pointer({ keys: '[/MouseLeft]', target: button });
}

let media: ReturnType<typeof installMedia>;

beforeEach(() => {
  media = installMedia();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('VoiceAnswer', () => {
  it('asks for the underlined word and offers typing instead, never drawing', () => {
    const { onTypeInstead } = open(heard('がくせい'));
    expect(screen.getByRole('status').textContent).toBe('Say the underlined word out loud: 学生');
    expect(screen.getByText(/transcribed as you said it, not corrected/)).toBeTruthy();
    // The recognizer reads kanji, not kana: no way to draw a reading.
    expect(screen.queryByRole('link')).toBeNull();
    screen.getByRole('button', { name: 'Type instead' }).click();
    expect(onTypeInstead).toHaveBeenCalledOnce();
  });

  it('records while held and answers with the kana as pronounced, not corrected', async () => {
    const transcribe = heard('しょかい');
    const { onAnswer, button } = open(transcribe);
    await hold(button);
    await waitFor(() => expect(onAnswer).toHaveBeenCalled());
    expect(transcribe).toHaveBeenCalledWith({ audio: { mime: 'audio/webm', data: btoa('voice') } });
    const [kana, durationMs] = onAnswer.mock.calls[0] ?? [];
    expect(kana).toBe('しょかい');
    expect(durationMs).toBeGreaterThanOrEqual(1200);
    expect(media.track.stop).toHaveBeenCalled();
  });

  it('treats a tap as a tap, not an answer', async () => {
    const transcribe = heard('しょかい');
    const { onAnswer, button } = open(transcribe);
    await hold(button, 100);
    expect(await screen.findByText(/Hold the button while you speak/)).toBeTruthy();
    expect(transcribe).not.toHaveBeenCalled();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it.each([
    ['no-key', /needs a Gemini key/],
    ['offline', /needs a connection/],
  ] as const)('without AI (%s) explains calmly and offers typing', async (kind, message) => {
    const { onAnswer, onTypeInstead, button } = open(refused(kind));
    await hold(button);
    expect(await screen.findByText(message)).toBeTruthy();
    expect(onAnswer).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Type the reading instead' }));
    expect(onTypeInstead).toHaveBeenCalledOnce();
  });

  it('does not record at all when the device is offline', async () => {
    const { getUserMedia } = media;
    vi.stubGlobal('navigator', { ...navigator, onLine: false, mediaDevices: { getUserMedia } });
    const { button } = open(heard('しょかい'));
    await userEvent.pointer({ keys: '[MouseLeft]', target: button });
    expect(await screen.findByText(/needs a connection/)).toBeTruthy();
    expect(media.getUserMedia).not.toHaveBeenCalled();
  });

  it('retries after a transcription error without offering only typing', async () => {
    const { button } = open(refused('provider'));
    await hold(button);
    expect(await screen.findByText(/did not work this time/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Type the reading instead' })).toBeNull();
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('works from the keyboard: Space starts, Space again answers', async () => {
    const transcribe = heard('がくせい');
    const { onAnswer, button } = open(transcribe);
    const user = userEvent.setup();
    button.focus();
    await user.keyboard(' ');
    await waitFor(() => expect(FakeMediaRecorder.last?.state).toBe('recording'));
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 900);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('がくせい', expect.any(Number)));
  });

  it('shows the microphone refusal in plain words', async () => {
    installMedia({ deny: 'NotAllowedError' });
    const { button } = open(heard('しょかい'));
    await userEvent.pointer({ keys: '[MouseLeft>]', target: button });
    expect(await screen.findByText(/Microphone access is blocked/)).toBeTruthy();
  });

  it('releases the microphone when it unmounts mid-recording', async () => {
    const transcribe = heard('しょかい');
    const { button, unmount } = open(transcribe);
    await userEvent.pointer({ keys: '[MouseLeft>]', target: button });
    await waitFor(() => expect(FakeMediaRecorder.last?.state).toBe('recording'));
    unmount();
    expect(media.track.stop).toHaveBeenCalled();
    expect(FakeMediaRecorder.last?.state).toBe('inactive');
    expect(transcribe).not.toHaveBeenCalled();
  });

  it('fills the slot only where the browser can record', () => {
    expect(voiceSlots().voiceAnswer).toBe(VoiceAnswer);
    vi.stubGlobal('MediaRecorder', undefined);
    expect(voiceSlots()).toEqual({});
  });
});
