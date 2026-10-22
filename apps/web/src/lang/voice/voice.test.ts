import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FakeMediaRecorder,
  FakeRecognition,
  installMedia,
  installRecognition,
} from '../../test/voice-fakes.ts';
import {
  canDictate,
  canRecord,
  dictationErrorMessage,
  kanaDiff,
  micErrorMessage,
  pickMime,
  rmsLevel,
  startDictation,
  startRecording,
} from './index.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

function recognition(): FakeRecognition {
  if (!FakeRecognition.last) throw new Error('no recognition started');
  return FakeRecognition.last;
}

describe('dictation', () => {
  it('is unavailable without speech recognition', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    expect(canDictate()).toBe(false);
    expect(() => startDictation({ onFinal: () => undefined })).toThrow(/not supported/);
  });

  it('listens in ja-JP with interim results and delivers the final text once', () => {
    installRecognition();
    expect(canDictate()).toBe(true);
    const onInterim = vi.fn();
    const onFinal = vi.fn();
    const onEnd = vi.fn();
    startDictation({ onInterim, onFinal, onEnd });
    const rec = recognition();
    expect(rec).toMatchObject({ lang: 'ja-JP', interimResults: true, continuous: false });
    rec.hear('この', false);
    rec.hear('この漢字は', true);
    expect(onInterim).toHaveBeenLastCalledWith('この漢字は');
    expect(onFinal).not.toHaveBeenCalled();
    rec.end();
    expect(onFinal).toHaveBeenCalledExactlyOnceWith('この漢字は');
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('keeps interim text when stopped early, and stays quiet when nothing was heard', () => {
    installRecognition();
    const onFinal = vi.fn();
    const dictation = startDictation({ onFinal });
    recognition().hear('先生', false);
    dictation.stop();
    expect(onFinal).toHaveBeenCalledWith('先生');
    const silent = vi.fn();
    startDictation({ onFinal: silent }).stop();
    expect(silent).not.toHaveBeenCalled();
  });

  it('maps errors to plain messages and ignores aborts', () => {
    installRecognition();
    const onError = vi.fn();
    const onFinal = vi.fn();
    startDictation({ onFinal, onError });
    recognition().hear('あ', false);
    recognition().fail('not-allowed');
    recognition().end();
    expect(onError).toHaveBeenCalledWith(
      expect.stringMatching(/Microphone access is blocked/),
      'not-allowed',
    );
    expect(onFinal).not.toHaveBeenCalled();
    expect(dictationErrorMessage('aborted')).toBeUndefined();
    expect(dictationErrorMessage('no-speech')).toMatch(/Nothing was heard/);
    expect(dictationErrorMessage('weird')).toBe('Dictation stopped. Try again.');
  });

  it('reports a recognition that refuses to start', () => {
    installRecognition();
    vi.spyOn(FakeRecognition.prototype, 'start').mockImplementation(() => {
      throw new DOMException('busy', 'InvalidStateError');
    });
    const onError = vi.fn();
    const onEnd = vi.fn();
    startDictation({ onFinal: () => undefined, onError, onEnd });
    expect(onError).toHaveBeenCalledWith('Dictation could not start. Try again.', 'start-failed');
    expect(onEnd).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
});

describe('recording', () => {
  it('is unavailable without MediaRecorder', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    expect(canRecord()).toBe(false);
    await expect(startRecording()).rejects.toThrow('This browser cannot record audio.');
  });

  it('picks a supported format', () => {
    installMedia();
    FakeMediaRecorder.supported = ['audio/mp4'];
    expect(pickMime()).toBe('audio/mp4');
    FakeMediaRecorder.supported = [];
    expect(pickMime()).toBeUndefined();
  });

  it('records base64 audio with its duration and releases the microphone', async () => {
    const media = installMedia();
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    expect(canRecord()).toBe(true);
    const recorder = await startRecording();
    expect(media.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(FakeMediaRecorder.last?.mimeType).toBe('audio/webm;codecs=opus');
    expect(recorder.level()).toBeGreaterThan(0.5);
    now.mockReturnValue(2400);
    const recording = await recorder.stop();
    expect(recording).toEqual({ mime: 'audio/webm', data: btoa('voice'), durationMs: 1400 });
    expect(media.track.stop).toHaveBeenCalled();
    await expect(recorder.stop()).resolves.toBe(recording);
    now.mockRestore();
  });

  it('rejects an empty recording', async () => {
    installMedia();
    FakeMediaRecorder.audio = '';
    const recorder = await startRecording();
    await expect(recorder.stop()).rejects.toThrow(/Nothing was recorded/);
    FakeMediaRecorder.audio = 'voice';
  });

  it('cancels without a recording and releases the microphone', async () => {
    const media = installMedia();
    const recorder = await startRecording();
    recorder.cancel();
    expect(FakeMediaRecorder.last?.state).toBe('inactive');
    expect(media.track.stop).toHaveBeenCalled();
  });

  it('turns a refused microphone into a plain message', async () => {
    installMedia({ deny: 'NotAllowedError' });
    await expect(startRecording()).rejects.toThrow(/Microphone access is blocked/);
    expect(micErrorMessage(new DOMException('x', 'NotFoundError'))).toBe(
      'No microphone was found.',
    );
    expect(micErrorMessage('odd')).toMatch(/could not start/);
  });

  it('keeps a still level when Web Audio is missing', async () => {
    installMedia();
    vi.stubGlobal('AudioContext', undefined);
    const recorder = await startRecording();
    expect(recorder.level()).toBe(0);
    recorder.cancel();
  });

  it('measures loudness from time-domain samples', () => {
    expect(rmsLevel(new Uint8Array([128, 128]))).toBe(0);
    expect(rmsLevel(new Uint8Array([])).valueOf()).toBe(0);
    expect(rmsLevel(new Uint8Array([144, 112]))).toBeCloseTo(0.5);
    expect(rmsLevel(new Uint8Array([255, 0]))).toBe(1);
  });
});

describe('kanaDiff', () => {
  it.each([
    [
      'しょうかい',
      'しょかい',
      [
        { kind: 'same', text: 'しょ' },
        { kind: 'missing', text: 'う' },
        { kind: 'same', text: 'かい' },
      ],
    ],
    [
      'がっこう',
      'がこう',
      [
        { kind: 'same', text: 'が' },
        { kind: 'missing', text: 'っ' },
        { kind: 'same', text: 'こう' },
      ],
    ],
    [
      'てがみ',
      'てかみ',
      [
        { kind: 'same', text: 'て' },
        { kind: 'missing', text: 'が' },
        { kind: 'extra', text: 'か' },
        { kind: 'same', text: 'み' },
      ],
    ],
    [
      'おばさん',
      'おばあさん',
      [
        { kind: 'same', text: 'おば' },
        { kind: 'extra', text: 'あ' },
        { kind: 'same', text: 'さん' },
      ],
    ],
    ['ほん', 'ほん', [{ kind: 'same', text: 'ほん' }]],
    ['ほん', '', [{ kind: 'missing', text: 'ほん' }]],
  ])('%s said as %s', (expected, said, segments) => {
    expect(kanaDiff(expected, said)).toEqual(segments);
  });
});
