import { onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/** A kanji's story: its parts always, the tutor's story only when asked, then another take. */

test("a kanji's page sums its parts, and the tutor tells its story when asked", async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/kanji/%E5%BE%85');
  const story = page.getByRole('region', { name: 'Its story' });
  await expect(story).toContainText('彳');
  await expect(story).toContainText('寺');
  await story.getByRole('button', { name: /^Ask the tutor for its story/ }).click();
  const note = story.getByRole('note', { name: 'Its story, from the tutor' });
  await expect(note).toContainText('A way to remember it');
  await expect(note).toContainText('Readings checked in the dictionary');
  await expect(note.locator('rt').first()).toHaveText('まいにち');
  await note.getByRole('button', { name: 'Translation' }).click();
  await expect(note).toContainText('I read a Japanese book every day.');
  await note.getByRole('button', { name: /^Another story/ }).click();
  await expect(story.getByRole('note', { name: 'Its story, from the tutor' })).toContainText(
    'Trace the parts one by one',
  );
});
