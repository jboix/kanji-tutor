/**
 * Test doubles for the browser voice APIs (SpeechRecognition, MediaRecorder, getUserMedia,
 * AudioContext). Tests never touch a real microphone. Install with `vi.stubGlobal`-style helpers
 * and remove with `vi.unstubAllGlobals()`.
 */
import { vi } from 'vitest';

type Result = { isFinal: boolean; length: number; 0: { transcript: string } };

/** A SpeechRecognition the test drives with `hear`, `fail` and `end`. */
export class FakeRecognition {
  static last: FakeRecognition | undefined;
  lang = '';
  interimResults = false;
  continuous = true;
  maxAlternatives = 0;
  started = false;
  onresult: ((event: { resultIndex: number; results: Result[] }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  private results: Result[] = [];

  constructor() {
    FakeRecognition.last = this;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.end();
  }
  abort() {
    this.onerror?.({ error: 'aborted' });
    this.end();
  }
  /** Delivers a result; a final one replaces the pending interim one. */
  hear(transcript: string, isFinal: boolean) {
    const last = this.results.at(-1);
    if (last && !last.isFinal) this.results.pop();
    this.results.push({ isFinal, length: 1, 0: { transcript } });
    this.onresult?.({ resultIndex: this.results.length - 1, results: [...this.results] });
  }
  fail(error: string) {
    this.onerror?.({ error });
  }
  end() {
    if (!this.started) return;
    this.started = false;
    this.onend?.();
  }
}

/** Installs `FakeRecognition` as webkitSpeechRecognition (Safari's name). */
export function installRecognition() {
  FakeRecognition.last = undefined;
  vi.stubGlobal('SpeechRecognition', undefined);
  vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
}

/** A MediaRecorder that emits one chunk of `FakeMediaRecorder.audio` when stopped. */
export class FakeMediaRecorder {
  static last: FakeMediaRecorder | undefined;
  static supported = ['audio/webm;codecs=opus'];
  static audio = 'voice';
  state: 'inactive' | 'recording' = 'inactive';
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  static isTypeSupported(mime: string) {
    return FakeMediaRecorder.supported.includes(mime);
  }
  constructor(
    readonly stream: MediaStream,
    options: { mimeType?: string } = {},
  ) {
    this.mimeType = options.mimeType ?? 'audio/webm';
    FakeMediaRecorder.last = this;
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    const data = new Blob([FakeMediaRecorder.audio], { type: this.mimeType });
    queueMicrotask(() => {
      this.ondataavailable?.({ data });
      this.onstop?.();
    });
  }
}

class FakeAudioContext {
  createAnalyser() {
    return {
      fftSize: 0,
      getByteTimeDomainData: (samples: Uint8Array) => samples.fill(160),
    };
  }
  createMediaStreamSource() {
    return { connect: () => undefined };
  }
  resume = () => Promise.resolve();
  close = vi.fn(() => Promise.resolve());
}

export interface FakeMedia {
  track: { stop: ReturnType<typeof vi.fn> };
  getUserMedia: ReturnType<typeof vi.fn>;
}

/** Installs MediaRecorder, getUserMedia (granted, or rejecting with `deny`) and AudioContext. */
export function installMedia(options: { deny?: string } = {}): FakeMedia {
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] };
  const getUserMedia = vi.fn(() =>
    options.deny
      ? Promise.reject(new DOMException('denied', options.deny))
      : Promise.resolve(stream),
  );
  FakeMediaRecorder.last = undefined;
  FakeMediaRecorder.supported = ['audio/webm;codecs=opus'];
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('navigator', { ...navigator, onLine: true, mediaDevices: { getUserMedia } });
  return { track, getUserMedia };
}
