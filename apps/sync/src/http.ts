import type { z } from 'zod';

/** A failed request: its status and a short machine-readable reason. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly reason: string,
  ) {
    super(reason);
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

/** The request body, checked against `schema`; a 400 when it does not fit. */
export async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) throw new HttpError(400, 'bad-request');
  return parsed.data;
}

/** CORS for the app's origin only (D133): it calls with a bearer token and If-Match. */
export function cors(origin: string): Record<string, string> {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, if-match, if-none-match',
    'access-control-expose-headers': 'etag',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}
