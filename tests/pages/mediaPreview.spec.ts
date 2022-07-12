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
    await expect(page.locator('div > span >> text="Start video"')).toHaveText(
      /start video/i
    );
    await page.locator('div > span >> text="Start video"').click();
    await expect(page.locator('div > span >> text="Stop video"')).toHaveText(
      /stop video/i
    );
  });
});
