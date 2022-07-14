import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Home page', () => {
  test('should load home page with header and button to join a room', async ({
    page,
  }) => {
    await expect(page.locator('header')).toHaveText(/video meet/i);
    await expect(page.locator('[data-testid="btn-select-room"]')).toHaveText(
      /Join A Room/i
    );
    await page.locator('[data-testid="btn-select-room"]').click();
    await expect(page).toHaveURL(/rooms/);
  });
});
