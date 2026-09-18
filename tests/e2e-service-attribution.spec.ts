import { test, expect } from '@playwright/test';

test.describe('APK Elite Services — Service Pages & Conversion Attribution E2E', () => {
  test('should display Sofa Cleaning page with transparent pricing and attribution', async ({ page }) => {
    await page.goto('/services/sofa-cleaning');
    await expect(page).toHaveTitle(/Sofa/i);

    // Verify H1
    const h1 = page.locator('h1');
    await expect(h1).toContainText(/Sofa/i);

    // Verify Starting Price
    const priceTag = page.locator('.price-val').first();
    await expect(priceTag).toBeVisible();
    await expect(priceTag).toContainText(/₹/);

    // Verify WhatsApp CTA carries service attribution reference
    const waButton = page.locator('a.cta-whatsapp, a[href*="wa.me"]').first();
    await expect(waButton).toBeVisible();
    const waHref = await waButton.getAttribute('href');
    expect(waHref).toContain('wa.me/918830167863');
    const decodedWa = decodeURIComponent((waHref || '').replace(/\+/g, ' '));
    expect(decodedWa).toContain('Sofa');
    expect(decodedWa).toContain('[Ref: Web/sofa-cleaning]');

    // Verify Direct Call CTA
    const callButton = page.locator('a.cta-call, a[href^="tel:"]').first();
    await expect(callButton).toBeVisible();
    const callHref = await callButton.getAttribute('href');
    expect(callHref).toBe('tel:+918830167863');
  });

  test('should display Deep Cleaning page with pre-filled WhatsApp attribution', async ({ page }) => {
    await page.goto('/services/deep-cleaning');
    await expect(page).toHaveTitle(/Deep Cleaning/i);

    const waButton = page.locator('a.cta-whatsapp, a[href*="wa.me"]').first();
    await expect(waButton).toBeVisible();
    const waHref = await waButton.getAttribute('href');
    const decodedWa = decodeURIComponent((waHref || '').replace(/\+/g, ' '));
    expect(decodedWa).toContain('Deep Cleaning');
    expect(decodedWa).toContain('[Ref: Web/deep-cleaning]');
  });

  test('should display Water Tank Cleaning with certified hygiene details', async ({ page }) => {
    await page.goto('/services/water-tank-cleaning');
    await expect(page).toHaveTitle(/Tank/i);

    const waButton = page.locator('a.cta-whatsapp, a[href*="wa.me"]').first();
    await expect(waButton).toBeVisible();
    const waHref = await waButton.getAttribute('href');
    const decodedWa = decodeURIComponent((waHref || '').replace(/\+/g, ' '));
    expect(decodedWa).toContain('Tank');
    expect(decodedWa).toContain('[Ref: Web/water-tank-cleaning]');
  });

  test('should display Office Cleaning with commercial janitorial context', async ({ page }) => {
    await page.goto('/services/office-cleaning');
    await expect(page).toHaveTitle(/Office/i);

    const waButton = page.locator('a.cta-whatsapp, a[href*="wa.me"]').first();
    await expect(waButton).toBeVisible();
    const waHref = await waButton.getAttribute('href');
    const decodedWa = decodeURIComponent((waHref || '').replace(/\+/g, ' '));
    expect(decodedWa).toContain('Office');
    expect(decodedWa).toContain('[Ref: Web/office-cleaning]');
  });
});
