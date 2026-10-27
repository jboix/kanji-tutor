import { onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

/** In the wild with the mock tutor: a photo of a station sign, read when asked, kanji outlined. */

/** A station sign drawn in the page, as a JPEG the file input takes. */
async function signPhoto(page: Page): Promise<Buffer> {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const g = canvas.getContext('2d');
    if (!g) return '';
    g.fillStyle = '#9a9a96';
    g.fillRect(0, 0, 800, 600);
    g.fillStyle = '#f8f7f2';
    g.fillRect(80, 120, 640, 360);
    g.fillStyle = '#24507e';
    g.fillRect(80, 120, 640, 30);
    g.fillStyle = '#1b1d20';
    g.font = '90px serif';
    g.fillText('大阪駅', 230, 245);
    g.font = '56px serif';
    g.fillText('改札口　東出口 →', 120, 375);
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1] ?? '';
  });
  return Buffer.from(data, 'base64');
}

test('a photo is read when asked: known kanji solid, new ones dashed, new words to add', async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/wild');
  await expect(page.getByRole('heading', { name: 'In the wild' })).toBeVisible();
  await page.getByTestId('wild-library').setInputFiles({
    name: 'sign.jpg',
    mimeType: 'image/jpeg',
    buffer: await signPhoto(page),
  });
  await page.getByRole('button', { name: /^Read this photo/ }).click();
  await expect(
    page.getByRole('heading', { name: /^You can read \d+ of the 8 kanji here\.$/ }),
  ).toBeVisible();
  const tutor = page.getByRole('note', { name: 'What the tutor read' });
  await expect(tutor).toContainText('Station sign');
  await expect(page.locator('figure span[style*="top"]')).toHaveCount(9);
  await expect(page.getByRole('button', { name: /^Ask/ })).toBeInViewport();
});
