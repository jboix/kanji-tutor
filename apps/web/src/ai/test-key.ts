import { mapProviderError } from './errors.ts';
import { createGeminiProvider, type GeminiOptions } from './providers/gemini.ts';
import type { AiRequest, Result } from './types.ts';

function pingRequest(model: string): AiRequest {
  return {
    task: 'answerQuestion',
    promptVersion: 0,
    model,
    system: 'Reply with JSON only.',
    prompt: 'Reply with {"ok": true}.',
    schema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] },
    thinking: 'minimal',
  };
}

/**
 * Makes one tiny real call with `apiKey` to check it works (Settings "Test key"). The only call
 * the app makes outside a task. Never used in tests or builds; tests inject `options.loadSdk`.
 */
export async function testKey(
  apiKey: string,
  model: string,
  options: GeminiOptions = {},
): Promise<Result<{ model: string }>> {
  const key = apiKey.trim();
  if (!key) return { ok: false, error: { kind: 'no-key', message: 'Enter a key first.' } };
  try {
    await createGeminiProvider(key, options).generate(pingRequest(model));
    return { ok: true, value: { model }, cached: false };
  } catch (error) {
    return { ok: false, error: mapProviderError(error) };
  }
}
