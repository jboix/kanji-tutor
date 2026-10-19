/** Browser speech recognition in ja-JP for dictating questions and sentences (I3). */
import type { Dictation, DictationHandlers } from './types.ts';

interface Alternative {
  readonly transcript: string;
}
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: Alternative | undefined;
}
interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: { readonly length: number; readonly [index: number]: RecognitionResult };
}
interface RecognitionErrorEvent {
  readonly error: string;
}

/** The part of SpeechRecognition used here (Chrome, Edge, Safari as webkitSpeechRecognition). */
export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor(): RecognitionConstructor | undefined {
  const scope = globalThis as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

/** True when the browser has (webkit)SpeechRecognition. Dictation UI hides itself otherwise. */
export function canDictate(): boolean {
  return recognitionConstructor() !== undefined;
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in the browser settings to dictate.',
  'service-not-allowed': 'This browser does not allow dictation here.',
  'no-speech': 'Nothing was heard. Try again a little closer to the microphone.',
  'audio-capture': 'No microphone was found.',
  network: 'Dictation needs a connection in this browser.',
  'language-not-supported': 'This browser cannot dictate Japanese.',
};

/** A plain message for a recognition error code, or undefined for a deliberate abort. */
export function dictationErrorMessage(code: string): string | undefined {
  if (code === 'aborted') return undefined;
  return ERRORS[code] ?? 'Dictation stopped. Try again.';
}

/** Final and interim text across all results of an event. */
function transcripts(event: RecognitionEvent): { final: string; interim: string } {
  let final = '';
  let interim = '';
  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];
    const text = result?.[0]?.transcript ?? '';
    if (result?.isFinal) final += text;
    else interim += text;
  }
  return { final, interim };
}

function configure(Recognition: RecognitionConstructor): SpeechRecognitionLike {
  const recognition = new Recognition();
  recognition.lang = 'ja-JP';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  return recognition;
}

/** Wires recognition events to the handlers: interim text, one final text, plain errors. */
function listen(recognition: SpeechRecognitionLike, handlers: DictationHandlers) {
  const heard = { final: '', interim: '' };
  let failed = false;
  recognition.onresult = (event) => {
    Object.assign(heard, transcripts(event));
    handlers.onInterim?.(heard.final + heard.interim);
  };
  recognition.onerror = (event) => {
    const message = dictationErrorMessage(event.error);
    if (message === undefined) return;
    failed = true;
    handlers.onError?.(message, event.error);
  };
  recognition.onend = () => {
    const text = (heard.final || heard.interim).trim();
    if (text && !failed) handlers.onFinal(text);
    handlers.onEnd?.();
  };
}

/** Starts ja-JP dictation with interim results; it ends by itself after a pause. */
export function startDictation(handlers: DictationHandlers): Dictation {
  const Recognition = recognitionConstructor();
  if (!Recognition) throw new Error('Dictation is not supported in this browser.');
  const recognition = configure(Recognition);
  listen(recognition, handlers);
  try {
    recognition.start();
  } catch {
    handlers.onError?.('Dictation could not start. Try again.', 'start-failed');
    handlers.onEnd?.();
  }
  return { stop: () => recognition.stop() };
}
