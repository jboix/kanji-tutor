/**
 * A static server over the e2e build that can pretend a new build was deployed: from
 * `deployNext()` on, `sw.js` differs by a byte and `version.json` names the next version.
 * Playwright cannot route the browser's own fetch of a service worker script, so the update
 * test needs a server of its own.
 */
import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize } from 'node:path';

const DIST = '.cache/e2e-dist';

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

export interface NextBuildServer {
  url: string;
  deployNext: (next: { version: string; notes: string[] }) => void;
  close: () => Promise<void>;
}

async function body(path: string): Promise<{ data: Buffer; file: string }> {
  const file = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  try {
    return { data: await readFile(file), file };
  } catch {
    // The app's routes, such as /settings/about, all load the shell.
    return { data: await readFile(join(DIST, 'index.html')), file: 'index.html' };
  }
}

export async function startNextBuildServer(): Promise<NextBuildServer> {
  let next: { version: string; notes: string[] } | undefined;
  const server: Server = createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    if (next && path === '/version.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(next));
      return;
    }
    void body(path === '/' ? '/index.html' : path).then(({ data, file }) => {
      const type = TYPES[extname(file)] ?? 'application/octet-stream';
      const tail = next && path === '/sw.js' ? Buffer.from('\n// next build\n') : Buffer.alloc(0);
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      res.end(Buffer.concat([data, tail]));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://localhost:${port}`,
    deployNext: (value) => {
      next = value;
    },
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
