/**
 * Renders the app icon (B3): 漢 in Klee One 600, in paper on a 藍 indigo tile, with a small
 * crimson hanko seal at the lower right. The glyph is a path read from the font, so `icon.svg`
 * renders without it; the PNGs are screenshots of that same SVG in headless Chromium.
 * Run with `bun scripts/gen-icons.ts` after changing the design; the files are committed.
 * Colours are the light tokens from `src/ui/tokens.css`. It also draws the iOS launch images
 * (N1c): the launch screen of `index.html` (icon and name on paper) for each current iPhone in
 * portrait, and writes their `apple-touch-startup-image` links into `index.html`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { glyphPath } from './glyph-path.ts';

const root = resolve(import.meta.dir, '..');
const font = readFileSync(
  join(root, 'node_modules/@fontsource/klee-one/files/klee-one-japanese-600-normal.woff'),
);
const glyph = glyphPath(new Uint8Array(font), '漢');

const COLOURS = { tile: '#1E4D7A', glyph: '#F7F8F6', seal: '#B3243A' };

/** The glyph scaled into a square of `size` units centred on (cx, cy), in a 100-unit icon. */
function placedGlyph(size: number, cx: number, cy: number): string {
  const { box } = glyph;
  const scale = size / Math.max(box.width, box.height);
  const x = cx - (box.x + box.width / 2) * scale;
  const y = cy - (box.y + box.height / 2) * scale;
  const transform = `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})`;
  return `<path transform="${transform}" fill="${COLOURS.glyph}" d="${glyph.d}"/>`;
}

/** A square seal of side `side` with its centre at (cx, cy), turned -4deg like the 解 seal. */
function seal(side: number, cx: number, cy: number): string {
  const x = (cx - side / 2).toFixed(2);
  const y = (cy - side / 2).toFixed(2);
  const turn = `rotate(-4 ${cx.toFixed(2)} ${cy.toFixed(2)})`;
  const corner = (side * 0.16).toFixed(2);
  return `<rect x="${x}" y="${y}" width="${side}" height="${side}" rx="${corner}" fill="${COLOURS.seal}" transform="${turn}"/>`;
}

/**
 * `zoom` shrinks the artwork towards the centre: 1 for the plain icon, less for the maskable one,
 * whose visible circle is the middle 80%. `rounded` gives the tile its own corners.
 */
function svg(zoom: number, rounded: boolean): string {
  const c = (value: number) => 50 + (value - 50) * zoom;
  const tile = rounded
    ? `<rect width="100" height="100" rx="22" fill="${COLOURS.tile}"/>`
    : `<rect width="100" height="100" fill="${COLOURS.tile}"/>`;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
    '<title>Kanji Tutor</title>',
    tile,
    placedGlyph(58 * zoom, c(45), c(45)),
    seal(12 * zoom, c(81.5), c(81.5)),
    '</svg>\n',
  ].join('');
}

const targets: [name: string, size: number, zoom: number, rounded: boolean][] = [
  ['icon-192.png', 192, 1, true],
  ['icon-512.png', 512, 1, true],
  ['icon-maskable-512.png', 512, 0.72, false],
  // iOS rounds the corners itself and fills transparency with black, so this one is square.
  ['apple-touch-icon.png', 180, 0.92, false],
  ['favicon-32.png', 32, 1, true],
];

/**
 * Current iPhones in portrait, in CSS points and device pixel ratio (one image per screen size):
 * 17 Pro Max and 16 Pro Max; 17, 17 Pro and 16 Pro; Air; 16 Plus to 14 Pro Max; 16, 15 and
 * 14 Pro; 16e, 14 to 12; 14 Plus to 12 Pro Max; 13 mini to X; 11 and XR; SE and 8.
 */
const IPHONES: [width: number, height: number, ratio: number][] = [
  [440, 956, 3],
  [402, 874, 3],
  [420, 912, 3],
  [430, 932, 3],
  [393, 852, 3],
  [390, 844, 3],
  [428, 926, 3],
  [375, 812, 3],
  [414, 896, 2],
  [375, 667, 2],
];

const nameFont = readFileSync(
  join(
    root,
    'node_modules/@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-latin-700-normal.woff2',
  ),
).toString('base64');

/** The launch screen as index.html draws it, in light paper. */
function launchPage(): string {
  const font = `@font-face{font-family:N;src:url(data:font/woff2;base64,${nameFont})}`;
  const page = `html,body{margin:0;height:100%;background:#F7F8F6}body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;color:#14202B;font:700 20px/1.3 N;letter-spacing:.01em}svg{width:96px;height:96px}p{margin:0}`;
  return `<html><head><style>${font}${page}</style></head><body>${svg(1, true)}<p>Kanji Tutor</p></body></html>`;
}

const startupName = (w: number, h: number, r: number) => `startup-${w * r}x${h * r}.png`;

function startupLink([w, h, r]: (typeof IPHONES)[number]): string {
  const media = `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`;
  return `    <link rel="apple-touch-startup-image" media="${media}" href="/icons/startup/${startupName(w, h, r)}" />`;
}

async function drawStartup(tab: Page): Promise<void> {
  mkdirSync(join(root, 'public/icons/startup'), { recursive: true });
  for (const [w, h, r] of IPHONES) {
    const shot = await tab
      .context()
      .browser()
      ?.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: r });
    if (!shot) throw new Error('no browser');
    await shot.setContent(launchPage());
    await shot.evaluate(() => document.fonts.ready);
    await shot.screenshot({ path: join(root, 'public/icons/startup', startupName(w, h, r)) });
    await shot.close();
  }
  const html = join(root, 'index.html');
  const links = IPHONES.map(startupLink).join('\n');
  const block = /( *<!-- startup:start -->\n)[\s\S]*?( *<!-- startup:end -->)/;
  writeFileSync(html, readFileSync(html, 'utf8').replace(block, `$1${links}\n$2`));
}

const browser = await chromium.launch();
const tab = await browser.newPage();
for (const [name, size, zoom, rounded] of targets) {
  await tab.setViewportSize({ width: size, height: size });
  const body = `<html><body style="margin:0">${svg(zoom, rounded).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`;
  await tab.setContent(body);
  await tab.screenshot({ path: join(root, 'public/icons', name), omitBackground: true });
}
await drawStartup(tab);
await browser.close();

writeFileSync(join(root, 'public/icons/icon.svg'), svg(1, true));
process.stdout.write('icons and launch images written\n');
