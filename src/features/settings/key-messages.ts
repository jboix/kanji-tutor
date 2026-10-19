import type { AiError, Result } from '../../ai/index.ts';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import type { Translate } from '../../ui/i18n/types.ts';

/** Never let the key itself reach the screen, even inside a provider message (N3). */
function scrub(text: string, key: string): string {
  // Real keys are ~39 characters; a very short test string would mangle ordinary words.
  return key.length >= 8 ? text.split(key).join('…') : text;
}

function kindMessage(error: AiError, t: Translate): string {
  switch (error.kind) {
    case 'offline':
      return t('settingsAi.testOffline');
    case 'no-key':
      return t('settingsAi.testNoKey');
    case 'rate-limit':
      return t('settingsAi.testRateLimit');
    case 'invalid-response':
      return t('settingsAi.testInvalidResponse');
    case 'provider':
      return t('settingsAi.testProvider', { detail: aiErrorText(t, error) });
  }
}

/** Google answers a wrong or disabled key with 400, 401 or 403 (or "API key not valid"). */
const INVALID_KEY = /\((400|401|403)\)|API_KEY_INVALID|API key\b.*\bnot valid/i;

function errorMessage(error: AiError, t: Translate): string {
  const invalid =
    error.kind === 'provider' &&
    (INVALID_KEY.test(error.message) || [400, 401, 403].includes(error.status ?? 0));
  if (invalid) return t('settingsAi.testInvalidKey', { detail: aiErrorText(t, error) });
  return kindMessage(error, t);
}

/** What "Test key" says about a result. */
export function testKeyMessage(
  result: Result<{ model: string }>,
  key: string,
  t: Translate,
): string {
  if (result.ok) return t('settingsAi.testWorks', { model: result.value.model });
  return scrub(errorMessage(result.error, t), key);
}

/** What "Test key" says when the call threw instead of returning a result. */
export function thrownMessage(error: unknown, key: string, t: Translate): string {
  const detail = error instanceof Error ? error.message : String(error);
  return scrub(t('settingsAi.testThrown', { detail }), key);
}
