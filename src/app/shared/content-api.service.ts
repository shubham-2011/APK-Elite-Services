import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface ServicePriceItem {
  service: string;
  startingPrice: number;
  unit: string;
  active: boolean;
}

export interface ShowcaseProjectItem {
  title: string;
  location: string;
  category: string;
  imageUrl: string;
  description: string;
}

export interface DynamicContent {
  companyName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address?: string;
  businessHours?: string;
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
    propertyTypes?: string[];
  };
  pricing?: ServicePriceItem[];
  showcase?: {
    heading: string;
    subheading: string;
    projects: ShowcaseProjectItem[];
  };
}

const STORAGE_KEY = 'apk_elite_site_content';

const DEFAULT_CONTENT: DynamicContent = {
  companyName: 'APK Elite Services',
  phone: '+91 88301 67863',
  whatsapp: '918830167863',
  email: 'info@apkeliteservices.in',
  address: 'Shop No 4, Datta Mandir Rd, Wakad, Pune, Maharashtra 411057',
  businessHours: 'Mon - Sun: 8:00 AM - 9:00 PM',
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
    propertyTypes: ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK / Villa', 'Office / Commercial', 'Other'],
  },
  pricing: [
    { service: 'Deep Cleaning (1 BHK)', startingPrice: 2499, unit: 'per flat', active: true },
    { service: 'Deep Cleaning (2 BHK)', startingPrice: 3499, unit: 'per flat', active: true },
    { service: 'Deep Cleaning (3 BHK)', startingPrice: 4499, unit: 'per flat', active: true },
    { service: 'Sofa Shampooing', startingPrice: 799, unit: 'per 3-seater', active: true },
    { service: 'Carpet Shampooing', startingPrice: 999, unit: 'per room', active: true },
    { service: 'Office Cleaning', startingPrice: 1999, unit: 'starting from', active: true },
    { service: 'Pest Control', startingPrice: 1199, unit: 'starting from', active: true },
  ],
  showcase: {
    heading: 'Recent Cleaning Projects in Pune',
    subheading: 'Explore recent residential and commercial cleaning work completed by our trained in-house team across Pune & PCMC.',
    projects: [
      {
        title: '3BHK Vacant Apartment Deep Clean',
        location: 'Baner, Pune',
        category: 'Deep Cleaning',
        imageUrl: '/assets/images/deep-clean.webp',
        description: 'Complete floor scrubbing, kitchen degreasing, bathroom descaling & balcony pressure washing.'
      },
      {
        title: '7-Seater Fabric Sofa Shampooing',
        location: 'Wakad, Pune',
        category: 'Sofa Cleaning',
        imageUrl: '/assets/images/Sofacleaning.webp',
        description: 'Deep foam injection & extraction to remove tough stains, dust & odor from living room sofa.'
      },
      {
        title: 'Corporate Office Carpet & Janitorial',
        location: 'Kharadi (EON IT Park), Pune',
        category: 'Office Cleaning',
        imageUrl: '/assets/images/office-clean.webp',
        description: 'Overnight office sanitization, carpet steam extraction & workstation sanitization.'
      }
    ]
  }
};

@Injectable({
  providedIn: 'root',
})
export class ContentApiService {
  private apiEndpoint = '/api/content';
  private netlifyEndpoint = '/.netlify/functions/content';
  private devEndpoint = 'http://localhost:3000/api/content';

  private contentSubject = new BehaviorSubject<DynamicContent>(DEFAULT_CONTENT);
  content$ = this.contentSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Load cached content from localStorage immediately
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          this.contentSubject.next({ ...DEFAULT_CONTENT, ...parsed });
        }
      } catch (e) {}

      // 2. Fetch latest live content from API
      this.fetchLiveContent();
    }
  }

  async fetchLiveContent(): Promise<DynamicContent> {
    if (!isPlatformBrowser(this.platformId)) {
      return DEFAULT_CONTENT;
    }

    try {
      let res = await fetch(this.apiEndpoint);
      let isHtml = (res.headers.get('content-type') || '').includes('text/html');
      if (!res.ok || isHtml) {
        res = await fetch(this.netlifyEndpoint);
        isHtml = (res.headers.get('content-type') || '').includes('text/html');
      }
      if ((!res.ok || isHtml) && window.location.hostname === 'localhost') {
        res = await fetch(this.devEndpoint);
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.content) {
          const merged = { ...DEFAULT_CONTENT, ...data.content };
          this.contentSubject.next(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.info('CMS content API offline; using local cached content.');
    }

    return this.contentSubject.getValue();
  }

  async saveContent(updatedContent: DynamicContent): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;

    // Save to local subject and localStorage immediately
    this.contentSubject.next(updatedContent);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedContent));
    } catch (e) {}

    // Persist to server API
    try {
      let res = await fetch(this.apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent }),
      });

      let isHtml = (res.headers.get('content-type') || '').includes('text/html');
      if (!res.ok || isHtml) {
        res = await fetch(this.netlifyEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: updatedContent }),
        });
      }

      if (!res.ok && window.location.hostname === 'localhost') {
        res = await fetch(this.devEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: updatedContent }),
        });
      }

      return res.ok;
    } catch (err) {
      console.warn('Content saved to local browser cache, server endpoint offline:', err);
      return true;
    }
  }

  get current(): DynamicContent {
    return this.contentSubject.getValue();
  }
}
