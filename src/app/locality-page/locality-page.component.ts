import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeoService } from '../seo.service';
import { QuoteCalculatorComponent } from '../quote-calculator/quote-calculator.component';

const WA_NUMBER = '918830167863';

interface LocalityInfo {
  slug: string;
  localityName: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  highlights: string[];
  topSocieties: string[];
}

const LOCALITY_DATA: Record<string, LocalityInfo> = {
  'baner': {
    slug: 'deep-cleaning-baner',
    localityName: 'Baner',
    title: 'Professional Deep Cleaning Services in Baner, Pune',
    metaTitle: 'Deep Cleaning Services in Baner Pune | APK Elite Services',
    metaDescription: 'Trusted house deep cleaning, sofa shampooing & office cleaning in Baner & Balewadi, Pune. In-house staff, transparent rates & 5-star service.',
    highlights: [
      'Serving Baner, Balewadi, Baner-Pashan Link Road & Prabhat Road',
      'Specialized 2BHK, 3BHK & Luxury Apartment cleaning packages',
      'In-house trained professionals (No 3rd-party outsourcing)'
    ],
    topSocieties: ['Rohan Leher', 'Pancho Villa', 'Supreme Amadore', 'Kalpataru Jade', 'VTP Alpine']
  },
  'wakad': {
    slug: 'deep-cleaning-wakad',
    localityName: 'Wakad',
    title: 'Top Deep Cleaning Services in Wakad & Thergaon, Pune',
    metaTitle: 'Deep Cleaning Services in Wakad Pune | APK Elite Services',
    metaDescription: 'Professional home deep cleaning, sofa shampooing & sanitization in Wakad, Pune. Serving premium residential societies with eco-friendly solutions.',
    highlights: [
      'Serving Wakad, Thergaon, Bhumkar Chowk & Datta Mandir Road',
      'Full home deep cleaning for vacant and occupied flats',
      'Eco-friendly non-toxic chemicals safe for kids & pets'
    ],
    topSocieties: ['Sonigara Kesar', 'Paranjape Schemes', 'Mont Vert Tropez', 'Bhusari Colony']
  },
  'kharadi': {
    slug: 'deep-cleaning-kharadi',
    localityName: 'Kharadi',
    title: 'Expert Deep Cleaning Services in Kharadi, Pune',
    metaTitle: 'Deep Cleaning Services in Kharadi Pune | APK Elite Services',
    metaDescription: 'Reliable deep cleaning & sofa cleaning in Kharadi & EON IT Park area, Pune. Fast 5-minute response & 100% satisfaction guarantee.',
    highlights: [
      'Serving Kharadi, EON Free Zone, World Trade Center & Chandan Nagar',
      'Residential flat deep cleaning & corporate office janitorial services',
      'Single-disc floor scrubbing & hard water tile descaling'
    ],
    topSocieties: ['Gera World of Joy', 'Zen Elite', 'Panchshil Towers', 'Majestique City']
  },
  'hinjewadi': {
    slug: 'deep-cleaning-hinjewadi',
    localityName: 'Hinjewadi',
    title: 'Deep Cleaning & Facility Services in Hinjewadi, Pune',
    metaTitle: 'Deep Cleaning Services in Hinjewadi Pune | APK Elite Services',
    metaDescription: 'Professional home cleaning & office sanitization in Hinjewadi Phase 1, 2 & 3. Quick booking & transparent rates for IT professionals.',
    highlights: [
      'Serving Hinjewadi Phase 1, Phase 2, Phase 3 & Maan Road',
      'Flexible weekend slot booking for IT professionals',
      'Comprehensive move-in / move-out post-construction cleanup'
    ],
    topSocieties: ['Megapolis', 'Life Republic', 'Tinsel Town', 'Godrej 24', 'Xrbia Hinjewadi']
  }
};

@Component({
  selector: 'app-locality-page',
  standalone: true,
  imports: [CommonModule, RouterLink, QuoteCalculatorComponent],
  template: `
    <section class="locality-page" *ngIf="localityData; else notFound">
      
      <!-- Hero -->
      <div class="locality-hero">
        <span class="area-badge">Hyper-Local Service · {{ localityData.localityName }}</span>
        <h1>{{ localityData.title }}</h1>
        <p class="hero-sub">Providing premier residential house cleaning, sofa shampooing, office maintenance & sanitization across {{ localityData.localityName }} and surrounding neighborhoods.</p>
        
        <div class="cta-row">
          <a [href]="whatsAppUrl" target="_blank" rel="noopener" class="btn-whatsapp" data-umami-event="locality-whatsapp-click" [attr.data-umami-event-locality]="localityData.localityName">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L0 24l6.335-1.502A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.52-5.17-1.426l-.37-.22-3.76.892.946-3.653-.24-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            <span>WhatsApp Us for {{ localityData.localityName }} Quote</span>
          </a>
          <a routerLink="/contact" class="btn-call">Request Callback</a>
        </div>
      </div>

      <!-- Highlights Card -->
      <div class="info-card">
        <h2>Why {{ localityData.localityName }} Residents Choose APK Elite Services</h2>
        <ul class="highlight-list">
          <li *ngFor="let item of localityData.highlights">
            <svg class="check-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <!-- Calculator -->
      <app-quote-calculator></app-quote-calculator>

    </section>

    <ng-template #notFound>
      <section class="locality-page not-found">
        <h1>Locality page not found</h1>
        <a routerLink="/services" class="btn-call">View All Services</a>
      </section>
    </ng-template>
  `,
  styles: [
    `:host { display: block; padding: 2.5rem 1.25rem 4rem; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }`,
    `.locality-page { max-width: 1140px; margin: 0 auto; }`,
    `.locality-hero { background: white; border-radius: 16px; padding: 2.25rem 2.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 2rem; }`,
    `.area-badge { display: inline-block; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; padding: 0.3rem 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; }`,
    `h1 { font-size: 2.1rem; color: #0f172a; margin: 0 0 0.5rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; }`,
    `.hero-sub { color: #475569; margin: 0 0 1.5rem; font-size: 1rem; line-height: 1.6; max-width: 760px; }`,
    `.cta-row { display: flex; flex-wrap: wrap; gap: 0.85rem; }`,
    `.btn-whatsapp { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.35rem; border-radius: 8px; background: #16a34a; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: background 0.2s ease; }`,
    `.btn-whatsapp:hover { background: #15803d; }`,
    `.btn-call { display: inline-flex; align-items: center; padding: 0.75rem 1.35rem; border-radius: 8px; background: #0f172a; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; }`,
    `.info-card { background: white; border-radius: 16px; padding: 2.25rem; border: 1px solid #e2e8f0; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }`,
    `h2 { font-size: 1.35rem; color: #0f172a; margin: 0 0 1.25rem; font-weight: 700; }`,
    `.highlight-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.85rem; }`,
    `.highlight-list li { display: flex; align-items: center; gap: 0.65rem; font-size: 0.92rem; color: #334155; }`,
    `.check-icon { color: #16a34a; flex-shrink: 0; }`,
    `.not-found { text-align: center; padding: 4rem 1rem; }`,
    `@media (max-width: 768px) { h1 { font-size: 1.75rem; } }`
  ]
})
export class LocalityPageComponent implements OnInit {
  localityData?: LocalityInfo;
  whatsAppUrl = '';

  constructor(private route: ActivatedRoute, private seo: SeoService) {}

  ngOnInit(): void {
    const extractAndLoad = () => {
      let slug = this.route.snapshot.paramMap.get('slug') || '';
      if (!slug && this.route.snapshot.url.length > 0) {
        slug = this.route.snapshot.url[this.route.snapshot.url.length - 1].path;
      }
      const key = slug.replace('deep-cleaning-', '').toLowerCase();
      const matched = LOCALITY_DATA[key];

      if (!matched) {
        this.localityData = undefined;
        this.seo.generateTags({
          title: 'Deep Cleaning Services in Pune | APK Elite Services',
          description: 'Professional deep cleaning services across Pune localities including Baner, Wakad, Kharadi & Hinjewadi.',
          path: '/services'
        });
        return;
      }

      this.localityData = matched;
      const msg = `Hi, I need a Deep Cleaning quote for my home/office in ${matched.localityName}, Pune. Please share pricing and slot availability.`;
      this.whatsAppUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

      this.seo.generateTags({
        title: matched.metaTitle,
        description: matched.metaDescription,
        path: `/services/${matched.slug}`
      });
    };

    extractAndLoad();
    this.route.url.subscribe(() => extractAndLoad());
  }
}
