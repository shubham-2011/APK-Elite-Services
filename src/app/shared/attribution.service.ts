import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  initial_referrer: string;
  landing_page: string;
  first_visit_time: string;
  last_visit_time: string;
  visit_count: number;
}

const STORAGE_KEY = 'apk_attr_v1';
const SESSION_KEY = 'apk_attr_session_v1';

@Injectable({
  providedIn: 'root'
})
export class AttributionService {
  private cachedAttribution: AttributionData | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (this.isBrowser()) {
      this.initAttribution();
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Initializes and persists marketing attribution across navigation & sessions.
   * Preserves first-touch campaign attribution while tracking returning visit counts.
   */
  private initAttribution(): void {
    const now = new Date().toISOString();
    const existing = this.getStoredAttribution();
    const queryParams = new URLSearchParams(window.location.search);

    const currentSource = queryParams.get('utm_source');
    const currentMedium = queryParams.get('utm_medium');
    const currentCampaign = queryParams.get('utm_campaign');
    const currentTerm = queryParams.get('utm_term');
    const currentContent = queryParams.get('utm_content');
    const currentGclid = queryParams.get('gclid');
    const currentFbclid = queryParams.get('fbclid');
    const currentMsclkid = queryParams.get('msclkid');
    const currentTtclid = queryParams.get('ttclid');

    const hasNewCampaignParams = Boolean(
      currentSource || currentCampaign || currentGclid || currentFbclid || currentMsclkid
    );

    const isNewSession = !sessionStorage.getItem(SESSION_KEY);
    sessionStorage.setItem(SESSION_KEY, 'active');

    const cleanPath = window.location.pathname.replace(/\/$/, '') || '/';
    const rawReferrer = document.referrer;
    const normalizedReferrer = this.classifyReferrer(rawReferrer);

    if (!existing) {
      // First-ever visit to website
      this.cachedAttribution = {
        utm_source: currentSource || (normalizedReferrer !== 'Direct' ? normalizedReferrer : undefined),
        utm_medium: currentMedium || (normalizedReferrer !== 'Direct' ? 'referral' : undefined),
        utm_campaign: currentCampaign || undefined,
        utm_term: currentTerm || undefined,
        utm_content: currentContent || undefined,
        gclid: currentGclid || undefined,
        fbclid: currentFbclid || undefined,
        msclkid: currentMsclkid || undefined,
        ttclid: currentTtclid || undefined,
        initial_referrer: normalizedReferrer,
        landing_page: cleanPath,
        first_visit_time: now,
        last_visit_time: now,
        visit_count: 1
      };
      this.persist(this.cachedAttribution);
    } else {
      // Returning visitor
      const updatedCount = isNewSession ? existing.visit_count + 1 : existing.visit_count;

      // If user arrives via a fresh paid ad campaign or referral link, update campaign parameters
      this.cachedAttribution = {
        ...existing,
        utm_source: hasNewCampaignParams ? (currentSource || existing.utm_source) : existing.utm_source,
        utm_medium: hasNewCampaignParams ? (currentMedium || existing.utm_medium) : existing.utm_medium,
        utm_campaign: hasNewCampaignParams ? (currentCampaign || existing.utm_campaign) : existing.utm_campaign,
        utm_term: hasNewCampaignParams ? (currentTerm || existing.utm_term) : existing.utm_term,
        utm_content: hasNewCampaignParams ? (currentContent || existing.utm_content) : existing.utm_content,
        gclid: currentGclid || existing.gclid,
        fbclid: currentFbclid || existing.fbclid,
        msclkid: currentMsclkid || existing.msclkid,
        ttclid: currentTtclid || existing.ttclid,
        last_visit_time: now,
        visit_count: updatedCount
      };
      this.persist(this.cachedAttribution);
    }
  }

  private getStoredAttribution(): AttributionData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private persist(data: AttributionData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  /**
   * Returns complete active attribution record.
   */
  getAttribution(): AttributionData {
    if (!this.cachedAttribution && this.isBrowser()) {
      this.cachedAttribution = this.getStoredAttribution();
    }
    return (
      this.cachedAttribution || {
        initial_referrer: 'Direct',
        landing_page: '/',
        first_visit_time: new Date().toISOString(),
        last_visit_time: new Date().toISOString(),
        visit_count: 1
      }
    );
  }

  /**
   * Generates a compact marketing attribution reference tag for WhatsApp & Email conversions.
   * Example: "[Ref: ggl/cpc/diwali2026/Baner]" or "[Ref: Direct/Baner]"
   */
  getCompactAttributionTag(locality?: string): string {
    const attr = this.getAttribution();
    const source = attr.utm_source ? attr.utm_source.toLowerCase().replace(/[^a-z0-9]/g, '') : 'web';
    const medium = attr.utm_medium ? attr.utm_medium.toLowerCase().replace(/[^a-z0-9]/g, '') : 'org';
    const campaign = attr.utm_campaign ? attr.utm_campaign.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const loc = locality ? locality.replace(/[^a-zA-Z0-9]/g, '') : 'Pune';

    const parts = [source, medium];
    if (campaign) parts.push(campaign);
    if (attr.gclid) parts.push('gclid');
    parts.push(loc);

    return `[Ref: ${parts.join('/')}]`;
  }

  /**
   * Normalizes document.referrer into canonical channels.
   */
  private classifyReferrer(ref: string): string {
    if (!ref) return 'Direct';
    const lower = ref.toLowerCase();
    if (lower.includes('google.')) return 'Google Search';
    if (lower.includes('wa.me') || lower.includes('whatsapp')) return 'WhatsApp';
    if (lower.includes('instagram.com')) return 'Instagram';
    if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'Facebook';
    if (lower.includes('linkedin.com')) return 'LinkedIn';
    if (lower.includes('youtube.com')) return 'YouTube';
    if (lower.includes('bing.com')) return 'Bing';
    try {
      const url = new URL(ref);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return 'Referral';
    }
  }
}
