/**
 * Two soft answer tones synthesized with Web Audio (U2, D30): no audio files. The context is
 * created on the first user gesture, since iOS only lets audio start from one, and resumed on
 * later gestures if the system suspended it.
 */
import { muteSpeech } from '../lang/speech.ts';

/** Which tone: a gentle rising two-note for a right answer, a soft low note for a wrong one. */
export type Cue = 'correct' | 'wrong';

interface Note {
  /** Hz. */
  freq: number;
  /** Seconds after the cue starts. */
  at: number;
  /** Seconds. */
  length: number;
  wave: OscillatorType;
}

/** E5 then A5, short and quiet; a low G3. */
export const CUES: Record<Cue, readonly Note[]> = {
  correct: [
    { freq: 659.25, at: 0, length: 0.14, wave: 'sine' },
    { freq: 880, at: 0.1, length: 0.2, wave: 'sine' },
  ],
  wrong: [{ freq: 196, at: 0, length: 0.24, wave: 'sine' }],
};

/** Peak gain of a note: soft, well under full scale. */
export const PEAK = 0.07;
const ATTACK = 0.012;
const FLOOR = 0.0001;

export interface Sound {
  /** Creates or resumes the context; call from a user gesture. */
  unlock: () => void;
  /** Plays a cue if the context exists; never throws. */
  play: (cue: Cue) => void;
  /** Unlocks on every pointer, touch or key gesture on `target`; returns the remover. */
  listen: (target: EventTarget) => () => void;
  /** Silences every cue until unmuted (Settings → Sound off, D125). */
  mute: (value: boolean) => void;
  /** Scales every cue, 0 to 1 (Settings → Sound). */
  volume: (value: number) => void;
}

function playNote(context: AudioContext, note: Note, start: number, peak: number) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const begin = start + note.at;
  const end = begin + note.length;
  osc.type = note.wave;
  osc.frequency.setValueAtTime(note.freq, begin);
  gain.gain.setValueAtTime(FLOOR, begin);
  gain.gain.linearRampToValueAtTime(peak, begin + ATTACK);
  gain.gain.exponentialRampToValueAtTime(FLOOR, end);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(begin);
  osc.stop(end + 0.02);
}

function playCue(context: AudioContext, cue: Cue, peak: number) {
  if (context.state !== 'running') void context.resume().catch(() => undefined);
  try {
    for (const note of CUES[cue]) playNote(context, note, context.currentTime, peak);
  } catch {
    // A sound is never worth breaking the session for.
  }
}

const GESTURES = ['pointerdown', 'touchend', 'keydown'] as const;

/** A sound player over a context factory (tests pass a fake). */
export function createSound(make: () => AudioContext | undefined): Sound {
  let context: AudioContext | undefined;
  let muted = false;
  let peak = PEAK;
  const unlock = () => {
    try {
      context ??= make();
      if (context && context.state !== 'running') void context.resume().catch(() => undefined);
    } catch {
      context = undefined;
    }
  };
  const play = (cue: Cue) => {
    if (context && !muted) playCue(context, cue, peak);
  };
  const listen = (target: EventTarget) => {
    for (const name of GESTURES) target.addEventListener(name, unlock, { passive: true });
    return () => {
      for (const name of GESTURES) target.removeEventListener(name, unlock);
    };
  };
  const mute = (value: boolean) => {
    muted = value;
  };
  const volume = (value: number) => {
    peak = PEAK * Math.min(Math.max(value, FLOOR), 1);
  };
  return { unlock, play, listen, mute, volume };
}

function browserContext(): AudioContext | undefined {
  const Ctor = globalThis.AudioContext as typeof AudioContext | undefined;
  return Ctor ? new Ctor() : undefined;
}

/** The app's one player. */
export const sound: Sound = createSound(browserContext);

/**
 * Applies Settings → Sound (D125) to everything that makes a sound: the answer tones and speech
 * (the speaker buttons, listening exercises). On when unset; the volume scales the tones.
 */
export function applySound(setting: boolean | undefined, volume = 1): void {
  const off = setting === false;
  sound.mute(off);
  sound.volume(volume);
  muteSpeech(off);
}
