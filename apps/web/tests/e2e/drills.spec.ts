import { answerField, importKnown, onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

/** The drill prompts (R8); CSS uppercases them, the text stays as written. */
const PROMPT =
  /^(Which kanji fits\?|Which pattern fits\?|One kanji, several readings|Same part, same sound)/;

const next = (page: Page) => page.getByRole('button', { name: /^Next (sentence|word)$/ });

/** Answers the current drill: the first choice, or a typed guess, until its last step. */
async function answerDrill(page: Page) {
  const choices = page.getByRole('group', { name: 'Choices' }).getByRole('button');
  for (let step = 0; step < 4; step++) {
    const input = page.locator('form input[lang="ja"]');
    if ((await input.count()) > 0) {
      await input.pressSequentially('nu');
      await input.press('Enter');
    } else {
      await choices.first().click();
    }
    await expect(next(page)).toBeVisible();
    const label = await next(page).textContent();
    await next(page).click();
    if (label === 'Next sentence') return;
  }
}

/** Answers sentence cards wrongly until a drill shows, as drills never come first. */
async function readUntilDrill(page: Page) {
  const input = page.locator('form input[lang="ja"]');
  const intro = page.getByRole('button', { name: 'Got it' });
  for (let card = 0; card < 8 && (await page.getByText(PROMPT).count()) === 0; card++) {
    await answerField(page);
    await input.pressSequentially('nu');
    await input.press('Enter');
    await expect(page.getByText('You wrote')).toBeVisible();
    await next(page).click();
    await expect(input.or(intro).or(page.getByText(PROMPT)).first()).toBeVisible();
  }
}

/**
 * Drills mixed into a session (R8), forced with `/read?drills=1`: the first card is a sentence,
 * a drill comes after some sentences, its answer gets plain feedback, and the session goes on.
 */
test('a forced drill comes after the first sentences and is answered', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto('/read?drills=1');

  await answerField(page);
  await expect(page.getByText(PROMPT)).toHaveCount(0);
  await readUntilDrill(page);

  const prompt = page.getByText(PROMPT);
  await expect(prompt).toBeVisible();
  await answerDrill(page);
  await expect(page.getByText(PROMPT)).toHaveCount(0);
  await expect(
    page
      .locator('form input[lang="ja"]')
      .or(page.getByRole('button', { name: 'Got it' }))
      .or(page.getByText('Session done')),
  ).toBeVisible();
});
