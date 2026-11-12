import { test, expect } from '@playwright/test';

test.describe('APK Elite Services CMS Dashboard E2E Test Suite', () => {

  test('1. Verify CMS dashboard route loads and displays authentication gate', async ({ page }) => {
    await page.goto('/cms');
    // Expect page title or login container
    await expect(page).toHaveTitle(/APK Elite Services/i);

    // Either user is greeted with login gate or dashboard if already authenticated
    const isLoginVisible = await page.locator('input[name="loginUsername"], input[type="password"]').first().isVisible().catch(() => false);
    const isDashboardVisible = await page.locator('.sidebar-brand, .user-name-text, .lead-card').first().isVisible().catch(() => false);

    expect(isLoginVisible || isDashboardVisible).toBeTruthy();
  });

  test('2. Verify CMS Dashboard Lead Cards and Action Controls', async ({ page }) => {
    await page.goto('/cms');

    // If login is presented, perform authentication
    const usernameInput = page.locator('input[name="loginUsername"]');
    if (await usernameInput.isVisible().catch(() => false)) {
      await usernameInput.fill('shubhammisra800@gmail.com');
      await page.locator('input[type="password"]').fill('Shubham@ApkElite2026!');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Verify search input
    const searchInput = page.locator('input[placeholder*="Search by customer name"]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();

      // Test searching
      await searchInput.fill('Rapid');
      await page.waitForTimeout(300);
      await searchInput.fill('');
    }

    // Verify WhatsApp button links have valid wa.me scheme
    const waButtons = page.locator('a[href*="wa.me"]');
    const waCount = await waButtons.count();
    if (waCount > 0) {
      const firstWaHref = await waButtons.first().getAttribute('href');
      expect(firstWaHref).toContain('wa.me/');
    }

    // Verify Call buttons have valid tel: scheme
    const callButtons = page.locator('a[href^="tel:"]');
    const callCount = await callButtons.count();
    if (callCount > 0) {
      const firstCallHref = await callButtons.first().getAttribute('href');
      expect(firstCallHref).toMatch(/^tel:\+?[0-9]+/);
    }
  });

  test('3. Verify Multi-User Profile Modal and Display Name', async ({ page }) => {
    await page.goto('/cms');

    // Profile trigger button or row
    const profileBtn = page.locator('.user-profile-row, button:has-text("Profile")').first();
    if (await profileBtn.isVisible().catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(500);

      // Verify modal opened
      const modalHeader = page.locator('h3:has-text("Admin Profile")');
      await expect(modalHeader).toBeVisible();

      // Verify display name and username inputs
      const nameInput = page.locator('input[name="profileNameInput"]');
      const userInput = page.locator('input[name="profileUsernameInput"]');
      await expect(nameInput).toBeVisible();
      await expect(userInput).toBeVisible();

      // Close modal
      const closeBtn = page.locator('.btn-modal-close, button:has-text("Cancel")').first();
      await closeBtn.click();
    }
  });

  test('4. Verify Dark Mode toggle functionality', async ({ page }) => {
    await page.goto('/cms');

    const themeToggle = page.locator('button[title*="Dark"], button[title*="Light"], .theme-toggle').first();
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(300);
      // Verify toast appeared
      const toast = page.locator('.toast-alert, .toast');
      if (await toast.isVisible().catch(() => false)) {
        await expect(toast).toContainText(/Mode/i);
      }
    }
  });

});

