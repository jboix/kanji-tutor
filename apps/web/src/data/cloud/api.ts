import type { CloudReason } from '../../domain/cloud.ts';

/** A failed call, with the server's reason or the device's own (`offline`, `server`). */
export class CloudError extends Error {
  constructor(readonly reason: CloudReason | 'save-changed' | 'too-many-saves' | 'no-save') {
    super(reason);
  }
}

/** The saved progress as the server holds it: gzipped bytes and their version. */
export type RemoteSave =
  | { status: 'none' }
  | { status: 'same' }
  | { status: 'got'; data: Uint8Array<ArrayBuffer>; version: number };

export interface CloudApi {
  post<T>(path: string, body?: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
  remove(path: string): Promise<void>;
  /** The save, or `same` when the server's version is `known`. */
  getSave(known: number): Promise<RemoteSave>;
  /** Writes over `version` (0: the first save); `save-changed` when another device saved since. */
  putSave(data: Uint8Array<ArrayBuffer>, version: number): Promise<number>;
}

async function reasonOf(response: Response): Promise<CloudError> {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return new CloudError((body.error ?? 'server') as CloudError['reason']);
}

/** The sync server's API at `base`, calling with the session `token()` when there is one. */
export function cloudApi(base: string, token: () => string | null): CloudApi {
  async function call(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const bearer = token();
    if (bearer) headers.set('authorization', `Bearer ${bearer}`);
    let response: Response;
    try {
      response = await fetch(`${base}${path}`, { ...init, headers });
    } catch {
      throw new CloudError('offline');
    }
    if (!response.ok && response.status !== 304) throw await reasonOf(response);
    return response;
  }
  const json = { 'content-type': 'application/json' };
  return {
    post: async (path, body = {}) =>
      (await call(path, { method: 'POST', headers: json, body: JSON.stringify(body) })).json(),
    get: async (path) => (await call(path)).json(),
    remove: async (path) => void (await call(path, { method: 'DELETE' })),
    getSave: (known) => getSave(call, known),
    putSave: async (data, version) => {
      const headers = version === 0 ? { 'if-none-match': '*' } : { 'if-match': `"${version}"` };
      const response = await call('/save', { method: 'PUT', headers, body: data });
      return ((await response.json()) as { version: number }).version;
    },
  };
}

async function getSave(
  call: (path: string, init?: RequestInit) => Promise<Response>,
  known: number,
): Promise<RemoteSave> {
  try {
    const headers: Record<string, string> = known > 0 ? { 'if-none-match': `"${known}"` } : {};
    const response = await call('/save', { headers });
    if (response.status === 304) return { status: 'same' };
    const version = Number(/"(\d+)"/.exec(response.headers.get('etag') ?? '')?.[1] ?? 0);
    return { status: 'got', data: new Uint8Array(await response.arrayBuffer()), version };
  } catch (error) {
    if (error instanceof CloudError && error.reason === 'no-save') return { status: 'none' };
    throw error;
  }
}
