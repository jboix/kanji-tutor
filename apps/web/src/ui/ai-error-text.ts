/** An AI error in the learner's language (D52). Google's own wording, if any, stays as sent. */
import type { AiError } from '../ai/types.ts';
import type { Translate } from './i18n/types.ts';

function providerText(t: Translate, error: AiError): string {
  if (error.code === 'cancelled') return t('ai.cancelled');
  if (error.code === 'refused') return t('ai.refused', { status: error.status ?? 0 });
  if (error.code === 'no-answer' || !error.message) return t('ai.noAnswer');
  return error.message;
}

/** Why the tutor gave no answer, as one sentence. */
export function aiErrorText(t: Translate, error: AiError): string {
  switch (error.kind) {
    case 'offline':
      return t('ai.offline');
    case 'no-key':
      return t('ai.noKey');
    case 'rate-limit':
      return t('ai.rateLimit');
    case 'invalid-response':
      return t('ai.invalid');
    default:
      return providerText(t, error);
  }
}
