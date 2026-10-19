import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { toProviderSchema } from './json-schema.ts';
import { correctionSchema } from './schemas/correct-sentence.ts';
import { explainMistakeSchema } from './schemas/explain-mistake.ts';
import { followUpSchema } from './schemas/follow-up.ts';
import { transcriptionSchema } from './schemas/transcribe-reading.ts';

const SUPPORTED = new Set([
  'type',
  'format',
  'title',
  'description',
  'enum',
  'items',
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  'anyOf',
  'oneOf',
  'properties',
  'additionalProperties',
  'required',
]);

function keysOf(schema: unknown, inProperties = false): string[] {
  if (Array.isArray(schema)) return schema.flatMap((inner) => keysOf(inner));
  if (schema === null || typeof schema !== 'object') return [];
  return Object.entries(schema).flatMap(([key, inner]) => [
    ...(inProperties ? [] : [key]),
    ...keysOf(inner, key === 'properties' && !inProperties),
  ]);
}

describe('toProviderSchema', () => {
  it('strips keywords Gemini does not support', () => {
    const schema = z.object({
      kana: z.string().regex(/^[ぁ-ん]+$/),
      kind: z.literal('x'),
      map: z.record(z.string(), z.number()),
      n: z.int().min(0),
    });
    const converted = toProviderSchema(schema);
    expect(converted.$schema).toBeUndefined();
    expect(JSON.stringify(converted)).not.toMatch(/pattern|const|propertyNames|9007199254740991/);
    expect(converted).toMatchObject({ type: 'object', required: ['kana', 'kind', 'map', 'n'] });
  });

  it.each([explainMistakeSchema, followUpSchema, correctionSchema, transcriptionSchema])(
    'keeps only supported keywords in task schema %#',
    (schema) => {
      const keys = keysOf(toProviderSchema(schema));
      expect(keys.filter((key) => !SUPPORTED.has(key))).toEqual([]);
    },
  );

  it('leaves exact-optional fields out of required', () => {
    const converted = toProviderSchema(explainMistakeSchema);
    expect(converted.required).toEqual(['explanation', 'chips', 'readings']);
  });
});
