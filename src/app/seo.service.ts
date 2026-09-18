import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

const BASE_URL = 'https://www.apkeliteservices.in';
const DEFAULT_IMAGE = `${BASE_URL}/assets/images/logo-res.png`;

export interface SeoConfig {
  title: string;
  description: string;
  /** Route path starting with '/', e.g. '/services/deep-cleaning'. Use '/' for home. */
  path: string;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  generateTags(config: SeoConfig) {
    const url = this.absoluteUrl(config.path);
    const image = config.image ?? DEFAULT_IMAGE;

    this.titleService.setTitle(config.title);

    this.metaService.updateTag({ name: 'description', content: config.description });

    // Open Graph (Facebook / LinkedIn / WhatsApp)
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'APK Elite Services' });
    this.metaService.updateTag({ property: 'og:locale', content: 'en_IN' });
    this.metaService.updateTag({ property: 'og:title', content: config.title });
    this.metaService.updateTag({ property: 'og:description', content: config.description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:image:alt', content: `${config.title} - APK Elite Services` });
    this.metaService.updateTag({ property: 'article:publisher', content: 'https://www.facebook.com/profile.php?id=61594602086607' });

    // Twitter Cards
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:url', content: url });
    this.metaService.updateTag({ name: 'twitter:title', content: config.title });
    this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
    this.metaService.updateTag({ name: 'twitter:image:alt', content: `${config.title} - APK Elite Services` });

    // Canonical must match the page URL, otherwise Google folds
    // every page into the homepage and never shows sitelinks.
    this.setCanonical(url);
  }

  /** Insert or replace a JSON-LD block identified by element id. */
  setJsonLd(id: string, data: object) {
    const json = JSON.stringify(data);
    const existing = this.document.getElementById(id);
    if (existing) {
      existing.textContent = json;
      return;
    }
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = json;
    this.document.head.appendChild(script);
  }

  removeJsonLd(id: string) {
    this.document.getElementById(id)?.remove();
  }

  private setCanonical(url: string) {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private absoluteUrl(path: string): string {
    if (!path || path === '/') {
      return `${BASE_URL}/`;
    }
    return `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  }
}
