import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface DynamicContent {
  companyName: string;
  phone: string;
  whatsapp: string;
  email: string;
  promoBanner: {
    enabled: boolean;
    text: string;
    discountPercent: number;
  };
  formConfig: {
    modalTitle: string;
    modalSubtitle: string;
    localities: string[];
    services: string[];
  };
}

const DEFAULT_CONTENT: DynamicContent = {
  companyName: 'APK Elite Services',
  phone: '+91 88301 67863',
  whatsapp: '918830167863',
  email: 'info@apkeliteservices.in',
  promoBanner: {
    enabled: true,
    text: 'Festival Offer: Get Flat 15% OFF on Home Deep Cleaning in Pune!',
    discountPercent: 15,
  },
  formConfig: {
    modalTitle: 'Request a Free Service Quote',
    modalSubtitle: 'Fill out your details below to send a quote request directly to our team.',
    localities: [
      'Baner',
      'Wakad',
      'Hinjewadi',
      'Kharadi',
      'Viman Nagar',
      'Kothrud',
      'Aundh',
      'Hadapsar',
      'Bavdhan',
      'Pimple Saudagar',
      'Pimpri-Chinchwad',
      'Magarpatta',
      'Other Area',
    ],
    services: [
      'Deep Cleaning',
      'Sofa Cleaning',
      'Office Cleaning',
      'Post Construction Cleaning',
      'Water Tank Cleaning',
      'Pest Control',
      'Floor Polishing',
      'Facade Cleaning',
      'Carpet Cleaning',
      'Sanitization',
    ],
  },
};

const DEFAULT_CONTENT_API = 'http://localhost:3000/api/content';

@Injectable({
  providedIn: 'root',
})
export class ContentApiService {
  private contentSubject = new BehaviorSubject<DynamicContent>(DEFAULT_CONTENT);
  content$ = this.contentSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchLiveContent();
    }
  }

  async fetchLiveContent(): Promise<void> {
    try {
      const endpoint = (window as any).__APK_CMS_CONTENT_API__ || DEFAULT_CONTENT_API;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.content) {
          this.contentSubject.next(data.content);
        }
      }
    } catch (e) {
      // Offline fallback: keep default content seamlessly
      console.info('CMS content API unreachable; using built-in defaults.');
    }
  }

  get current(): DynamicContent {
    return this.contentSubject.getValue();
  }
}
