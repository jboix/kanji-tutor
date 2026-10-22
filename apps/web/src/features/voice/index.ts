/** Voice answers (I2): the component the read feature renders through the `voiceAnswer` slot. */
import { canRecord } from '../../lang/voice/index.ts';
import type { Slots } from '../../ui/slots.tsx';
import { VoiceAnswer } from './voice-answer.tsx';

export { VoiceAnswer };

/**
 * The slots this feature fills, for `src/app`: none when the browser cannot record, so the read
 * screen hides its "Answer by voice" button instead of offering something that cannot work.
 */
export function voiceSlots(): Pick<Slots, 'voiceAnswer'> {
  return canRecord() ? { voiceAnswer: VoiceAnswer } : {};
}
