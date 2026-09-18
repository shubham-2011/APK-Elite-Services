import { Component, Inject, PLATFORM_ID, HostListener, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { AddFooterComponent } from './add-footer/add-footer.component';
import { QuoteModalComponent } from './quote-modal/quote-modal.component';
import { FootmarkApiService } from './shared/footmark-api.service';
import { AttributionService } from './shared/attribution.service';
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
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private footmarkApi: FootmarkApiService,
    private attributionService: AttributionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getDynamicWhatsAppUrl(context: string = 'Web'): string {
    const phone = '918830167863';
    let refTag = `Web/${context}`;
    if (isPlatformBrowser(this.platformId)) {
      const attr = this.attributionService.getAttribution();
      const parts: string[] = [];
      if (attr.utm_source) parts.push(attr.utm_source);
      if (attr.utm_campaign) parts.push(attr.utm_campaign);
      if (attr.gclid) parts.push('GoogleAds');
      if (attr.visit_count && attr.visit_count > 1) parts.push(`V${attr.visit_count}`);
      if (parts.length > 0) {
        refTag = `${parts.join('/')}/${context}`;
      }
    }
    const text = `Hi, I'm interested in your cleaning services in Pune. [Ref: ${refTag}]`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  trackCtaClick(channel: 'whatsapp' | 'call' | 'email', location: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (channel === 'whatsapp') {
      this.footmarkApi.trackWhatsAppClick('general_inquiry', 'General Inquiry', location, this.router.url);
    } else if (channel === 'call') {
      this.footmarkApi.trackPhoneClick('general_inquiry', 'General Inquiry', this.router.url);
    } else {
      this.footmarkApi.trackEvent('external_link_click', {
        channel,
        location,
        destination: 'mailto:info@apkeliteservices.in',
        page: this.router.url
      });
    }
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Track on client navigation ends
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.footmarkApi.track(event.urlAfterRedirects, document.title);
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'page_view', {
            page_path: event.urlAfterRedirects,
            page_title: document.title
          });
        }
      });
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.footmarkApi.handleScroll();
    }
  }

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      this.footmarkApi.handleClick(event);
    }
  }

  @HostListener('window:error', ['$event'])
  onWindowError(event: ErrorEvent) {
    if (isPlatformBrowser(this.platformId)) {
      this.footmarkApi.trackError(event.message || 'Unknown window error');
    }
  }
}
