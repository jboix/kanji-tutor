/**
 * The full licence texts of what the app ships, as one plain-text file: the data, the fonts, the
 * handwriting recognizer and the runtime libraries. `bun run credits` writes it to
 * `public/third-party-licenses.txt`, which Settings → About offers for download; a test fails
 * when the committed file is out of date.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
/** The repository root, with the app's own licence and the data licences. */
const REPO = resolve(ROOT, '..', '..');

export const OUTPUT = join(ROOT, 'public', 'third-party-licenses.txt');

interface Work {
  name: string;
  by: string;
  source: string;
  licence: string;
  /** Licence texts and notices in the repository (paths from its root), printed in full. */
  files?: readonly string[];
  /** Where the licence text lives, when it is not printed here. */
  licenceUrl?: string;
}

const WORKS: readonly Work[] = [
  {
    name: 'Kanji Tutor',
    by: 'Josep Boix Requesens',
    source: 'https://github.com/jboix/kanji-tutor',
    licence: 'MIT',
    files: ['LICENSE'],
  },
  {
    name: 'JMdict, KANJIDIC2 and KRADFILE (dictionary data)',
    by: 'The Electronic Dictionary Research and Development Group (property of the EDRDG)',
    source: 'https://www.edrdg.org/',
    licence: 'CC BY-SA 4.0',
    files: ['licenses/CC-BY-SA-4.0.txt'],
  },
  {
    name: 'JLPT levels',
    by: "Jonathan Waller's JLPT lists (CC BY), mapped to JMdict by yomitan-jlpt-vocab",
    source: 'https://github.com/stephenmk/yomitan-jlpt-vocab',
    licence: 'CC BY-SA 4.0',
  },
  {
    name: 'Example sentences',
    by: 'Tatoeba contributors',
    source: 'https://tatoeba.org/',
    licence: 'CC BY 2.0 FR',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0/fr/legalcode',
  },
  {
    name: 'KanjiCanvas (handwriting recognition)',
    by: 'Dominik Klein and Seth Clydesdale',
    source: 'https://github.com/asdfjkl/kanjicanvas',
    licence: 'MIT',
    files: ['apps/web/src/features/handwrite/recognizer/LICENSE-kanjicanvas.txt'],
  },
];

/** Runtime libraries beyond `dependencies`: Workbox runs in the service worker. */
const EXTRA_LIBRARIES = ['workbox-core', 'workbox-precaching', 'workbox-routing', 'workbox-window'];

/**
 * Where a package is installed. The app's own dependencies are linked in its node_modules; the
 * service worker's Workbox packages come in through vite-plugin-pwa and workbox-build instead.
 */
function packageDir(name: string): string | undefined {
  const own = join(ROOT, 'node_modules', name);
  if (existsSync(own)) return own;
  let from = join(ROOT, 'package.json');
  for (const via of ['vite-plugin-pwa', 'workbox-build']) {
    from = createRequire(from).resolve(`${via}/package.json`);
    const found = join(dirname(from), '..', name);
    if (existsSync(found)) return found;
  }
  return undefined;
}

function installedDir(name: string): string {
  const dir = packageDir(name);
  if (!dir) throw new Error(`${name} is not installed`);
  return dir;
}

const RULE = '='.repeat(78);
const LINE = '-'.repeat(78);

const read = (path: string) => readFileSync(path, 'utf8').trim();

/** A package's licence and notice files, in full. */
function packageTexts(name: string): string[] {
  const dir = installedDir(name);
  return readdirSync(dir)
    .filter((file) => /^(licen[sc]e|notice)/i.test(file))
    .sort()
    .map((file) => read(join(dir, file)));
}

function packageLicence(name: string): string {
  const pkg = JSON.parse(read(join(installedDir(name), 'package.json'))) as {
    license?: string;
  };
  return pkg.license ?? 'see the package';
}

function work(entry: Work): string[] {
  const texts = (entry.files ?? []).map((file) => read(join(REPO, file)));
  const where = entry.licenceUrl ? [`  Licence text: ${entry.licenceUrl}`] : [];
  const seeAbove =
    texts.length === 0 && !entry.licenceUrl ? ['  (Licence text printed above.)'] : [];
  return [
    entry.name,
    `  By:      ${entry.by}`,
    `  Source:  ${entry.source}`,
    `  Licence: ${entry.licence}`,
    ...where,
    ...seeAbove,
    '',
    ...texts.flatMap((text) => [LINE, text, LINE, '']),
  ];
}

function library(name: string): string[] {
  const texts = packageTexts(name);
  return [`${name}  (${packageLicence(name)})`, ...texts.flatMap((text) => [LINE, text]), LINE, ''];
}

/** The runtime libraries the build ships, sorted. */
function libraries(): string[] {
  const pkg = JSON.parse(read(join(ROOT, 'package.json'))) as {
    dependencies: Record<string, string>;
  };
  const extra = EXTRA_LIBRARIES.filter((name) => packageDir(name) !== undefined);
  return [...Object.keys(pkg.dependencies), ...extra].sort();
}

/** The whole file. */
export function thirdPartyText(): string {
  return [
    'KANJI TUTOR — LICENCES',
    '',
    'The licence texts of Kanji Tutor and of the data, fonts and code it ships.',
    'Generated by `bun run credits`.',
    '',
    RULE,
    'THE APP AND ITS DATA',
    RULE,
    '',
    ...WORKS.flatMap(work),
    RULE,
    'FONTS AND LIBRARIES',
    RULE,
    '',
    ...libraries().flatMap(library),
  ].join('\n');
}
