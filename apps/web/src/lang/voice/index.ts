/**
 * Voice input (SPEC "Voice"). Two jobs, two tools: dictation for questions and Use-it sentences
 * uses the browser's speech recognition (I3); spoken reading answers are recorded and sent to
 * `transcribeReading` so mispronunciations are kept, not auto-corrected (I2).
 */
export { canDictate, dictationErrorMessage, startDictation } from './dictation.ts';
export { type KanaSegment, type KanaSegmentKind, kanaDiff } from './kana-diff.ts';
export { rmsLevel } from './level.ts';
export { canRecord, micErrorMessage, pickMime, startRecording } from './recorder.ts';
export type { Dictation, DictationHandlers, Recorder, Recording } from './types.ts';
