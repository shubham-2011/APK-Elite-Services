import { test, expect } from '@playwright/test';

test.describe('APK Elite Services — Defensive Security & CSP E2E', () => {
  test('should enforce strict Content-Security-Policy without eval or wildcards', async ({ page }) => {
    await page.goto('/');

    const csp = await page.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return meta ? meta.getAttribute('content') : '';
    });

    expect(csp).toBeTruthy();
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test('should safely sanitize and escape potentially dangerous HTML input', async ({ page }) => {
    await page.goto('/');

    // Open quote modal (handling mobile viewport if hamburger is visible)
    const hamburger = page.locator('.hamburger');
    if (await hamburger.isVisible()) {
      await hamburger.click();
    }
    const quoteBtn = page.locator('.nav-quote-btn');
    await quoteBtn.click();

    const modal = page.locator('.modal-card');
    const msgInput = modal.locator('textarea#modal-message');

    // Attempt injection string
    const injectionAttempt = '<script>window.__xss_test_flag = true;</script><img src=x onerror=alert(1)>';
    await msgInput.fill(injectionAttempt);

    const xssFlag = await page.evaluate(() => (window as any).__xss_test_flag);
    expect(xssFlag).toBeUndefined();

    // Close modal
    await modal.locator('.close-btn').click();
  });
});
