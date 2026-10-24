import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canListen,
  canSpeak,
  hasJapaneseVoice,
  muteListening,
  muteSpeech,
  speak,
  stopSpeaking,
} from './speech.ts';

class FakeUtterance {
  lang = '';
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly text: string) {}
}

afterEach(() => {
  muteSpeech(false);
  muteListening(false);
  vi.unstubAllGlobals();
});

describe('speech', () => {
  it('does nothing when speech synthesis is missing', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    expect(canSpeak()).toBe(false);
    await expect(speak('本')).resolves.toBeUndefined();
  });

  it('speaks Japanese at the given rate and resolves when done', async () => {
    const spoken: FakeUtterance[] = [];
    const synth = {
      cancel: vi.fn(),
      speak: (u: FakeUtterance) => {
        spoken.push(u);
        queueMicrotask(() => u.onend?.());
      },
    };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    expect(canSpeak()).toBe(true);
    await speak('本を読む', 0.8);
    expect(synth.cancel).toHaveBeenCalledOnce();
    expect(spoken[0]).toMatchObject({ text: '本を読む', lang: 'ja-JP', rate: 0.8 });
  });

  it('resolves on a speech error too', async () => {
    vi.stubGlobal('speechSynthesis', {
      cancel: () => undefined,
      speak: (u: FakeUtterance) => queueMicrotask(() => u.onerror?.()),
    });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    await expect(speak('本')).resolves.toBeUndefined();
  });
});

describe('with sound off', () => {
  it('stays silent, stops what is playing, and offers no voice', async () => {
    const synth = { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [{ lang: 'ja-JP' }] };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    muteSpeech(true);
    expect(synth.cancel).toHaveBeenCalledOnce();
    expect(canSpeak()).toBe(false);
    await expect(speak('本')).resolves.toBeUndefined();
    expect(synth.speak).not.toHaveBeenCalled();
    await expect(hasJapaneseVoice(true)).resolves.toBe(false);
    muteSpeech(false);
    expect(canSpeak()).toBe(true);
    await expect(hasJapaneseVoice(true)).resolves.toBe(true);
  });
});

describe('with listening exercises off', () => {
  it('makes none, though a voice still speaks', async () => {
    const synth = { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [{ lang: 'ja-JP' }] };
    vi.stubGlobal('speechSynthesis', synth);
    await hasJapaneseVoice(true);
    await expect(canListen()).resolves.toBe(true);
    muteListening(true);
    await expect(canListen()).resolves.toBe(false);
    expect(canSpeak()).toBe(true);
    stopSpeaking();
    expect(synth.cancel).toHaveBeenCalledOnce();
  });
});

describe('hasJapaneseVoice', () => {
  const voice = (lang: string) => ({ lang }) as SpeechSynthesisVoice;

  it('is false without speech synthesis', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    await expect(hasJapaneseVoice(true)).resolves.toBe(false);
  });

  it('looks at the voices the device has', async () => {
    vi.stubGlobal('speechSynthesis', { getVoices: () => [voice('en-US'), voice('ja-JP')] });
    await expect(hasJapaneseVoice(true)).resolves.toBe(true);
    vi.stubGlobal('speechSynthesis', { getVoices: () => [voice('en-US')] });
    await expect(hasJapaneseVoice(true)).resolves.toBe(false);
  });

  it('waits for the voice list when it comes late, and gives up after a moment', async () => {
    let voices: SpeechSynthesisVoice[] = [];
    let changed: (() => void) | undefined;
    const synth = {
      getVoices: () => voices,
      addEventListener: (_: string, fn: () => void) => {
        changed = fn;
      },
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('speechSynthesis', synth);
    const found = hasJapaneseVoice(true, 5_000);
    voices = [voice('ja-JP')];
    changed?.();
    await expect(found).resolves.toBe(true);
    voices = [];
    await expect(hasJapaneseVoice(true, 10)).resolves.toBe(false);
  });
});
