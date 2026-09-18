import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AttributionService } from './attribution.service';

export type TelemetryEventType =
  | 'page_view'
  | 'session_start'
  | 'session_end'
  | 'service_view'
  | 'service_cta_click'
  | 'whatsapp_click'
  | 'phone_click'
  | 'contact_form_start'
  | 'contact_form_submit'
  | 'contact_form_success'
  | 'contact_form_error'
  | 'form_abandonment'
  | 'quote_modal_open'
  | 'menu_open'
  | 'menu_close'
  | 'external_link_click'
  | 'scroll_25'
  | 'scroll_50'
  | 'scroll_75'
  | 'scroll_90'
  | 'scroll_100'
  | 'rage_click'
  | 'dead_click'
  | 'error';

export interface TelemetryEvent {
  event_name: TelemetryEventType | string;
  event_id: string;
  timestamp: string;
  anonymous_id: string;
  session_id: string;
  page: string;
  route: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  viewport_width: number;
  viewport_height: number;
  screen_resolution?: string;
  device_pixel_ratio?: number;
  has_touch?: boolean;
  connection_type?: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  landing_page?: string;
  initial_referrer?: string;
  visit_count?: number;
  is_returning?: boolean;
  release_version: string;
  service_id?: string;
  service_name?: string;
  cta_type?: string;
  properties?: Record<string, unknown>;
}

export interface FootmarkEvent {
  _id?: string;
  visitorId: string;
  sessionId: string;
  path: string;
  pageTitle: string;
  referrer: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os?: string;
  city: string;
  visitCount?: number;
  isReturning?: boolean;
  landingPage?: string;
  initialReferrer?: string;
  utmSource?: string;
  utmCampaign?: string;
  gclid?: string;
  screenResolution?: string;
  createdAt: string;
}

export interface FootmarkStats {
  totalFootmarks: number;
  uniqueVisitors: number;
  todayFootmarks: number;
  todayUniqueVisitors: number;
  topPages: Array<{ path: string; title: string; count: number; percentage: number }>;
  deviceCounts: { mobile: number; desktop: number; tablet: number };
  topReferrers: Array<{ referrer: string; count: number }>;
  recentFootmarks: FootmarkEvent[];
  dailyTrends?: Array<{ date: string; label: string; views: number; visitors: number }>;
  auditScores?: Array<{ category: string; score: number; max: number; status: string; notes: string }>;
  source?: string;
  dbConnected?: boolean;
}

const STORAGE_KEY = 'apk_footmarks_v2';
const TELEMETRY_STORAGE_KEY = 'apk_telemetry_events_v1';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes inactivity
const APP_RELEASE_VERSION = '2.1.0-prod';

@Injectable({
  providedIn: 'root'
})
export class FootmarkApiService {
  private endpoint = '/api/footmark';
  private netlifyEndpoint = '/.netlify/functions/footmark';
  private lastTrackedPath = '';
  private lastTrackedTime = 0;

  // Scroll milestones tracked for the current page
  private trackedScrollDepths = new Set<number>();

  // Rage click tracking state
  private recentClicks: Array<{ time: number; x: number; y: number; target: EventTarget | null }> = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private attribution: AttributionService
  ) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Primary route page_view tracking.
   * Resets page-level scroll milestones and validates session lifecycle.
   */
  track(path: string, pageTitle?: string): void {
    if (!this.isBrowser()) return;

    // Ignore admin visits to /cms
    const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/';
    if (normalizedPath === '/cms' || normalizedPath.startsWith('/cms/')) {
      return;
    }

    // Debounce duplicate tracking events within 400ms for same path
    const now = Date.now();
    if (this.lastTrackedPath === normalizedPath && (now - this.lastTrackedTime) < 400) {
      return;
    }
    this.lastTrackedPath = normalizedPath;
    this.lastTrackedTime = now;

    // Reset scroll milestones for the newly loaded page
    this.trackedScrollDepths.clear();

    const visitorId = this.getOrCreateVisitorId();
    const sessionId = this.getOrCreateSessionId();
    const device = this.detectDevice();
    const browser = this.detectBrowser();
    const os = this.detectOS();
    const referrer = this.normalizeReferrer(document.referrer);
    const title = pageTitle || document.title || 'APK Elite Services | Pune';
    const createdAt = new Date().toISOString();

    const attr = this.attribution.getAttribution();
    const screenRes = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : undefined;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : undefined;
    const hasTouch = typeof navigator !== 'undefined' ? (navigator.maxTouchPoints > 0) : undefined;
    const connType = typeof navigator !== 'undefined' ? (navigator as any).connection?.effectiveType : undefined;

    // 1. Maintain backward-compatible FootmarkEvent for CMS with enriched attribution
    const footmark: FootmarkEvent = {
      _id: 'ft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      visitorId,
      sessionId,
      path: normalizedPath,
      pageTitle: title,
      referrer,
      device,
      browser,
      os,
      city: 'Pune',
      visitCount: attr.visit_count,
      isReturning: attr.visit_count > 1,
      landingPage: attr.landing_page,
      initialReferrer: attr.initial_referrer,
      utmSource: attr.utm_source,
      utmCampaign: attr.utm_campaign,
      gclid: attr.gclid,
      screenResolution: screenRes,
      createdAt
    };
    this.saveLocalEvent(footmark);

    // 2. Dispatch structured TelemetryEvent for page_view
    this.dispatchTelemetry({
      event_name: 'page_view',
      event_id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: createdAt,
      anonymous_id: visitorId,
      session_id: sessionId,
      page: title,
      route: normalizedPath,
      device_type: device,
      browser,
      os,
      viewport_width: window.innerWidth || 0,
      viewport_height: window.innerHeight || 0,
      screen_resolution: screenRes,
      device_pixel_ratio: dpr,
      has_touch: hasTouch,
      connection_type: connType,
      referrer,
      ...this.extractUTM(),
      release_version: APP_RELEASE_VERSION,
      properties: {
        raw_url: window.location.href,
        color_scheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
    });

    // 3. Post to Netlify Function / Backend endpoint
    this.sendRemotePayload(footmark);
  }

  /**
   * Generic structured telemetry event dispatcher.
   */
  trackEvent(
    eventName: TelemetryEventType | string,
    properties?: Record<string, unknown>,
    serviceDetails?: { service_id?: string; service_name?: string; cta_type?: string }
  ): void {
    if (!this.isBrowser()) return;

    const visitorId = this.getOrCreateVisitorId();
    const sessionId = this.getOrCreateSessionId();
    const device = this.detectDevice();
    const browser = this.detectBrowser();
    const os = this.detectOS();
    const normalizedPath = window.location.pathname.replace(/\/$/, '') || '/';
    const screenRes = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : undefined;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : undefined;
    const hasTouch = typeof navigator !== 'undefined' ? (navigator.maxTouchPoints > 0) : undefined;
    const connType = typeof navigator !== 'undefined' ? (navigator as any).connection?.effectiveType : undefined;

    const event: TelemetryEvent = {
      event_name: eventName,
      event_id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      anonymous_id: visitorId,
      session_id: sessionId,
      page: document.title || 'APK Elite Services',
      route: normalizedPath,
      device_type: device,
      browser,
      os,
      viewport_width: window.innerWidth || 0,
      viewport_height: window.innerHeight || 0,
      screen_resolution: screenRes,
      device_pixel_ratio: dpr,
      has_touch: hasTouch,
      connection_type: connType,
      referrer: this.normalizeReferrer(document.referrer),
      ...this.extractUTM(),
      release_version: APP_RELEASE_VERSION,
      service_id: serviceDetails?.service_id,
      service_name: serviceDetails?.service_name,
      cta_type: serviceDetails?.cta_type,
      properties: properties || {}
    };

    this.dispatchTelemetry(event);
  }

  /**
   * Service Catalog View Tracking
   */
  trackServiceView(serviceId: string, serviceName: string, startingPrice?: string): void {
    this.trackEvent(
      'service_view',
      { startingPrice, viewed_at: new Date().toISOString() },
      { service_id: serviceId, service_name: serviceName }
    );
  }

  /**
   * Service CTA Click Tracking
   */
  trackServiceCta(serviceId: string, serviceName: string, ctaType: string, position?: string): void {
    this.trackEvent(
      'service_cta_click',
      { position: position || 'in_page', ctaType },
      { service_id: serviceId, service_name: serviceName, cta_type: ctaType }
    );
  }

  /**
   * Dedicated WhatsApp Conversion Tracking with attribution context
   */
  trackWhatsAppClick(serviceId?: string, serviceName?: string, ctaType?: string, page?: string): void {
    this.trackEvent(
      'whatsapp_click',
      {
        conversion_channel: 'whatsapp',
        source_page: page || window.location.pathname,
        service_id: serviceId || 'general_inquiry'
      },
      {
        service_id: serviceId || 'general_inquiry',
        service_name: serviceName || 'General Inquiry',
        cta_type: ctaType || 'floating_button'
      }
    );
  }

  /**
   * Dedicated Phone Conversion Tracking
   */
  trackPhoneClick(serviceId?: string, serviceName?: string, page?: string): void {
    this.trackEvent(
      'phone_click',
      {
        conversion_channel: 'phone',
        source_page: page || window.location.pathname,
        service_id: serviceId || 'general_inquiry'
      },
      {
        service_id: serviceId || 'general_inquiry',
        service_name: serviceName || 'General Inquiry',
        cta_type: 'click_to_call'
      }
    );
  }

  /**
   * Form Lifecycle Telemetry
   */
  trackFormLifecycle(
    stage: 'start' | 'submit' | 'success' | 'error',
    formName: string,
    meta?: Record<string, unknown>
  ): void {
    const eventName: TelemetryEventType =
      stage === 'start'
        ? 'contact_form_start'
        : stage === 'submit'
        ? 'contact_form_submit'
        : stage === 'success'
        ? 'contact_form_success'
        : 'contact_form_error';

    this.trackEvent(eventName, {
      form_name: formName,
      ...(meta || {})
    });
  }

  /**
   * Scroll Depth Telemetry Listener
   * Triggers scroll_25, scroll_50, scroll_75, scroll_90, scroll_100 once per pageview.
   */
  handleScroll(): void {
    if (!this.isBrowser()) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return;

    const pct = Math.round((scrollTop / docHeight) * 100);
    const milestones = [25, 50, 75, 90, 100];

    for (const m of milestones) {
      if (pct >= m && !this.trackedScrollDepths.has(m)) {
        this.trackedScrollDepths.add(m);
        this.trackEvent(`scroll_${m}` as TelemetryEventType, {
          scroll_percentage: m,
          scroll_top_px: Math.round(scrollTop),
          document_height_px: docHeight
        });
      }
    }
  }

  /**
   * Global Click Listener for Rage Click & Dead Click Detection
   */
  handleClick(event: MouseEvent): void {
    if (!this.isBrowser()) return;

    const now = Date.now();
    const target = event.target as HTMLElement | null;
    const x = event.clientX;
    const y = event.clientY;

    // 1. Rage Click Detection: 3+ clicks within 1500ms and 35px radius
    this.recentClicks.push({ time: now, x, y, target });
    // Keep only clicks within last 1500ms
    this.recentClicks = this.recentClicks.filter(c => (now - c.time) <= 1500);

    if (this.recentClicks.length >= 3) {
      const first = this.recentClicks[0];
      const distance = Math.hypot(x - first.x, y - first.y);
      if (distance < 35) {
        const tagName = target?.tagName?.toLowerCase() || 'unknown';
        const snippet = (target?.textContent || '').trim().substring(0, 40);
        this.trackEvent('rage_click', {
          element_tag: tagName,
          element_class: target?.className || '',
          snippet,
          click_count: this.recentClicks.length,
          x,
          y
        });
        // Clear recent clicks so we don't spam rage_click events
        this.recentClicks = [];
      }
    }

    // 2. Dead Click Detection: clicking non-clickable element styled like an action/card
    if (target) {
      const isInteractive = target.closest('a, button, input, select, textarea, [role="button"], [tabindex]');
      const looksClickable = target.closest('.card, .feature-card, .service-card, .info-box, .stat-box');
      if (!isInteractive && looksClickable) {
        const tagName = target.tagName.toLowerCase();
        const snippet = (target.textContent || '').trim().substring(0, 40);
        this.trackEvent('dead_click', {
          element_tag: tagName,
          element_class: (looksClickable as HTMLElement).className || '',
          snippet,
          x,
          y
        });
      }
    }
  }

  /**
   * Client-Side Error Telemetry
   */
  trackError(errorMsg: string, stack?: string): void {
    if (!this.isBrowser()) return;

    this.trackEvent('error', {
      error_message: errorMsg,
      error_stack: stack ? stack.substring(0, 300) : undefined,
      url: window.location.href
    });
  }

  /**
   * Save TelemetryEvent to local FIFO buffer
   */
  private dispatchTelemetry(event: TelemetryEvent): void {
    try {
      const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
      const events: TelemetryEvent[] = raw ? JSON.parse(raw) : [];
      events.unshift(event);
      // Keep up to 150 recent telemetry events
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(events.slice(0, 150)));

      // Mirror key telemetry & conversion events to Umami Cloud (if script loaded)
      if (typeof (window as any).umami?.track === 'function') {
        (window as any).umami.track(event.event_name, {
          route: event.route,
          service: event.service_id || event.service_name,
          cta: event.cta_type,
          visit_count: event.visit_count,
          source: event.utm_source || event.initial_referrer
        });
      }
    } catch {}
  }

  /**
   * Retrieve list of stored TelemetryEvents
   */
  getTelemetryEvents(): TelemetryEvent[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Send event payload to remote Netlify Function or Next.js backend with failover.
   */
  private async sendRemotePayload(payload: unknown): Promise<void> {
    const payloadStr = JSON.stringify(payload);

    try {
      const primaryUrl = (window as any).__APK_TRACKING_ENDPOINT__ || this.endpoint;
      
      // Use fetch with keepalive as primary robust transport (avoids serverless base64 blob translation)
      let res = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadStr,
        keepalive: true
      }).catch(() => null);

      let isHtml = res ? (res.headers.get('content-type') || '').includes('text/html') : true;

      // Failover to Netlify Functions endpoint directly if primary rewrite failed
      if (!res || !res.ok || isHtml) {
        await fetch(this.netlifyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
          keepalive: true
        }).catch(() => {});
      }
    } catch {
      // Offline or network error: event is already persisted in local cache
    }
  }

  /**
   * Load footmark statistics. Attempts API first, then falls back to local storage.
   */
  async fetchStats(): Promise<FootmarkStats> {
    if (!this.isBrowser()) {
      return this.generateDefaultStats([]);
    }

    try {
      const targetUrl = (window as any).__APK_TRACKING_ENDPOINT__ || this.endpoint;

      let res = await fetch(targetUrl).catch(() => null);
      let isHtml = res ? (res.headers.get('content-type') || '').includes('text/html') : true;

      if (!res || !res.ok || isHtml) {
        res = await fetch(this.netlifyEndpoint).catch(() => null);
        isHtml = res ? (res.headers.get('content-type') || '').includes('text/html') : true;
      }

      if (res && res.ok && !isHtml) {
        const data = await res.json();
        if (data.success && data.stats) {
          const stats: FootmarkStats = data.stats;
          stats.source = data.source || (data.dbConnected ? 'mongodb' : 'in-memory');
          stats.dbConnected = Boolean(data.dbConnected || data.source === 'mongodb');

          if (!stats.dailyTrends || !stats.dailyTrends.length) {
            stats.dailyTrends = this.buildDailyTrends(stats.recentFootmarks || []);
          }

          // If remote MongoDB is connected, remote is source of truth
          if (stats.dbConnected || stats.totalFootmarks > 0) {
            return stats;
          }
        }
      }
    } catch (err) {
      console.warn('Backend fetch failed, reading local footprint cache:', err);
    }

    const localEvents = this.getLocalEvents();
    const fallbackStats = this.generateDefaultStats(localEvents);
    fallbackStats.source = 'local-storage';
    fallbackStats.dbConnected = false;
    return fallbackStats;
  }

  /**
   * Simulate a realistic visit for testing the dashboard.
   */
  async simulateVisit(customPath?: string): Promise<FootmarkStats> {
    if (!this.isBrowser()) return this.generateDefaultStats([]);

    const samplePages = [
      { path: '/', title: 'APK Elite Services | Professional Cleaning in Pune' },
      { path: '/services/deep-cleaning', title: 'Deep Cleaning Services in Pune' },
      { path: '/services/sofa-cleaning', title: 'Sofa Shampooing Services Pune' },
      { path: '/services/office-cleaning', title: 'Office Cleaning Services in Pune' },
      { path: '/services/floor-polishing', title: 'Floor Polishing Services Pune' },
      { path: '/services/pest-control', title: 'Pest Control Services Pune' },
      { path: '/about', title: 'About APK Elite Services | Facility Management' },
      { path: '/contact', title: 'Contact APK Elite Services | Get Quote' }
    ];

    const pick = customPath 
      ? samplePages.find(p => p.path === customPath) || { path: customPath, title: 'APK Elite Services' }
      : samplePages[Math.floor(Math.random() * samplePages.length)];

    const referrers = ['Google Search', 'WhatsApp', 'Direct', 'Instagram', 'Google Search', 'Direct'];
    const devices: Array<'mobile' | 'desktop' | 'tablet'> = ['mobile', 'mobile', 'desktop', 'mobile', 'desktop'];
    const browsers = ['Chrome Mobile', 'Safari', 'Chrome', 'Firefox'];
    const localities = ['Wakad', 'Baner', 'Hinjewadi', 'Kharadi', 'Kothrud', 'Viman Nagar'];

    const event: FootmarkEvent = {
      _id: 'ft_sim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      visitorId: 'v_' + Math.random().toString(36).substring(2, 8),
      sessionId: 's_' + Math.random().toString(36).substring(2, 8),
      path: pick.path,
      pageTitle: pick.title,
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      os: 'Android',
      city: localities[Math.floor(Math.random() * localities.length)] + ', Pune',
      createdAt: new Date().toISOString()
    };

    this.saveLocalEvent(event);

    try {
      const targetUrl = (window as any).__APK_TRACKING_ENDPOINT__ ||
        (window.location.hostname === 'localhost' && window.location.port !== '3000'
          ? 'http://localhost:3000/api/footmark'
          : this.endpoint);
      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch {}

    return this.fetchStats();
  }

  /**
   * Anonymous persistent visitor UUID (localStorage)
   */
  private getOrCreateVisitorId(): string {
    const key = 'apk_vid';
    let vid = localStorage.getItem(key);
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem(key, vid);
    }
    return vid;
  }

  /**
   * Rolling session identifier with 30-min inactivity renewal (sessionStorage)
   */
  private getOrCreateSessionId(): string {
    const sidKey = 'apk_sid';
    const tsKey = 'apk_sid_ts';
    const now = Date.now();
    const lastActive = parseInt(sessionStorage.getItem(tsKey) || '0', 10);
    let sid = sessionStorage.getItem(sidKey);

    if (!sid || (now - lastActive) > SESSION_EXPIRY_MS) {
      sid = 's_' + Math.random().toString(36).substring(2, 9) + '_' + now.toString(36);
      sessionStorage.setItem(sidKey, sid);

      // Trigger session_start event for new session
      setTimeout(() => {
        this.trackEvent('session_start', {
          new_session: true,
          previous_inactivity_ms: lastActive ? now - lastActive : 0
        });
      }, 50);
    }

    sessionStorage.setItem(tsKey, now.toString());
    return sid;
  }

  private detectDevice(): 'mobile' | 'desktop' | 'tablet' {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Chrome')) return 'Chrome';
    return 'Browser';
  }

  private detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) return 'iOS';
    if (ua.includes('CrOS')) return 'ChromeOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Other';
  }

  private extractUTM(): {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    landing_page?: string;
    initial_referrer?: string;
    visit_count?: number;
    is_returning?: boolean;
  } {
    try {
      const attr = this.attribution.getAttribution();
      return {
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        utm_term: attr.utm_term,
        utm_content: attr.utm_content,
        gclid: attr.gclid,
        landing_page: attr.landing_page,
        initial_referrer: attr.initial_referrer,
        visit_count: attr.visit_count,
        is_returning: attr.visit_count > 1
      };
    } catch {
      return {};
    }
  }

  private normalizeReferrer(ref: string): string {
    if (!ref) return 'Direct';
    const lower = ref.toLowerCase();
    if (lower.includes('google')) return 'Google Search';
    if (lower.includes('wa.me') || lower.includes('whatsapp')) return 'WhatsApp';
    if (lower.includes('instagram')) return 'Instagram';
    if (lower.includes('facebook')) return 'Facebook';
    if (lower.includes('linkedin')) return 'LinkedIn';
    try {
      const url = new URL(ref);
      return url.hostname.replace('www.', '');
    } catch {
      return 'Direct';
    }
  }

  private getLocalEvents(): FootmarkEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      
      // Filter out any legacy dummy/seed items from previous builds
      const cleaned = parsed.filter((e: FootmarkEvent) => {
        if (!e) return false;
        if (e._id && typeof e._id === 'string' && e._id.startsWith('ft_seed_')) return false;
        if (e.visitorId && (e.visitorId.startsWith('v_wakad') || e.visitorId.startsWith('v_baner') || e.visitorId.startsWith('v_hinj'))) return false;
        return true;
      });

      // If legacy items were purged, update localStorage
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }

      return cleaned;
    } catch {
      return [];
    }
  }

  private saveLocalEvent(event: FootmarkEvent): void {
    try {
      const list = this.getLocalEvents();
      list.unshift(event);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 250)));
    } catch {}
  }

  private generateInitialSeedEvents(): FootmarkEvent[] {
    return [];
  }

  private generateDefaultStats(events: FootmarkEvent[]): FootmarkStats {
    const list = events;
    const totalFootmarks = list.length;
    const uniqueVisitors = new Set(list.map(e => e.visitorId)).size;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayList = list.filter(e => (e.createdAt || '').startsWith(todayStr));
    const todayFootmarks = todayList.length;
    const todayUniqueVisitors = new Set(todayList.map(e => e.visitorId)).size;

    const pageMap: { [path: string]: { count: number; title: string } } = {};
    list.forEach(e => {
      const p = e.path || '/';
      if (!pageMap[p]) {
        pageMap[p] = { count: 0, title: e.pageTitle || p };
      }
      pageMap[p].count++;
    });

    const topPages = Object.entries(pageMap)
      .map(([path, data]) => ({
        path,
        title: data.title,
        count: data.count,
        percentage: totalFootmarks > 0 ? Math.round((data.count / totalFootmarks) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
    list.forEach(e => {
      const d = e.device || 'mobile';
      if (deviceCounts[d] !== undefined) {
        deviceCounts[d]++;
      } else {
        deviceCounts.mobile++;
      }
    });

    const refMap: { [ref: string]: number } = {};
    list.forEach(e => {
      const r = e.referrer || 'Direct';
      refMap[r] = (refMap[r] || 0) + 1;
    });

    const topReferrers = Object.entries(refMap)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalFootmarks,
      uniqueVisitors,
      todayFootmarks,
      todayUniqueVisitors,
      topPages,
      deviceCounts,
      topReferrers,
      recentFootmarks: list.slice(0, 60),
      dailyTrends: this.buildDailyTrends(list)
    };
  }

  private buildDailyTrends(events: FootmarkEvent[]): Array<{ date: string; label: string; views: number; visitors: number }> {
    const days: Array<{ date: string; label: string; views: number; visitors: number }> = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const dayEvents = events.filter(e => (e.createdAt || '').startsWith(dateStr));
      const views = dayEvents.length;
      const visitors = new Set(dayEvents.map(e => e.visitorId)).size;

      days.push({ date: dateStr, label, views, visitors });
    }

    return days;
  }

}

