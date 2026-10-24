import { blockGemini, stepHeading } from './helpers.ts';
import { onlyWithScreenshots, shot } from './shots.ts';
import { expect, type Page, test } from './test.ts';

/** Each welcome wizard step (P5, P6), as `wizard-<step>.png`. */
onlyWithScreenshots();

const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click();
const skip = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click();

const STEPS: {
  heading: string;
  name: string;
  full?: boolean;
  leave: (page: Page) => Promise<void>;
}[] = [
  { heading: 'Kanji Tutor', name: 'wizard-welcome', leave: (page) => skip(page, 'Start') },
  { heading: 'Your language', name: 'wizard-language', leave: next },
  {
    heading: 'Which one can you read?',
    name: 'wizard-start',
    leave: async (page) => {
      await page.getByRole('radio', { name: /I'm studying N4/ }).check();
      await next(page);
    },
  },
  {
    heading: 'Do you follow a class?',
    name: 'wizard-class',
    leave: async (page) => {
      await page.getByText('Minna no Nihongo', { exact: true }).click();
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next lesson' }).click();
      await next(page);
    },
  },
  {
    heading: 'Meet your tutor',
    name: 'wizard-ai',
    full: true,
    leave: (page) => skip(page, 'Skip'),
  },
  { heading: 'How sessions feel', name: 'wizard-feel', leave: next },
];

test('wizard: every step', async ({ page }) => {
  test.setTimeout(120_000);
  await blockGemini(page);
  await page.goto('/');
  for (const step of STEPS) {
    await expect(stepHeading(page, step.heading)).toBeVisible({ timeout: 30_000 });
    // A key skips the welcome's animation to its last frame.
    await page.keyboard.press('Shift');
    await shot(page, step.name, { full: step.full ?? false });
    await step.leave(page);
  }
  await expect(stepHeading(page, 'Your choices')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start reading' })).toBeEnabled({
    timeout: 30_000,
  });
  await shot(page, 'wizard-summary');
});
