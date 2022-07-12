import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/rooms');
});

test.describe('Media Preview', () => {
  test('should load media preview page', async ({ page }) => {
    await expect(page.locator('#preview-video')).not.toBeFalsy();
    await expect(
      page.locator('[data-testid="input-room-uuid"]')
    ).not.toBeFalsy();
    await expect(
      page.locator('[data-testid="input-room-uuid"]')
    ).not.toBeFalsy();
    await expect(page.locator('[data-testid="btn-join-room"]')).not.toBeFalsy();
  });

  test('should enable video', async ({ page }) => {
    await expect(page.locator('#video-preview')).not.toBeVisible();
    await expect(page.locator('div > span >> text="Start video"')).toHaveText(
      /start video/i
    );
    await page.locator('div > span >> text="Start video"').click();

    await expect(page.locator('#video-preview')).toBeVisible();
    await expect(page.locator('div > span >> text="Stop video"')).toHaveText(
      /stop video/i
    );
  });

  test('should enable audio', async ({ page }) => {
    await expect(page.locator('div > span >> text="Unmute mic"')).toHaveText(
      /unmute mic/i
    );
    await page.locator('div > span >> text="Unmute mic"').click();

    await expect(page.locator('div > span >> text="Mute mic"')).toHaveText(
      /mute mic/i
    );
  });

  test('should not enable join room button if room id was not provided', async ({
    page,
  }) => {
    await expect(page.locator('[data-testid="input-room-uuid"]')).toBeEmpty();

    await expect(
      page.locator('[data-testid="btn-join-room"]')
    ).not.toBeEnabled();
  });

  test('should join into the meeting and show feed element', async ({
    page,
  }) => {
    const ROOM_ID = 'e65ff637-dee4-4999-9310-6cc6190fc76d';
    await page.locator('[data-testid="input-room-uuid"]').fill(ROOM_ID);
    const feedName = await page
      .locator('[data-testid="input-username"]')
      .inputValue();

    const VIDEO_ELEMENT_ID = `video-feed-${feedName
      ?.toLowerCase()
      .replace(' ', '-')}`;

    await page.locator('[data-testid="btn-join-room"]').click();
    await expect(page.locator('h1')).toHaveText(ROOM_ID);
    await expect(
      page.locator(`[data-testid="${VIDEO_ELEMENT_ID}"]`)
    ).toBeVisible();
  });
});
