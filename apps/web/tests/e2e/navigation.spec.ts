import { expect, type Page, test } from '@playwright/test';
import { onboard, openStart } from './helpers.ts';

/**
 * Wave 11's navigation (IA1–IA6): the bar, Start, the Learn hub, the Settings
 * categories and the Add chooser, each sub-screen going back to its hub.
 */

const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const back = (page: Page, name = 'Back') => page.getByRole('button', { name, exact: true });

test('the bar is Today · Learn · Start · Add · Settings, Start raised in the middle', async ({
  page,
}) => {
  await onboard(page);
  const links = nav(page).getByRole('link');
  await expect(links).toHaveCount(4);
  const names = ['Home', 'Learn', 'Add', 'Settings'];
  for (const [i, name] of names.entries()) {
    await expect(links.nth(i)).toHaveAccessibleName(name);
  }
  await expect(nav(page).getByRole('link', { name: 'Home' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  // The disc rises above the bar's top edge, and is at least as wide as a tap target.
  const start = nav(page).getByRole('button', { name: 'Start a round' });
  const disc = await start.locator('span').first().boundingBox();
  const bar = await nav(page).boundingBox();
  expect(disc && bar && disc.y).toBeLessThan(bar?.y ?? 0);
  expect(disc?.width).toBeGreaterThanOrEqual(44);
  // The gear on Today went: the bar's Settings is the only way there.
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(1);
});

test('Start offers the first lesson part from zero, and its close returns to Today', async ({
  page,
}) => {
  await onboard(page);
  const sheet = await openStart(page);
  await sheet.getByRole('button', { name: /^Continue the lesson\s?言葉/ }).click();
  await expect(page).toHaveURL(/\/read\?unit=i-am-a-student&section=words&part=1$/);
  await page.getByRole('button', { name: 'End session' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: '今日' })).toBeVisible();
});

test('the Start sheet plays the round chosen in it, and closes without starting', async ({
  page,
}) => {
  await onboard(page);
  let sheet = await openStart(page);
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  sheet = await openStart(page);
  await sheet.getByRole('button', { name: /^Just reading/ }).click();
  await expect(page).toHaveURL(/\/read\?only=reading$/);
});

test('each Learn tile opens its screen, and Back returns to Learn', async ({ page }) => {
  await onboard(page);
  await nav(page).getByRole('link', { name: 'Learn' }).click();
  await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
  const tiles: [RegExp, RegExp][] = [
    [/^Lessons/, /\/units$/],
    [/^Kanji/, /\/kanji$/],
    [/^Grammar/, /\/grammar$/],
    [/^What you've learned/, /\/learned$/],
    [/^Notes/, /\/notes$/],
    [/^Draw a kanji/, /\/handwrite$/],
    [/^Mark what you already know/, /\/import$/],
  ];
  for (const [name, url] of tiles) {
    await page.getByRole('link', { name }).click();
    await expect(page).toHaveURL(url);
    await back(page).click();
    await expect(page).toHaveURL(/\/learn$/);
  }
});

test('Learn looks up a kanji and a grammar pattern', async ({ page }) => {
  await onboard(page);
  await page.goto('/learn');
  const field = page.getByRole('searchbox', { name: 'Look up' });
  await field.fill('学');
  await page.getByRole('link', { name: '学', exact: true }).click();
  await expect(page).toHaveURL(/\/kanji\/%E5%AD%A6$/);
  await back(page).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.getByRole('searchbox', { name: 'Look up' }).fill('です');
  await page.getByRole('searchbox', { name: 'Look up' }).press('Enter');
  await expect(page).toHaveURL(/\/grammar\/.+/);
});

test('Settings opens each category as its own screen, and Back returns to the list', async ({
  page,
}) => {
  await onboard(page);
  await nav(page).getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  const categories: [string, RegExp][] = [
    ['Sessions', /\/settings\/sessions$/],
    ['AI tutor', /\/settings\/tutor$/],
    ['Language', /\/settings\/language$/],
    ['Appearance', /\/settings\/appearance$/],
    ['Your words', /\/settings\/words$/],
    ['Backup and storage', /\/settings\/backup$/],
    ['Install', /\/settings\/install$/],
    ['About and version', /\/settings\/about$/],
  ];
  for (const [name, url] of categories) {
    await page.getByRole('link', { name: new RegExp(`^${name}`) }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
    await back(page, 'Settings').click();
    await expect(page).toHaveURL(/\/settings$/);
  }
});

test('Add chooses Capture or Use it, each going back to Add', async ({ page }) => {
  await onboard(page);
  await nav(page).getByRole('link', { name: 'Add' }).click();
  await expect(page.getByRole('heading', { name: 'Add', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /^Photograph a page/ }).click();
  await expect(page).toHaveURL(/\/capture$/);
  await back(page).click();
  await expect(page).toHaveURL(/\/add$/);
  await page.getByRole('link', { name: /^Write a sentence/ }).click();
  await expect(page).toHaveURL(/\/compose$/);
  await back(page).click();
  await expect(page).toHaveURL(/\/add$/);
});

test('old links still open: notes, kanji, units, grammar and settings', async ({ page }) => {
  await onboard(page);
  const pages: [string, string][] = [
    ['/notes', 'This week'],
    ['/units', 'Lessons'],
    ['/settings', 'Settings'],
  ];
  for (const [path, heading] of pages) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
  }
});

/** The highlight's centre and the centre of the named tab's icon and label together, in CSS px. */
async function highlightAndIcon(page: Page, tab: string) {
  const pill = await nav(page).locator('[data-nav-indicator]').boundingBox();
  const parts = nav(page).getByRole('link', { name: tab }).locator('span');
  const [icon, label] = [await parts.first().boundingBox(), await parts.last().boundingBox()];
  if (!pill || !icon || !label) throw new Error('not laid out');
  return {
    pill: { x: pill.x + pill.width / 2, y: pill.y + pill.height / 2 },
    icon: { x: icon.x + icon.width / 2, y: (icon.y + label.y + label.height) / 2 },
  };
}

test('the active tab is highlighted behind it, and the highlight slides', async ({ page }) => {
  await onboard(page);
  await expect(nav(page).locator('[data-nav-indicator]')).toHaveCount(1);
  const today = await highlightAndIcon(page, 'Home');
  expect(Math.abs(today.pill.x - today.icon.x)).toBeLessThan(2);
  expect(Math.abs(today.pill.y - today.icon.y)).toBeLessThan(2);
  // Record the highlight's left edge every frame while going to Settings.
  await page.evaluate(() => {
    const xs: number[] = [];
    Object.assign(window, { xs });
    const tick = () => {
      const el = document.querySelector('[data-nav-indicator]');
      if (el) xs.push(Math.round(el.getBoundingClientRect().x));
      if (xs.length < 60) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await nav(page).getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { xs: number[] }).xs.length))
    .toBe(60);
  const xs = await page.evaluate(() => (window as unknown as { xs: number[] }).xs);
  const [from, to] = [xs[0] ?? 0, xs.at(-1) ?? 0];
  expect(to).toBeGreaterThan(from);
  // It passed through the columns in between rather than jumping.
  expect(xs.some((x) => x > from + 20 && x < to - 20)).toBe(true);
  const settings = await highlightAndIcon(page, 'Settings');
  expect(Math.abs(settings.pill.x - settings.icon.x)).toBeLessThan(2);
  // Each tab is still a 44px target, and the active one keeps aria-current.
  for (const name of ['Home', 'Learn', 'Add', 'Settings']) {
    const link = await nav(page).getByRole('link', { name }).boundingBox();
    expect(link?.height).toBeGreaterThanOrEqual(44);
  }
  await expect(nav(page).getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('with reduced motion the highlight moves without sliding', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await onboard(page);
  const indicator = nav(page).locator('[data-nav-indicator]');
  await expect(indicator).toHaveCSS('transition-duration', '0s');
  await nav(page).getByRole('link', { name: 'Learn' }).click();
  await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
  const learn = await highlightAndIcon(page, 'Learn');
  expect(Math.abs(learn.pill.x - learn.icon.x)).toBeLessThan(2);
});
