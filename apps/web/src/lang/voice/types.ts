/** Shared types of the voice module (SPEC "Voice"). */

/** Live dictation in ja-JP. */
export interface Dictation {
  /** Stops listening; the final text arrives through `onFinal`. */
  stop(): void;
}

export interface DictationHandlers {
  /** Everything heard so far, final and interim, while the user speaks. */
  onInterim?: (text: string) => void;
  /** The dictated text, once, when listening ends with something heard. */
  onFinal: (text: string) => void;
  /**
   * A plain English message and the recognition error code ("no-speech", "start-failed"…), so
   * the UI can word it in the learner's language; listening has ended.
   */
  onError?: (message: string, code: string) => void;
  /** Always called last, whatever happened. */
  onEnd?: () => void;
}

/** A finished recording for `transcribeReading`. */
export interface Recording {
  mime: string;
  /** Base64 audio. */
  data: string;
  durationMs: number;
}

export interface Recorder {
  /** Resolves with the recording when stopped, and releases the microphone. */
  stop(): Promise<Recording>;
  /** Drops the recording and releases the microphone. */
  cancel(): void;
  /** 0–1 input level for the waveform, sampled by the UI. */
  level(): number;
}
