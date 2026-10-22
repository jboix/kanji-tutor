/**
 * Records a spoken reading answer for `transcribeReading` (I2). Browser speech recognition is
 * not used here, because it auto-corrects しょかい to 紹介 and hides the mistake (SPEC "Voice").
 */
import { createLevelMeter } from './level.ts';
import type { Recorder, Recording } from './types.ts';

/** In order of preference: Chrome and Firefox record Opus, Safari records AAC in MP4. */
const MIMES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];

/** True when MediaRecorder and getUserMedia exist. */
export function canRecord(): boolean {
  return (
    typeof globalThis.MediaRecorder !== 'undefined' &&
    typeof globalThis.navigator?.mediaDevices?.getUserMedia === 'function'
  );
}

/** The first recording format the browser supports, or undefined to let it choose. */
export function pickMime(): string | undefined {
  if (typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return MIMES.find((mime) => MediaRecorder.isTypeSupported(mime));
}

const MIC_ERRORS: Record<string, string> = {
  NotAllowedError:
    'Microphone access is blocked. Allow it in the browser settings to answer aloud.',
  SecurityError: 'Microphone access is blocked. Allow it in the browser settings to answer aloud.',
  NotFoundError: 'No microphone was found.',
  NotReadableError: 'The microphone is busy in another app.',
};

/** A plain message for a getUserMedia failure. */
export function micErrorMessage(error: unknown): string {
  const name = error instanceof Error || error instanceof DOMException ? error.name : '';
  return MIC_ERRORS[name] ?? 'The microphone could not start. Try again.';
}

/** "audio/webm;codecs=opus" → "audio/webm", the form the transcription API expects. */
function baseMime(mime: string): string {
  return mime.split(';')[0]?.trim() || 'audio/webm';
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function stopped(recorder: MediaRecorder, chunks: Blob[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    recorder.onerror = () => reject(new Error('Recording failed. Try again.'));
    if (recorder.state === 'inactive') resolve(new Blob(chunks, { type: recorder.mimeType }));
    else recorder.stop();
  });
}

async function finish(recorder: MediaRecorder, chunks: Blob[], durationMs: number) {
  const blob = await stopped(recorder, chunks);
  if (blob.size === 0) throw new Error('Nothing was recorded. Hold the button while you speak.');
  const mime = baseMime(blob.type || recorder.mimeType);
  return { mime, data: await toBase64(blob), durationMs } satisfies Recording;
}

function record(stream: MediaStream): Recorder {
  const mime = pickMime();
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const meter = createLevelMeter(stream);
  const release = () => {
    meter.close();
    for (const track of stream.getTracks()) track.stop();
  };
  const startedAt = Date.now();
  let done: Promise<Recording> | undefined;
  recorder.start();
  return {
    level: () => meter.level(),
    stop: () => {
      done ??= finish(recorder, chunks, Date.now() - startedAt).finally(release);
      return done;
    },
    cancel: () => {
      recorder.ondataavailable = null;
      if (recorder.state !== 'inactive') recorder.stop();
      release();
    },
  };
}

/** Asks for the microphone and starts recording. Rejects with a plain message on failure. */
export async function startRecording(): Promise<Recorder> {
  if (!canRecord()) throw new Error('This browser cannot record audio.');
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    throw new Error(micErrorMessage(error));
  }
  try {
    return record(stream);
  } catch {
    for (const track of stream.getTracks()) track.stop();
    throw new Error('This browser cannot record audio.');
  }
}
