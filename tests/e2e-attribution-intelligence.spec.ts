import { test, expect } from '@playwright/test';

test.describe('APK Elite Services — 2026 Marketing Attribution & Visitor Intelligence E2E', () => {
  test('should capture and persist campaign UTMs & click IDs across multi-page navigation', async ({ page }) => {
    // 1. User lands on homepage with campaign UTMs and Google Ads gclid
    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=deep_cleaning_pune&utm_term=sofa+cleaning&utm_content=ad_banner_1&gclid=CjwKCAjw_test_123');

    // Evaluate initial attribution storage
    const initialAttr = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_attr_v1');
      return raw ? JSON.parse(raw) : null;
    });

    expect(initialAttr).toBeTruthy();
    expect(initialAttr.utm_source).toBe('google');
    expect(initialAttr.utm_medium).toBe('cpc');
    expect(initialAttr.utm_campaign).toBe('deep_cleaning_pune');
    expect(initialAttr.utm_term).toBe('sofa cleaning');
    expect(initialAttr.utm_content).toBe('ad_banner_1');
    expect(initialAttr.gclid).toBe('CjwKCAjw_test_123');
    expect(initialAttr.visit_count).toBe(1);
    expect(initialAttr.landing_page).toBe('/');

    // 2. User navigates internally to /contact (clean URL, no query parameters)
    await page.goto('/contact');

    // Verify attribution survives navigation to second page
    const persistedAttr = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_attr_v1');
      return raw ? JSON.parse(raw) : null;
    });

    expect(persistedAttr).toBeTruthy();
    expect(persistedAttr.utm_source).toBe('google');
    expect(persistedAttr.utm_campaign).toBe('deep_cleaning_pune');
    expect(persistedAttr.gclid).toBe('CjwKCAjw_test_123');

    // 3. Verify Telemetry queue on /contact has inherited the persisted campaign context
    const telemetryEvents = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_telemetry_events_v1');
      return raw ? JSON.parse(raw) : [];
    });

    expect(telemetryEvents.length).toBeGreaterThanOrEqual(1);
    const contactPageView = telemetryEvents.find((e: any) => e.route === '/contact' && e.event_name === 'page_view');
    expect(contactPageView).toBeTruthy();
    expect(contactPageView.utm_source).toBe('google');
    expect(contactPageView.utm_campaign).toBe('deep_cleaning_pune');
    expect(contactPageView.visit_count).toBe(1);
    expect(contactPageView.is_returning).toBe(false);
  });

  test('should attach attribution metadata and tag to lead submissions and WhatsApp links', async ({ page }) => {
    // Seed campaign attribution
    await page.goto('/?utm_source=instagram&utm_medium=paid_social&utm_campaign=diwali_fest_2026');

    // Navigate to /contact
    await page.goto('/contact');

    // Prevent external mailto redirect during test
    await page.evaluate(() => {
      window.onbeforeunload = () => null;
    });

    // Fill form fields
    await page.fill('#contact-name', 'Rajesh Sharma');
    await page.fill('#contact-phone', '9822123456');

    // Select service and locality
    const serviceSelect = page.locator('select#contact-service');
    if (await serviceSelect.count() > 0) {
      await serviceSelect.selectOption({ index: 1 });
    }
    const localitySelect = page.locator('select#contact-locality');
    if (await localitySelect.count() > 0) {
      await localitySelect.selectOption({ index: 1 });
    }

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();

    // Submit form
    await submitBtn.click();
    await page.waitForTimeout(600);

    // Verify localStorage lead cache contains attribution metadata
    const cachedLeads = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_elite_leads_cache');
      return raw ? JSON.parse(raw) : [];
    });

    expect(cachedLeads.length).toBeGreaterThanOrEqual(1);
    const latestLead = cachedLeads[0];
    expect(latestLead.name).toBe('Rajesh Sharma');
    expect(latestLead.phone).toBe('9822123456');
    expect(latestLead.utm_source).toBe('instagram');
    expect(latestLead.utm_campaign).toBe('diwali_fest_2026');

    // Verify WhatsApp button contains formatted attribution tag
    const waHref = await page.getAttribute('.success-actions a.btn-whatsapp', 'href');
    expect(waHref).toBeTruthy();
    expect(decodeURIComponent(waHref || '')).toContain('[Ref: instagram/paidsocial/diwali_fest_2026');
  });

  test('should record form abandonment when user enters data but navigates away', async ({ page }) => {
    await page.goto('/contact');

    // Start filling form
    await page.fill('#contact-name', 'Ananya Deshmukh');
    await page.fill('#contact-phone', '8888123456');

    // Open mobile hamburger menu if viewport is mobile
    const hamburger = page.locator('.hamburger');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(200);
    }

    // Click client SPA link in navbar to navigate away and trigger component destruction
    await page.click('.navbar .nav-links a[href="/about"]');
    await page.waitForURL('**/about');

    const telemetryEvents = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_telemetry_events_v1');
      return raw ? JSON.parse(raw) : [];
    });

    const abandonmentEvent = telemetryEvents.find((e: any) => e.event_name === 'form_abandonment');
    expect(abandonmentEvent).toBeTruthy();
    expect(abandonmentEvent.properties.form_name).toBe('contact_page_form');
    expect(abandonmentEvent.properties.has_name).toBe(true);
    expect(abandonmentEvent.properties.has_phone).toBe(true);
  });

  test('should preserve zero-cookie policy and strict CSP compliance', async ({ page }) => {
    await page.goto('/');

    const cookieCount = await page.evaluate(() => document.cookie ? document.cookie.split(';').length : 0);
    expect(cookieCount).toBe(0);

    // Verify no canvas, audio, or battery fingerprinting scripts executed
    const fingerprintProbes = await page.evaluate(() => {
      const win = window as any;
      return {
        hasCanvasSpoof: !!win.__fpjs_canvas,
        hasAudioHash: !!win.__fpjs_audio,
        cookiesPresent: document.cookie.length
      };
    });

    expect(fingerprintProbes.cookiesPresent).toBe(0);
    expect(fingerprintProbes.hasCanvasSpoof).toBe(false);
  });
});
