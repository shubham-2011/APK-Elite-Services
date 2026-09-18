import { Component, Inject, PLATFORM_ID, HostListener, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { AddFooterComponent } from './add-footer/add-footer.component';
import { QuoteModalComponent } from './quote-modal/quote-modal.component';
import { FootmarkApiService } from './shared/footmark-api.service';
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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
