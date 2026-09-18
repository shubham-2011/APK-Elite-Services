import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeoService } from '../seo.service';
import { getServiceBySlug, ServiceItem } from '../shared/service-catalog';
import { FootmarkApiService } from '../shared/footmark-api.service';

const BASE_URL = 'https://www.apkeliteservices.in';
const WA_NUMBER = '918830167863';

@Component({
  selector: 'app-service-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="service-page" *ngIf="service; else notFound">

      <!-- Hero -->
      <div class="service-hero">
        <div class="service-content">
          <span class="eyebrow">APK Elite Services · Pune</span>
          <h1>{{ service.title }}</h1>
          <p class="summary">{{ service.shortDescription }}</p>

          <!-- Pricing tag -->
          <div class="price-tag">
            <span class="price-label">Pricing:</span>
            <span class="price-val">{{ service.startingPrice }}</span>
          </div>

          <!-- CTA row -->
          <div class="cta-row">
            <a class="cta-whatsapp"
               [href]="'https://wa.me/' + waNumber + '?text=' + service.whatsappMessage"
               (click)="onWhatsAppClick('service_hero')"
               target="_blank"
               rel="noopener"
               data-umami-event="whatsapp-service-click"
               [attr.data-umami-event-service]="service.slug">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L0 24l6.335-1.502A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.52-5.17-1.426l-.37-.22-3.76.892.946-3.653-.24-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              <span>Get Quote on WhatsApp</span>
            </a>
            <a class="cta-call" href="tel:+918830167863" (click)="onPhoneClick()" data-umami-event="call-service-click" [attr.data-umami-event-service]="service.slug">
              <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              <span>Call Now</span>
            </a>
          </div>
        </div>
        <div class="service-image">
          <img [src]="service.imageUrl" [alt]="service.title" width="600" height="400" loading="lazy" />
        </div>
      </div>

      <!-- Trust Features -->
      <div class="trust-row">
        <div class="pill">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          <span>Trained In-House Staff</span>
        </div>
        <div class="pill">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          <span>Eco-Friendly Solutions</span>
        </div>
        <div class="pill">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          <span>Insured Service Guarantee</span>
        </div>
      </div>

      <!-- Service Details -->
      <div class="service-body">
        <h2>Service Overview</h2>
        <p>{{ service.description }}</p>

        <!-- Inline CTA box -->
        <div class="inline-cta">
          <div class="cta-text">
            <h3>Need a customized quote for your property?</h3>
            <p>Our team is available 7 days a week to answer queries and provide instant estimates.</p>
          </div>
          <div class="cta-btns">
            <a class="cta-whatsapp"
               [href]="'https://wa.me/' + waNumber + '?text=' + service.whatsappMessage"
               (click)="onWhatsAppClick('service_body')"
               target="_blank" rel="noopener"
               data-umami-event="whatsapp-service-body-click"
               [attr.data-umami-event-service]="service.slug">
              <span>WhatsApp Us</span>
            </a>
            <a routerLink="/contact" class="cta-contact" data-umami-event="contact-form-click" [attr.data-umami-event-service]="service.slug">Submit Online Form</a>
          </div>
        </div>

        <div class="service-links">
          <a routerLink="/" class="back-link">← Return to Home</a>
          <a routerLink="/services" class="back-link">Browse All Services</a>
        </div>
      </div>
    </section>

    <ng-template #notFound>
      <section class="service-page not-found">
        <h1>Service not found</h1>
        <p>The requested service is not listed in our catalog.</p>
        <a routerLink="/services" class="back-link">View all available services</a>
      </section>
    </ng-template>
  `,
  styles: [
    `:host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #f8fafc; padding: 2rem 1.25rem 4rem; }`,
    `.service-page { max-width: 1140px; margin: 0 auto; }`,
    `.service-hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2.5rem; align-items: center; background: white; padding: 2.5rem; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }`,
    `.eyebrow { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0284c7; margin-bottom: 0.5rem; display: inline-block; }`,
    `h1 { font-size: 2.2rem; color: #0f172a; margin: 0 0 0.75rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }`,
    `.summary { font-size: 1.05rem; line-height: 1.6; color: #475569; margin: 0 0 1.25rem; }`,
    `.price-tag { display: inline-flex; align-items: center; gap: 0.5rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.4rem 0.85rem; margin-bottom: 1.5rem; }`,
    `.price-label { font-size: 0.8rem; font-weight: 600; color: #15803d; text-transform: uppercase; }`,
    `.price-val { font-size: 1rem; font-weight: 700; color: #166534; }`,
    `.cta-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }`,
    `.cta-whatsapp { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.35rem; border-radius: 8px; background: #16a34a; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: background 0.2s ease; border: none; cursor: pointer; }`,
    `.cta-whatsapp:hover { background: #15803d; }`,
    `.cta-call { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.35rem; border-radius: 8px; background: #0f172a; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: background 0.2s ease; }`,
    `.cta-call:hover { background: #1e293b; }`,
    `.service-image img { width: 100%; height: auto; aspect-ratio: 4 / 3; border-radius: 12px; object-fit: cover; border: 1px solid #e2e8f0; }`,
    `.trust-row { display: flex; flex-wrap: wrap; gap: 0.85rem; margin: 1.5rem 0; }`,
    `.pill { display: inline-flex; align-items: center; gap: 0.45rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.9rem; font-size: 0.85rem; font-weight: 500; color: #334155; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }`,
    `.service-body { background: white; padding: 2.25rem; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); color: #334155; line-height: 1.7; font-size: 0.95rem; }`,
    `h2 { color: #0f172a; font-size: 1.35rem; margin-top: 0; margin-bottom: 0.75rem; font-weight: 700; }`,
    `.inline-cta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.75rem; margin: 2rem 0; display: flex; flex-direction: column; gap: 1rem; }`,
    `.cta-text h3 { margin: 0 0 0.35rem; font-size: 1.1rem; color: #0f172a; font-weight: 600; }`,
    `.cta-text p { margin: 0; color: #64748b; font-size: 0.9rem; }`,
    `.cta-btns { display: flex; flex-wrap: wrap; gap: 0.75rem; }`,
    `.cta-contact { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.35rem; border-radius: 8px; background: #0284c7; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: background 0.2s ease; }`,
    `.cta-contact:hover { background: #0369a1; }`,
    `.service-links { margin-top: 1.75rem; display: flex; gap: 1rem; flex-wrap: wrap; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; }`,
    `.back-link { font-size: 0.88rem; color: #0284c7; text-decoration: none; font-weight: 500; }`,
    `.back-link:hover { text-decoration: underline; }`,
    `.not-found { text-align: center; padding: 4rem 1rem; }`,
    `@media (max-width: 840px) { .service-hero { grid-template-columns: 1fr; } h1 { font-size: 1.75rem; } }`
  ]
})
export class ServicePageComponent implements OnInit, OnDestroy {
  service?: ServiceItem;
  readonly waNumber = WA_NUMBER;

  constructor(
    private route: ActivatedRoute,
    private seo: SeoService,
    private footmarkApi: FootmarkApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      const matchedService = getServiceBySlug(slug);
      if (!matchedService) {
        this.service = undefined;
        this.seo.generateTags({
          title: 'Service Not Found | APK Elite Services',
          description: 'The requested service page does not exist. Browse all cleaning and facility services by APK Elite Services in Pune.',
          path: '/services'
        });
        return;
      }

      this.service = matchedService;

      if (isPlatformBrowser(this.platformId)) {
        this.footmarkApi.trackServiceView(
          matchedService.slug,
          matchedService.title,
          matchedService.startingPrice
        );
      }

      const pagePath = `/services/${matchedService.slug}`;
      this.seo.generateTags({
        title: matchedService.metaTitle,
        description: matchedService.metaDescription,
        path: pagePath,
        image: `${BASE_URL}${matchedService.imageUrl}`
      });

      this.seo.setJsonLd('service-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: matchedService.title,
        description: matchedService.metaDescription,
        url: `${BASE_URL}${pagePath}`,
        image: `${BASE_URL}${matchedService.imageUrl}`,
        areaServed: { '@type': 'City', name: 'Pune' },
        provider: { '@id': `${BASE_URL}/#business` }
      });

      this.seo.setJsonLd('breadcrumb-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${BASE_URL}/services` },
          { '@type': 'ListItem', position: 3, name: matchedService.title, item: `${BASE_URL}${pagePath}` }
        ]
      });
    });
  }

  onWhatsAppClick(position: string): void {
    if (this.service) {
      this.footmarkApi.trackWhatsAppClick(
        this.service.slug,
        this.service.title,
        position,
        window.location.pathname
      );
    }
  }

  onPhoneClick(): void {
    if (this.service) {
      this.footmarkApi.trackPhoneClick(
        this.service.slug,
        this.service.title,
        window.location.pathname
      );
    }
  }

  ngOnDestroy(): void {
    this.seo.removeJsonLd('service-jsonld');
    this.seo.removeJsonLd('breadcrumb-jsonld');
  }
}
