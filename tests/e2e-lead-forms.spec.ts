import { test, expect } from '@playwright/test';

test.describe('APK Elite Services — Forms & Negative QA E2E', () => {
  test('should open quote modal from navbar and validate required fields', async ({ page }) => {
    await page.goto('/');

    // On mobile screens, hamburger menu needs to be opened to access navbar links
    const hamburger = page.locator('.hamburger');
    if (await hamburger.isVisible()) {
      await hamburger.click();
    }

    // Click 'Get Quote' in navbar
    const quoteBtn = page.locator('.nav-quote-btn');
    await expect(quoteBtn).toBeVisible();
    await quoteBtn.click();

    // Verify modal overlay appears
    const modal = page.locator('.modal-card');
    await expect(modal).toBeVisible();

    // Submit button should be disabled initially
    const submitBtn = modal.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Test Negative QA: enter 5-digit phone number (invalid Indian mobile)
    const nameInput = modal.locator('input#modal-name');
    const phoneInput = modal.locator('input#modal-phone');

    await nameInput.fill('Rahul Deshmukh');
    await phoneInput.fill('98765');
    await phoneInput.blur();

    // Field error should display and submit button remains disabled
    await expect(modal.locator('.field-error-msg')).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // Test Valid Input: complete 10-digit number starting with 6-9
    await phoneInput.fill('9876543210');
    await expect(submitBtn).toBeEnabled();

    // Test Unicode & Emoji input in message
    const msgInput = modal.locator('textarea#modal-message');
    await msgInput.fill('पुणे 3 BHK Deep Cleaning 🧹✨ Urgent weekend slot please');

    // Close modal
    const closeBtn = modal.locator('.close-btn');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('should validate contact page inquiry form and prevent empty submissions', async ({ page }) => {
    await page.goto('/contact');

    const form = page.locator('form');
    await expect(form).toBeVisible();

    const submitBtn = form.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Enter name
    const nameInput = form.locator('input#contact-name');
    await nameInput.fill('Anand Kulkarni');

    // Enter invalid phone
    const phoneInput = form.locator('input#contact-phone');
    await phoneInput.fill('12345');
    await phoneInput.blur();

    // Red error text should appear
    await expect(form.locator('.err-msg')).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // Correct phone to valid 10-digit Indian number
    await phoneInput.fill('9822012345');

    // Select service and locality
    const serviceSelect = form.locator('select#contact-service');
    if (await serviceSelect.count() > 0) {
      await serviceSelect.selectOption({ index: 1 });
    }

    const localitySelect = form.locator('select#contact-locality');
    if (await localitySelect.count() > 0) {
      await localitySelect.selectOption({ index: 1 });
    }

    // Submit button should now be enabled
    await expect(submitBtn).toBeEnabled();
  });
});
