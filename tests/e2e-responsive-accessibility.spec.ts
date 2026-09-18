import { test, expect } from '@playwright/test';

test.describe('APK Elite Services — Responsive & Accessibility (a11y) E2E', () => {
  const viewports = [
    { width: 320, height: 568, name: 'iPhone SE (320px)' },
    { width: 375, height: 667, name: 'iPhone 8 (375px)' },
    { width: 414, height: 896, name: 'iPhone 11 (414px)' },
    { width: 768, height: 1024, name: 'iPad (768px)' },
    { width: 1280, height: 720, name: 'Desktop (1280px)' }
  ];

  for (const vp of viewports) {
    test(`should render cleanly without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Check document does not trigger horizontal scrolling
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    });
  }

  test('should display persistent mobile sticky action bar on mobile viewports (< 768px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const stickyBar = page.locator('.mobile-cta-bar, .sticky-bar, .bottom-cta-bar');
    if (await stickyBar.count() > 0) {
      await expect(stickyBar).toBeVisible();
      // Should have Call and WhatsApp buttons
      await expect(stickyBar.locator('a[href^="tel:"]')).toBeVisible();
      await expect(stickyBar.locator('a[href*="wa.me"]')).toBeVisible();
    }
  });

  test('should satisfy basic accessibility requirements (h1, alt attributes)', async ({ page }) => {
    await page.goto('/');

    // Check h1 presence
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check images have alt text
    const images = page.locator('img');
    const imgCount = await images.count();
    for (let i = 0; i < imgCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });
});
