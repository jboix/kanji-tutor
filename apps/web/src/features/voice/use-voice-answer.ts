/**
 * Hold to speak, let go to answer (I2): records while held, then sends the audio to
 * `transcribeReading`, which writes the reading in hiragana as pronounced, and hands the kana to
 * the session to grade. Browser speech recognition is never used here (SPEC "Voice").
 */
import { useEffect, useRef, useState } from 'react';
import type { AiClient, AiErrorKind } from '../../ai/types.ts';
import { type Recorder, startRecording } from '../../lang/voice/index.ts';
import { useAiPress } from '../../ui/ai-action.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { aiFailure, NOTHING_HEARD, TOO_SHORT } from './voice-copy.ts';

export type VoicePhase =
  | { name: 'idle' }
  | { name: 'starting' }
  | { name: 'recording' }
  | { name: 'transcribing' }
  | { name: 'error'; message: PlainKey; detail?: string; typeInstead: boolean };

/** Shorter holds are taps, not answers. */
export const MIN_SPEECH_MS = 300;

const IDLE: VoicePhase = { name: 'idle' };

interface Live {
  recorder: Recorder | undefined;
  released: boolean;
  mounted: boolean;
  /** When the target was shown, for the answer duration. */
  shownAt: number;
}

interface Flow {
  /** The client of the hold that started this recording (A18). */
  client: AiClient;
  live: Live;
  set: (phase: VoicePhase) => void;
  answer: (kana: string, durationMs: number) => void;
}

const failure = (message: PlainKey, typeInstead = false): VoicePhase => ({
  name: 'error',
  message,
  typeInstead,
});

const failed = (kind: AiErrorKind): VoicePhase => ({ name: 'error', ...aiFailure(kind) });

/** A recorder failure: our sentence, with the browser's own words when it gave any. */
const thrown = (error: unknown): VoicePhase => ({
  name: 'error',
  message: 'voice.failed',
  ...(error instanceof Error && error.message ? { detail: error.message } : {}),
  typeInstead: false,
});

async function transcribe(flow: Flow, recorder: Recorder, durationMs: number) {
  const recording = await recorder.stop();
  if (recording.durationMs < MIN_SPEECH_MS) return flow.set(failure(TOO_SHORT));
  const audio = { mime: recording.mime, data: recording.data };
  const result = await flow.client.transcribeReading({ audio });
  if (!result.ok) return flow.set(failed(result.error.kind));
  const kana = result.value.kana.trim();
  if (!kana) return flow.set(failure(NOTHING_HEARD));
  flow.set(IDLE);
  flow.answer(kana, durationMs);
}

/** Stops recording and transcribes; the duration runs from the target shown to letting go. */
async function finish(flow: Flow, recorder: Recorder) {
  flow.live.recorder = undefined;
  flow.set({ name: 'transcribing' });
  try {
    await transcribe(flow, recorder, Date.now() - flow.live.shownAt);
  } catch (error) {
    flow.set(thrown(error));
  }
}

async function begin(flow: Flow) {
  if (globalThis.navigator?.onLine === false) return flow.set(failed('offline'));
  flow.live.released = false;
  flow.set({ name: 'starting' });
  try {
    const recorder = await startRecording();
    if (!flow.live.mounted) return recorder.cancel();
    flow.live.recorder = recorder;
    if (flow.live.released) return void finish(flow, recorder);
    flow.set({ name: 'recording' });
  } catch (error) {
    flow.set(thrown(error));
  }
}

function end(flow: Flow) {
  flow.live.released = true;
  const recorder = flow.live.recorder;
  if (recorder) void finish(flow, recorder);
}

function useLive(): Live {
  const [shownAt] = useState(() => Date.now());
  const live = useRef<Live>({ recorder: undefined, released: false, mounted: false, shownAt });
  useEffect(() => {
    const state = live.current;
    state.mounted = true;
    return () => {
      state.mounted = false;
      state.recorder?.cancel();
      state.recorder = undefined;
    };
  }, []);
  return live.current;
}

export interface VoiceAnswerControls {
  phase: VoicePhase;
  /** 0–1 microphone level while recording. */
  level: () => number;
  press: () => void;
  release: () => void;
  /** Keyboard: first press starts, second press answers. */
  toggle: () => void;
}

/**
 * The hold button carries the AI mark (A18): one hold sends one recording to the tutor. The client
 * comes with the press, through `useAiPress`, and the request goes out when the hold ends.
 */
export function useVoiceAnswer(onAnswer: (kana: string, ms: number) => void): VoiceAnswerControls {
  const withClient = useAiPress();
  const [phase, setPhase] = useState<VoicePhase>(IDLE);
  const live = useLive();
  const latest = useRef(onAnswer);
  latest.current = onAnswer;
  const flowRef = useRef<Flow>(undefined);
  const set = (next: VoicePhase) => live.mounted && setPhase(next);
  const answer = (kana: string, ms: number) => latest.current(kana, ms);
  const holding = phase.name === 'starting' || phase.name === 'recording';
  const press = () => {
    if (phase.name !== 'idle' && phase.name !== 'error') return;
    withClient((client) => {
      flowRef.current = { client, live, set, answer };
      void begin(flowRef.current);
    });
  };
  const release = () => flowRef.current && end(flowRef.current);
  return {
    phase,
    level: () => live.recorder?.level() ?? 0,
    press,
    release,
    toggle: () => (holding ? release() : press()),
  };
}
