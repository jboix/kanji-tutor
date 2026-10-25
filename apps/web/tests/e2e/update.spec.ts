import { onboard } from './helpers.ts';
import { startNextBuildServer } from './next-build-server.ts';
import { expect, startOnTheSameDay, test } from './test.ts';

/**
 * N1e: a new build's service worker waits instead of taking over. Home offers it with its
 * version and notes, Later moves it to Settings → About, and Update now reloads into it.
 */
for (const visit of ['a later visit', 'the first visit'] as const) {
  test(`a new version waits on Home until Update now, then reloads into it (${visit})`, async ({
    browser,
  }, testInfo) => {
    const server = await startNextBuildServer();
    // A context of its own at the server's address, at the project's phone size.
    const { viewport, deviceScaleFactor, isMobile, hasTouch } = testInfo.project.use;
    const context = await browser.newContext({
      baseURL: server.url,
      viewport: viewport ?? null,
      deviceScaleFactor: deviceScaleFactor ?? 1,
      isMobile: isMobile ?? false,
      hasTouch: hasTouch ?? false,
    });
    await startOnTheSameDay(context);
    const page = await context.newPage();
    await onboard(page);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    if (visit === 'a later visit') {
      // A reload puts the page under the service worker's control.
      await page.reload();
      await expect
        .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
        .toBe(true);
    }

    server.deployNext({ version: '9.9.9', notes: ['Something new to read'] });
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())?.update();
    });

    const card = page.getByRole('region', { name: 'A new version' });
    await expect(card).toContainText('9.9.9 · you have');
    await expect(card).toContainText('Something new to read');
    await card.getByRole('button', { name: 'Later' }).click();
    await expect(card).toHaveCount(0);

    const nav = page.getByRole('navigation', { name: 'Main' });
    await nav.getByRole('link', { name: 'Settings, a new version is ready' }).click();
    await page.getByRole('link', { name: /^About/ }).click();
    await expect(card).toContainText('9.9.9 is ready');
    await expect(page.getByRole('heading', { name: 'Trouble updating?' })).toBeVisible();

    const reloaded = page.waitForEvent('load');
    await card.getByRole('button', { name: 'Update now' }).click();
    await reloaded;
    await expect(page.getByRole('heading', { name: 'Trouble updating?' })).toBeVisible();
    await expect(card).toHaveCount(0);
    await context.close();
    await server.close();
  });
}
