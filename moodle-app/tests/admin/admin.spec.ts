import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Admin Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#email', 'admin@gmail.com');
    await page.fill('#password', 'secureadminpassword');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/login') && res.status() === 200),
      page.click('button[type="submit"]')
    ]);
    await page.waitForURL(/\/admin/);
  });

  test('should navigate to Teachers page', async ({ page }) => {
    await page.click('text=Teachers');
    await expect(page).toHaveURL(/.*activePage=teachers/);
    await expect(page.locator('h1')).toHaveText('Teachers');
  });

  test('should navigate to Students page', async ({ page }) => {
    await page.click('text=Students');
    await expect(page).toHaveURL(/.*activePage=students/);
    await expect(page.locator('h1')).toHaveText('Students');
  });

  test('should navigate to Lectures page', async ({ page }) => {
    await page.click('text=Lectures');
    await expect(page).toHaveURL(/.*activePage=lectures/);
    await expect(page.locator('h1')).toHaveText('Lectures');
  });


  test('should logout successfully', async ({ page }) => {
    await page.click('text=Logout');
    await expect(page.locator('button', { hasText: 'Logout' })).toBeVisible();
  });
});
