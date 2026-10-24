import { type BrowserContext, test as base } from '@playwright/test';

export * from '@playwright/test';

/**
 * Every test starts on the same day, with time running from there: the mix, its drills and their
 * choices are seeded by the day, so a real date would give each run different cards.
 */
const TODAY = new Date('2026-10-23T12:00:00Z');

export async function startOnTheSameDay(context: BrowserContext) {
  await context.clock.install({ time: TODAY });
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await startOnTheSameDay(context);
    await use(context);
  },
});
