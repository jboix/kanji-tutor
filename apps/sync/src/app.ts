import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { deleteAccount, devices, getSave, logout, me, putSave, removeDevice } from './account.ts';
import type { Deps } from './deps.ts';
import { emailAdd, emailConfirm, emailLogin, emailLoginVerify } from './email.ts';
import { cors, HttpError, json } from './http.ts';
import { pairApprove, pairClaim, pairPeek, pairStart } from './pair.ts';
import { loginOptions, loginVerify, registerOptions, registerVerify } from './passkeys.ts';
import { MAX_SAVE_BYTES } from './saves.ts';

type Handler = (request: Request, deps: Deps, param: string) => Promise<Response>;

/** The API (D133, D140): [method, path, handler]; `:id` is the one path parameter. */
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

/**
 * The server (D140): /health for anyone, then the API for the app's origin only, with CORS on
 * every answer, errors included.
 */
export function createApp(deps: Deps): Hono {
  const app = new Hono();
  app.get('/health', (c) => c.json({ ok: true, version: deps.version }));
  app.use('*', async (c, next) => {
    const origin = c.req.header('origin');
    if (origin !== undefined && origin !== deps.origin) return json({ error: 'origin' }, 403);
    if (c.req.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: cors(deps.origin) });
    await next();
    for (const [name, value] of Object.entries(cors(deps.origin))) c.res.headers.set(name, value);
  });
  app.put(
    '/save',
    bodyLimit({ maxSize: MAX_SAVE_BYTES, onError: () => json({ error: 'save-too-big' }, 413) }),
  );
  for (const [method, path, handler] of ROUTES) {
    app.on(method, path, (c) => handler(c.req.raw, deps, c.req.param('id') ?? ''));
  }
  app.notFound(() => json({ error: 'not-found' }, 404));
  app.onError(failure);
  return app;
}

/** One request through a fresh app: for tests. */
export const handle = (request: Request, deps: Deps) => createApp(deps).fetch(request);
