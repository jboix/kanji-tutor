/**
 * Vite plugin that serves kuromoji's IPADIC dictionary (`node_modules/kuromoji/dict/*.dat.gz`)
 * at `${base}dict/` in dev and preview, and copies it into `dist/dict/` on build. The files are
 * never committed. They are served as opaque bytes (no `Content-Encoding`), because kuromoji
 * gunzips them itself and a browser-side decompression would break that.
 */
import { createReadStream, readdirSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

type Next = () => void;

function dictDir(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('kuromoji/package.json')), 'dict');
}

function middleware(prefix: () => string, dir: string, files: ReadonlySet<string>) {
  return (req: IncomingMessage, res: ServerResponse, next: Next) => {
    const path = (req.url ?? '').split('?')[0] ?? '';
    const name = path.startsWith(prefix()) ? path.slice(prefix().length) : '';
    if (!files.has(name)) return next();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    createReadStream(join(dir, name)).pipe(res);
  };
}

/** Serves and emits kuromoji's dictionary under `${base}dict/`. */
export function kuromojiDict(): Plugin {
  const dir = dictDir();
  const files = new Set(readdirSync(dir).filter((name) => name.endsWith('.dat.gz')));
  let base = '/';
  const prefix = () => `${base}dict/`;
  return {
    name: 'kanji-reader:kuromoji-dict',
    configResolved(config) {
      base = config.base;
    },
    configureServer(server) {
      server.middlewares.use(middleware(prefix, dir, files));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(prefix, dir, files));
    },
    generateBundle() {
      for (const name of files) {
        this.emitFile({
          type: 'asset',
          fileName: `dict/${name}`,
          source: readFileSync(join(dir, name)),
        });
      }
    },
  };
}
