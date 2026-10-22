import { expect, test } from '@playwright/test';
import { onboard } from './helpers.ts';

// A request a service worker answers never reaches page.route, so it is kept out here.
test.use({ serviceWorkers: 'block' });

/** After a new build the old screen chunks are gone: the app reloads once instead of erroring. */
test('a screen chunk missing after a new build reloads the page instead of erroring', async ({
  page,
}) => {
  await onboard(page);
  // Settings' chunk is gone until the page loads again, as after a rebuild under an open page.
  let gone = true;
  let missed = 0;
  await page.route(/\/assets\/settings-screen-[^/]+\.js$/, (route) => {
    if (!gone) return route.continue();
    missed += 1;
    return route.fulfill({ status: 404, body: 'gone' });
  });
  // A fresh page, so Settings is not already in the module map from onboarding.
  await page.reload();
  page.once('load', () => {
    gone = false;
  });
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Settings' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  await expect(page.getByText('Unexpected Application Error')).toHaveCount(0);
  expect(missed).toBeGreaterThan(0);
});
