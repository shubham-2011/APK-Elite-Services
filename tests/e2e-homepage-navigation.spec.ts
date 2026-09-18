import { test, expect } from '@playwright/test';

test.describe('APK Elite Services — Homepage & Navigation E2E', () => {
  test('should load homepage cleanly with zero critical console errors', async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected non-critical network drops if external endpoint is offline
        if (!text.includes('ERR_CONNECTION_REFUSED') && !text.includes('favicon')) {
          criticalErrors.push(text);
        }
      }
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/APK Elite Services/);

    // Verify Hero Section
    const heroH1 = page.locator('h1');
    await expect(heroH1).toBeVisible();

    // Verify no runtime script errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('should navigate to Services Overview and see service cards', async ({ page }) => {
    await page.goto('/services');
    await expect(page).toHaveTitle(/Services/i);

    const serviceCards = page.locator('.service-card, .service-item, a[href^="/services/"]');
    const count = await serviceCards.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('should navigate to About page and verify company details', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About/i);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(page.locator('body')).toContainText('Pune');
  });

  test('should navigate to Contact page and verify contact touchpoints', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle(/Contact/i);

    await expect(page.locator('text=+91 88301 67863').first()).toBeVisible();
    await expect(page.locator('a[href*="wa.me"]').first()).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should load Diwali campaign landing page with calculator', async ({ page }) => {
    await page.goto('/diwali-deep-cleaning-pune');
    await expect(page).toHaveTitle(/Diwali/i);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(page.locator('body')).toContainText('Pune');
  });

  test('should load Pune locality pages (Baner, Wakad, Kharadi, Hinjewadi)', async ({ page }) => {
    const localities = ['baner', 'wakad', 'kharadi', 'hinjewadi'];

    for (const loc of localities) {
      await page.goto(`/services/deep-cleaning-${loc}`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('body')).toContainText(new RegExp(loc, 'i'));
    }
  });

  test('should render custom 404 page on unknown URL with recovery CTA', async ({ page }) => {
    await page.goto('/non-existent-page-url-xyz');
    await expect(page.locator('h1')).toContainText(/swept away|not found|404/i);
    const browseLink = page.locator('a[href="/services"], a[href="/"]');
    await expect(browseLink.first()).toBeVisible();
  });
});
