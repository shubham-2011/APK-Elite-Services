import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { AddFooterComponent } from './add-footer/add-footer.component';
import { QuoteModalComponent } from './quote-modal/quote-modal.component';
import { filter } from 'rxjs/operators';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __APK_TRACKING_ENDPOINT__?: string;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, AddFooterComponent, QuoteModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.trackPageView(window.location.pathname + window.location.search);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  private trackPageView(path: string) {
    const visitorId = this.getOrCreateVisitorId();
    const sessionId = this.getOrCreateSessionId();
    const device = this.detectDevice();
    const browser = this.detectBrowser();
    const referrer = this.normalizeReferrer(document.referrer);

    const payload = {
      visitorId,
      sessionId,
      path,
      pageTitle: document.title || 'APK Elite Services',
      referrer,
      device,
      browser,
      city: 'Pune',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: document.title
      });
    }

    // Determine target footmark API endpoint
    const endpoint = window.__APK_TRACKING_ENDPOINT__ || 
      (window.location.hostname === 'localhost' && window.location.port !== '3000'
        ? 'http://localhost:3000/api/footmark'
        : '/api/footmark');

    try {
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    } catch {
      // Ignore network errors on background beacon
    }

    const storedEvents = this.getStoredEvents();
    storedEvents.push({
      path,
      title: document.title,
      referrer,
      timestamp: payload.timestamp,
      visitorId
    });
    localStorage.setItem('apk-traffic-events', JSON.stringify(storedEvents.slice(-20)));
  }

  private getOrCreateVisitorId(): string {
    const key = 'apk_vid';
    let vid = localStorage.getItem(key);
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem(key, vid);
    }
    return vid;
  }

  private getOrCreateSessionId(): string {
    const key = 'apk_sid';
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(key, sid);
    }
    return sid;
  }

  private detectDevice(): 'mobile' | 'desktop' | 'tablet' {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) {
      return 'mobile';
    }
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
      return 'External';
    }
  }

  private getStoredEvents(): Array<Record<string, string>> {
    const storedValue = localStorage.getItem('apk-traffic-events');
    if (!storedValue) {
      return [];
    }

    try {
      return JSON.parse(storedValue) as Array<Record<string, string>>;
    } catch {
      return [];
    }
  }
}
