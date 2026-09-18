import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ContentApiService, ShowcaseProjectItem } from '../shared/content-api.service';

@Component({
  selector: 'app-job-showcase',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="showcase-section" id="projects-showcase">
      <div class="section-header">
        <h2>{{ heading }}</h2>
        <p>{{ subheading }}</p>
      </div>

      <div class="showcase-grid">
        <div class="showcase-card" *ngFor="let item of workItems">
          <div class="card-image">
            <img [src]="item.imageUrl" [alt]="item.title" loading="lazy" width="400" height="260" />
            <span class="category-badge">{{ item.category }}</span>
          </div>
          <div class="card-content">
            <div class="location-tag">
              <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <span>{{ item.location }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 3.5rem 1.25rem; background: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; border-bottom: 1px solid #e2e8f0; }`,
    `.showcase-section { max-width: 1140px; margin: 0 auto; }`,
    `.section-header { text-align: center; margin-bottom: 2.5rem; }`,
    `h2 { font-size: clamp(1.85rem, 4vw, 2.35rem); color: #0f172a; margin: 0 0 0.6rem; font-weight: 800; letter-spacing: -0.025em; line-height: 1.25; }`,
    `.section-header p { color: #64748b; font-size: 1rem; margin: 0 auto; max-width: 680px; line-height: 1.6; }`,
    `.showcase-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }`,
    `.showcase-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04); transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }`,
    `.showcase-card:hover { transform: translateY(-3px); border-color: #cbd5e1; box-shadow: 0 12px 24px -4px rgba(15, 23, 42, 0.08); }`,
    `.card-image { position: relative; height: 220px; overflow: hidden; background: #f1f5f9; }`,
    `.card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }`,
    `.showcase-card:hover .card-image img { transform: scale(1.03); }`,
    `.category-badge { position: absolute; top: 12px; right: 12px; background: rgba(15, 23, 42, 0.88); color: white; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 6px; letter-spacing: 0.03em; backdrop-filter: blur(4px); }`,
    `.card-content { padding: 1.35rem; }`,
    `.location-tag { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: #0284c7; font-weight: 700; margin-bottom: 0.5rem; }`,
    `h3 { font-size: 1.12rem; color: #0f172a; margin: 0 0 0.5rem; font-weight: 700; line-height: 1.35; }`,
    `p { font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.6; }`,
    `@media (max-width: 960px) { .showcase-grid { grid-template-columns: repeat(2, 1fr); } }`,
    `@media (max-width: 640px) { .showcase-grid { grid-template-columns: 1fr; } }`
  ]
})
export class JobShowcaseComponent implements OnInit, OnDestroy {
  heading = 'Recent Cleaning Projects in Pune';
  subheading = 'Explore recent residential and commercial cleaning work completed by our trained in-house team across Pune & PCMC.';

  workItems: ShowcaseProjectItem[] = [
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
  ];

  private contentSub?: Subscription;

  constructor(private contentApi: ContentApiService) {}

  ngOnInit(): void {
    this.contentSub = this.contentApi.content$.subscribe(content => {
      if (content?.showcase) {
        if (content.showcase.heading) {
          this.heading = content.showcase.heading;
        }
        if (content.showcase.subheading) {
          this.subheading = content.showcase.subheading;
        }
        if (content.showcase.projects && content.showcase.projects.length > 0) {
          this.workItems = content.showcase.projects;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.contentSub?.unsubscribe();
  }
}

