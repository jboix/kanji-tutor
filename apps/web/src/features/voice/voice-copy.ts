/** Plain copy for answering by voice (voice.html), as message keys. Calm and plain. */
import type { AiErrorKind } from '../../ai/types.ts';
import type { PlainKey } from '../../ui/i18n/types.ts';

export const PROMPT: PlainKey = 'voice.prompt';
export const HINT: PlainKey = 'voice.hint';
export const TOO_SHORT: PlainKey = 'voice.tooShort';
export const NOTHING_HEARD: PlainKey = 'voice.nothingHeard';
export const NO_RECORDER: PlainKey = 'voice.noRecorder';

const AI_ERRORS: Record<AiErrorKind, PlainKey> = {
  offline: 'voice.offline',
  'no-key': 'voice.noKey',
  'rate-limit': 'voice.rateLimit',
  'invalid-response': 'voice.invalid',
  provider: 'voice.provider',
};

/** The message for a transcription failure, and whether only typing can help right now. */
export function aiFailure(kind: AiErrorKind): { message: PlainKey; typeInstead: boolean } {
  return { message: AI_ERRORS[kind], typeInstead: kind === 'offline' || kind === 'no-key' };
}
