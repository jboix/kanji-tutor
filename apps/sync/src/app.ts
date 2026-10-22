import { Hono, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { deleteAccount, devices, getSave, logout, me, putSave, removeDevice } from './account.ts';
import type { Deps } from './deps.ts';
import { emailAdd, emailConfirm, emailLogin, emailLoginVerify } from './email.ts';
import { cors, HttpError, json } from './http.ts';
import { pairApprove, pairClaim, pairPeek, pairStart } from './pair.ts';
import { loginOptions, loginVerify, registerOptions, registerVerify } from './passkeys.ts';

type Handler = (request: Request, deps: Deps, param: string) => Promise<Response>;

/** The API: [method, path, handler]; `:id` is the one path parameter. */
const ROUTES: readonly [string, string, Handler][] = [
  ['POST', '/passkey/register/options', registerOptions],
  ['POST', '/passkey/register/verify', registerVerify],
  ['POST', '/passkey/login/options', loginOptions],
  ['POST', '/passkey/login/verify', loginVerify],
  ['POST', '/pair/start', pairStart],
  ['POST', '/pair/approve', pairApprove],
  ['POST', '/pair/claim', pairClaim],
  ['GET', '/pair/:id', pairPeek],
  ['POST', '/email', emailAdd],
  ['POST', '/email/confirm', emailConfirm],
  ['POST', '/email/login', emailLogin],
  ['POST', '/email/login/verify', emailLoginVerify],
  ['GET', '/me', me],
  ['GET', '/devices', devices],
  ['DELETE', '/devices/:id', removeDevice],
  ['POST', '/logout', logout],
  ['DELETE', '/account', deleteAccount],
  ['GET', '/save', getSave],
  ['PUT', '/save', putSave],
];

/** An expected failure as { error } with its status; anything else is a logged 500. */
function failure(error: Error): Response {
  if (error instanceof HttpError) return json({ error: error.reason }, error.status);
  process.stderr.write(`${error.stack ?? error.message}\n`);
  return json({ error: 'server' }, 500);
}

/** On every answer, /health included: nothing is cached, and types are never guessed. */
const SAFE_HEADERS = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

const isSave = (request: Request) =>
  request.method === 'PUT' && new URL(request.url).pathname === '/save';

/** Bodies over `max` bytes are refused with 413 before they are read in full. */
const capped = (max: number, reason: string) =>
  bodyLimit({ maxSize: max, onError: () => json({ error: reason }, 413) });

const withHeaders = (response: Response, headers: Record<string, string>) => {
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
};

/** The per-client limit's 429, or undefined when the request may go on. */
function overLimit(deps: Deps, request: Request): Response | undefined {
  try {
    deps.limitAll(request);
    return undefined;
  } catch (error) {
    return failure(error as Error);
  }
}

/** The gate: only the app's origin, CORS on every answer, the per-client limit. */
function gate(deps: Deps): MiddlewareHandler {
  return async (c, next) => {
    const origin = c.req.header('origin');
    if (origin !== undefined && origin !== deps.origin) return json({ error: 'origin' }, 403);
    if (c.req.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: cors(deps.origin) });
    const refused = overLimit(deps, c.req.raw);
    if (refused) return withHeaders(refused, cors(deps.origin));
    await next();
    withHeaders(c.res, cors(deps.origin));
  };
}

/**
 * The server: /health for anyone, then the gate, then the API, whose bodies are capped (a save at
 * MAX_SAVE_MB, anything else at MAX_BODY_KB).
 */
export function createApp(deps: Deps): Hono {
  const app = new Hono();
  app.use('*', async (c, next) => {
    await next();
    withHeaders(c.res, SAFE_HEADERS);
  });
  app.get('/health', (c) => c.json({ ok: true, version: deps.version }));
  app.use('*', gate(deps));
  const save = capped(deps.caps.maxSaveBytes, 'save-too-big');
  const other = capped(deps.caps.maxBodyBytes, 'too-big');
  app.use('*', (c, next) => (isSave(c.req.raw) ? save(c, next) : other(c, next)));
  for (const [method, path, handler] of ROUTES) {
    app.on(method, path, (c) => handler(c.req.raw, deps, c.req.param('id') ?? ''));
  }
  app.notFound(() => json({ error: 'not-found' }, 404));
  app.onError(failure);
  return app;
}

/** One request through a fresh app: for tests. */
export const handle = (request: Request, deps: Deps) => createApp(deps).fetch(request);
