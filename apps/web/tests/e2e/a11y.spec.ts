import { expect, type Page, test } from '@playwright/test';
import { layoutReport, scanHere } from './a11y-checks.ts';
import { importKnown, launched, onboard } from './helpers.ts';

/** Screens reachable by URL once the dictionary is loaded and known words are imported. */
const SCREENS = [
  '/',
  '/read',
  '/kanji',
  '/kanji/生',
  '/capture',
  '/notes',
  '/compose',
  '/handwrite',
  '/settings',
  '/settings/sessions',
  '/settings/tutor',
  '/settings/backup',
  '/learn',
  '/add',
  '/plan',
  '/import',
  '/log-in',
];

async function scan(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await launched(page);
  return scanHere(page, path);
}

test('every screen passes axe WCAG 2.2 AA checks in light and dark (N6)', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await importKnown(page);
  const issues: string[] = [];
  for (const path of SCREENS) {
    issues.push(...(await scan(page, path)));
  }
  expect(issues).toEqual([]);
});

test('no horizontal scroll and 44 px targets at this width (N6)', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  for (const path of SCREENS) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const report = await layoutReport(page);
    expect.soft(report.wide, `${path} scrolls sideways`).toBe(false);
    expect.soft(report.small, `${path} small targets`).toEqual([]);
  }
});

/** The welcome, then each wizard step to the summary (P5). */
const WIZARD: { heading: string; leave: (page: Page) => Promise<void> }[] = [
  { heading: 'Kanji Tutor', leave: (page) => skip(page, 'Start') },
  { heading: 'Your language', leave: (page) => next(page) },
  { heading: 'Which one can you read?', leave: (page) => next(page) },
  {
    heading: 'Do you follow a class?',
    leave: async (page) => {
      await page.getByText('Minna no Nihongo', { exact: true }).click();
      await page.getByRole('button', { name: 'Next lesson' }).click();
      await page.getByText('Paste a list of words you know').click();
      await next(page);
    },
  },
  {
    heading: 'Meet your tutor',
    leave: async (page) => {
      await page.getByText('Advanced: models').click();
      await skip(page, 'Skip');
    },
  },
  { heading: 'How sessions feel', leave: (page) => next(page) },
  { heading: 'Your choices', leave: async () => undefined },
];

const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click();
const skip = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click();

test('every wizard step passes axe and keeps 44 px targets (N6, P5)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.context().route('**/generativelanguage.googleapis.com/**', (route) => route.abort());
  await page.goto('/');
  await launched(page);
  const issues: string[] = [];
  for (const step of WIZARD) {
    await expect(page.getByRole('heading', { level: 1, name: step.heading })).toBeVisible({
      timeout: 30_000,
    });
    // A key skips the welcome's animation; then let the slide settle so axe sees the final
    // colours.
    await page.keyboard.press('Shift');
    await page.waitForTimeout(400);
    issues.push(...(await scanHere(page, step.heading)));
    const report = await layoutReport(page);
    expect.soft(report.wide, `${step.heading} scrolls sideways`).toBe(false);
    expect.soft(report.small, `${step.heading} small targets`).toEqual([]);
    await step.leave(page);
  }
  expect(issues).toEqual([]);
});
