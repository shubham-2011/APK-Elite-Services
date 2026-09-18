import { test, expect } from '@playwright/test';

test.describe('Deep QA & Bug Hunter Suite', () => {

  test('1. Crawl all internal links and verify zero broken links / 404s', async ({ page }) => {
    const visited = new Set<string>();
    const toVisit = ['/', '/about', '/services', '/contact', '/privacy-policy'];
    const brokenLinks: { source: string; target: string; status: number }[] = [];
    const consoleErrors: { url: string; error: string }[] = [];

    page.on('pageerror', (err) => {
      consoleErrors.push({ url: page.url(), error: err.message });
    });

    for (const path of toVisit) {
      if (visited.has(path)) continue;
      visited.add(path);

      const res = await page.goto(path);
      const status = res?.status() || 0;
      if (status >= 400) {
        brokenLinks.push({ source: 'navigation', target: path, status });
      }

      // Collect all internal links
      const hrefs = await page.$$eval('a[href]', (links) =>
        links
          .map((a) => a.getAttribute('href') || '')
          .filter((h) => h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/#'))
      );

      for (const h of hrefs) {
        const clean = h.split('?')[0].split('#')[0];
        if (clean && !visited.has(clean) && !toVisit.includes(clean)) {
          toVisit.push(clean);
        }
      }
    }

    console.log(`Crawled ${visited.size} internal routes:`, Array.from(visited));
    expect(brokenLinks, `Found broken links: ${JSON.stringify(brokenLinks)}`).toHaveLength(0);
    expect(consoleErrors, `Found uncaught page errors: ${JSON.stringify(consoleErrors)}`).toHaveLength(0);
  });

  test('2. Verify all image assets load with status 200 and naturalWidth > 0', async ({ page }) => {
    const failedImages: { pageUrl: string; src: string; reason: string }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.match(/\.(png|jpg|jpeg|webp|svg|ico)$/i)) {
        if (response.status() >= 400) {
          failedImages.push({ pageUrl: page.url(), src: url, reason: `HTTP ${response.status()}` });
        }
      }
    });

    const sampleRoutes = ['/', '/about', '/services', '/contact', '/services/deep-cleaning'];
    for (const route of sampleRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {/* ignore on slow mobile */});

      // Scroll smoothly down the page to trigger any native lazy-loaded images
      await page.evaluate(async () => {
        const distance = 400;
        const delay = 50;
        while (document.scrollingElement && document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight) {
          document.scrollingElement.scrollBy(0, distance);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      });
      await page.waitForTimeout(400);

      const brokenImgs = await page.$$eval('img', (imgs) =>
        imgs
          .filter((img) => !img.complete || img.naturalWidth === 0)
          .map((img) => img.src || img.getAttribute('src') || 'no-src')
      );

      for (const src of brokenImgs) {
        failedImages.push({ pageUrl: route, src, reason: 'naturalWidth is 0 / incomplete' });
      }
    }

    expect(failedImages, `Failed images: ${JSON.stringify(failedImages)}`).toHaveLength(0);
  });

  test('3. Test Contact Form validation, invalid prevention, and smooth submission', async ({ page }) => {
    await page.goto('/contact');

    const submitBtn = page.locator('.btn-submit');
    // Initially empty form must have disabled submit button
    await expect(submitBtn).toBeDisabled();

    // Fill valid name, invalid short phone
    await page.locator('input[name="name"]').fill('QA Test User');
    await page.locator('input[name="phone"]').fill('12345');
    await page.locator('select[name="service"]').selectOption({ index: 1 });
    await page.locator('select[name="locality"]').selectOption({ index: 1 });

    // Submit button must remain disabled
    await expect(submitBtn).toBeDisabled();

    // Provide valid 10-digit mobile number
    await page.locator('input[name="phone"]').fill('9876543210');
    // Button must now be enabled
    await expect(submitBtn).toBeEnabled();

    // Submit the form
    await submitBtn.click();

    // Verify in-page success confirmation appears without page reload or disruption
    const successState = page.locator('.success-state');
    await expect(successState).toBeVisible({ timeout: 5000 });
    await expect(successState).toContainText('Enquiry Submitted Successfully');

    // Confirm that action links (WhatsApp, Email, Reset) are visible on the success state
    // Scope to .success-state to avoid strict-mode clash with hero .btn-whatsapp
    await expect(page.locator('.success-state .btn-whatsapp')).toBeVisible();
    await expect(page.locator('.success-state .btn-call')).toBeVisible();
  });

  test('4. Test CMS Authentication with apk2026, Lead Status Transition, Notes, and CSV Export', async ({ page }) => {
    await page.goto('/cms');

    // Test wrong PIN rejection
    const pinInput = page.locator('#pinInput');
    await pinInput.fill('wrongpin99');
    await page.locator('.btn-unlock').click();

    // Should show error and remain on pin screen
    await expect(page.locator('.error-msg')).toBeVisible();
    await expect(page.locator('.auth-card')).toBeVisible();

    // Correct PIN login with 7-character apk2026 (tests that maxlength allows 7+ chars)
    await pinInput.fill('apk2026');
    await page.locator('.btn-unlock').click();

    // Verify dashboard displays
    await expect(page.locator('.dash-header')).toBeVisible();

    // Add a test lead via "+ Add Test Lead"
    const addTestBtn = page.locator('button.btn-filter.sample');
    await addTestBtn.click();

    // Verify lead card rendered
    const leadCard = page.locator('.lead-card').first();
    await expect(leadCard).toBeVisible();

    // Check attribution badges are rendered on the lead card
    const badgeRow = leadCard.locator('.attr-badges-row');
    await expect(badgeRow).toBeVisible();

    // Test status change dropdown
    const statusSelect = leadCard.locator('select.status-select');
    await statusSelect.selectOption('CONTACTED');
    await expect(statusSelect).toHaveValue('CONTACTED');

    // Test adding a staff note
    const noteInput = leadCard.locator('.inline-note-input');
    const addNoteBtn = leadCard.locator('.btn-add-note');
    await noteInput.fill('Test note from automated bug hunter');
    await addNoteBtn.click();
    await expect(leadCard.locator('.notes-list')).toContainText('Test note from automated bug hunter');

    // Test CSV export button doesn't throw or crash
    await page.locator('button.btn-filter.export').click();
    await expect(page.locator('.dash-header')).toBeVisible();
  });

  test('5. Test Footmark Telemetry & Rage Click Detection', async ({ page }) => {
    await page.goto('/');

    // Simulate rage clicks (rapid clicks in the same spot)
    const welText = page.locator('.wel');
    await welText.click({ clickCount: 4, delay: 50 });

    // Check telemetry queue in localStorage
    const telemetryEvents = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_telemetry_events_v1');
      return raw ? JSON.parse(raw) : [];
    });

    // Telemetry events array should be populated
    expect(Array.isArray(telemetryEvents)).toBe(true);
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(1);

    // Verify attribution service state
    const attr = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_attr_v1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(attr).not.toBeNull();
    expect(attr.landing_page).toBe('/');
    expect(attr.visit_count).toBeGreaterThanOrEqual(1);
  });

  test('6. Test WhatsApp dynamic ref links across viewports', async ({ page }) => {
    // Navigate with UTM parameters
    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=summer_clean&gclid=test_gclid_123');

    // Check floating WhatsApp href
    const floatWa = page.locator('a.icon.whatsapp');
    const href = await floatWa.getAttribute('href');
    expect(href).toContain('wa.me');
    expect(decodeURIComponent(href || '')).toContain('[Ref: google/summer_clean/GoogleAds');

    // Check mobile sticky CTA WhatsApp href
    const stickyWa = page.locator('a.cta-whatsapp');
    const stickyHref = await stickyWa.getAttribute('href');
    expect(stickyHref).toContain('wa.me');
    expect(decodeURIComponent(stickyHref || '')).toContain('[Ref: google/summer_clean/GoogleAds');
  });

});
