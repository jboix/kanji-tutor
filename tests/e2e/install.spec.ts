import { expect, type Page, test } from '@playwright/test';
import { onboard } from './helpers.ts';

/** Install help in Settings (N1b), with a faked install event and a faked iPhone. */

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const section = (page: Page) => page.getByRole('heading', { name: 'Install Kanji Tutor' });

test('the welcome points to install help, and Settings offers the browser menu', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('see Settings → Install.')).toBeVisible();
  await onboard(page);
  await page.goto('/settings/install');
  await expect(section(page)).toBeVisible();
  await expect(page.getByText(/Install app, or Add to Home screen/)).toBeVisible();
});

test('the Install button opens the browser prompt, then Install leaves Settings', async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/settings/install');
  await page.evaluate(() => {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: async () => {
        (window as unknown as { prompted: boolean }).prompted = true;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: 'Install', exact: true }).click();
  await expect(section(page)).toBeHidden();
  // Installed (D121): the category has nothing left to say, so its screen goes back to the list.
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('link', { name: /^Install/ })).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { prompted: boolean }).prompted)).toBe(
    true,
  );
});

test.describe('on an iPhone', () => {
  test.use({ userAgent: IPHONE });

  test('gives the Share steps, and leaves Settings when opened from the home screen', async ({
    page,
  }) => {
    await onboard(page);
    await page.goto('/settings/install');
    await expect(page.getByText(/then Add to Home Screen/)).toBeVisible();
    await expect(page.getByRole('img', { name: 'Share' })).toBeVisible();
    await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
    await page.reload();
    // Installed (D121): a direct link lands on the list, which has no Install row.
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Install/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^About/ })).toBeVisible();
  });
});

test.describe('in display-mode: standalone (an installed app on Android or desktop)', () => {
  test('Settings has no Install category, and Today no install banner', async ({ page }) => {
    await onboard(page);
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = (query: string) =>
        query === '(display-mode: standalone)'
          ? ({ ...real(query), matches: true, media: query } as MediaQueryList)
          : real(query);
    });
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Install the app' })).toHaveCount(0);
    await page.goto('/settings');
    await expect(page.getByRole('link', { name: /^Backup and storage/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Install/ })).toHaveCount(0);
  });
});

test.describe('the install banner (N1d)', () => {
  const banner = (page: Page) => page.getByRole('complementary', { name: 'Install the app' });

  test('shows on Today in a fresh context, and is gone after Close and a reload', async ({
    page,
  }) => {
    await onboard(page);
    await expect(banner(page)).toBeVisible();
    await expect(banner(page).getByText(/Install app, or Add to Home screen/)).toBeVisible();
    await page.getByRole('button', { name: "Close, and don't offer again" }).click();
    await expect(banner(page)).toBeHidden();
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(banner(page)).toBeHidden();
  });
});
