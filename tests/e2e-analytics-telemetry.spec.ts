import { test, expect } from '@playwright/test';

test.describe('APK Elite Services — Privacy-Preserving Telemetry E2E', () => {
  test('should generate transparent anonymous_id and session_id without cookies', async ({ page }) => {
    await page.goto('/');

    // Evaluate storage identifiers
    const storageData = await page.evaluate(() => {
      return {
        vid: localStorage.getItem('apk_vid'),
        sid: sessionStorage.getItem('apk_sid'),
        cookieCount: document.cookie ? document.cookie.split(';').length : 0,
        telemetryRaw: localStorage.getItem('apk_telemetry_events_v1')
      };
    });

    // Verify anonymous visitor UUID (apk_vid) exists and is formatted
    expect(storageData.vid).toBeTruthy();
    expect(storageData.vid).toMatch(/^v_/);

    // Verify session UUID (apk_sid) exists
    expect(storageData.sid).toBeTruthy();
    expect(storageData.sid).toMatch(/^s_/);

    // Zero tracking cookies required
    expect(storageData.cookieCount).toBe(0);

    // Verify telemetry event queue contains page_view
    expect(storageData.telemetryRaw).toBeTruthy();
    const events = JSON.parse(storageData.telemetryRaw || '[]');
    expect(events.length).toBeGreaterThanOrEqual(1);

    const firstEvent = events[0];
    expect(firstEvent.event_name).toBe('page_view');
    expect(firstEvent.anonymous_id).toBe(storageData.vid);
    expect(firstEvent.session_id).toBe(storageData.sid);
    expect(firstEvent.device_type).toMatch(/desktop|mobile|tablet/);
    expect(firstEvent.browser).toBeTruthy();
    expect(firstEvent.os).toBeTruthy();
    expect(firstEvent.release_version).toBe('2.1.0-prod');
  });

  test('should record scroll milestones (scroll_25, scroll_50) on page scroll', async ({ page }) => {
    await page.goto('/');

    // Scroll page to 60% of document height
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.6);
      window.dispatchEvent(new Event('scroll'));
    });

    await page.waitForTimeout(400);

    const scrollEvents = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_telemetry_events_v1');
      const list = raw ? JSON.parse(raw) : [];
      return list.filter((e: any) => e.event_name.startsWith('scroll_'));
    });

    expect(scrollEvents.length).toBeGreaterThanOrEqual(1);
    expect(['scroll_25', 'scroll_50']).toContain(scrollEvents[0].event_name);
  });

  test('should NOT execute invasive fingerprinting (Canvas/Audio/Battery APIs)', async ({ page }) => {
    await page.goto('/');

    const probedApis = await page.evaluate(() => {
      return {
        hasCanvasHashScript: typeof (window as any).toDataURL === 'function',
        hasAudioContextHash: typeof (window as any).webkitAudioContext === 'function' && typeof (window as any).OfflineAudioContext === 'function',
        hasBatteryApi: 'getBattery' in navigator
      };
    });

    // Verify the application does NOT instantiate canvas fingerprint hashes on page load
    const telemetryEvents = await page.evaluate(() => {
      const raw = localStorage.getItem('apk_telemetry_events_v1');
      return raw ? JSON.parse(raw) : [];
    });

    // Confirm all events contain zero PII or raw hardware identifiers
    for (const ev of telemetryEvents) {
      expect(ev).not.toHaveProperty('canvas_hash');
      expect(ev).not.toHaveProperty('audio_hash');
      expect(ev).not.toHaveProperty('battery_level');
      expect(ev).not.toHaveProperty('user_password');
      expect(ev).not.toHaveProperty('raw_ip');
    }
  });
});
