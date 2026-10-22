let muted = false;

/**
 * Settings → Appearance → Sound: off silences speech too. While muted, `canSpeak` is
 * false, so the speaker buttons hide and sessions leave out listening exercises.
 */
export function muteSpeech(value: boolean): void {
  muted = value;
  if (value && typeof globalThis.speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

/** True when the app may speak Japanese with Web Speech synthesis (R7): sound on, and a voice. */
export function canSpeak(): boolean {
  return !muted && typeof globalThis.speechSynthesis !== 'undefined';
}

/** Speaks Japanese text with the browser's ja-JP voice (R7). Resolves when speech ends. */
export function speak(text: string, rate = 0.9): Promise<void> {
  if (!canSpeak()) return Promise.resolve();
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rate;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });
}

const isJapanese = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().startsWith('ja');

/** How long to wait for the voice list, which some browsers fill in only after a moment. */
const VOICE_WAIT_MS = 700;

let japanese: Promise<boolean> | undefined;

function lookForVoice(wait: number): Promise<boolean> {
  const synth = globalThis.speechSynthesis;
  const has = () => synth.getVoices().some(isJapanese);
  if (synth.getVoices().length > 0) return Promise.resolve(has());
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      synth.removeEventListener?.('voiceschanged', done);
      resolve(has());
    };
    const timer = setTimeout(done, wait);
    synth.addEventListener?.('voiceschanged', done);
  });
}

/**
 * True when the device has a Japanese voice for speech synthesis, so listening exercises can be
 * offered (S4). Looked up once; `fresh` looks again (tests).
 */
export function hasJapaneseVoice(fresh = false, wait = VOICE_WAIT_MS): Promise<boolean> {
  if (!canSpeak() || typeof globalThis.speechSynthesis.getVoices !== 'function') {
    return Promise.resolve(false);
  }
  if (fresh || !japanese) japanese = lookForVoice(wait).catch(() => false);
  return japanese;
}
