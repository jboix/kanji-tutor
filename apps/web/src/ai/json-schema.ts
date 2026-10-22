import { z } from 'zod';

/** Keywords Gemini's `responseJsonSchema` accepts; anything else is stripped. */
const SUPPORTED = new Set([
  '$id',
  '$defs',
  '$ref',
  '$anchor',
  'type',
  'format',
  'title',
  'description',
  'enum',
  'items',
  'prefixItems',
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  'anyOf',
  'oneOf',
  'properties',
  'additionalProperties',
  'required',
  'propertyOrdering',
]);
/** Keywords whose value is a map of name → schema. */
const SCHEMA_MAPS = new Set(['properties', '$defs']);
/** Keywords whose value is a schema or a list of schemas. */
const SCHEMA_VALUES = new Set(['items', 'prefixItems', 'anyOf', 'oneOf', 'additionalProperties']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanValue(key: string, value: unknown): unknown {
  if (SCHEMA_MAPS.has(key) && isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([name, inner]) => [name, clean(inner)]));
  }
  if (SCHEMA_VALUES.has(key)) return Array.isArray(value) ? value.map(clean) : clean(value);
  return value;
}

function clean(schema: unknown): unknown {
  if (!isRecord(schema)) return schema;
  const kept = Object.entries(schema).filter(
    ([key, value]) => SUPPORTED.has(key) && value !== Number.MAX_SAFE_INTEGER,
  );
  return Object.fromEntries(kept.map(([key, value]) => [key, cleanValue(key, value)]));
}

/**
 * JSON Schema (draft 2020-12, from `z.toJSONSchema`) of a task's response, reduced to the subset
 * Gemini's structured output supports: `$schema`, `pattern`, `const`, `propertyNames` and the
 * like are dropped. Zod still validates the full schema on the way back.
 */
export function toProviderSchema(schema: z.ZodType): Record<string, unknown> {
  const cleaned = clean(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' }));
  return isRecord(cleaned) ? cleaned : {};
}
