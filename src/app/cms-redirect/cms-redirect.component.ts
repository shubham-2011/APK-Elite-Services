import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';

const DEFAULT_CMS_URL = 'http://localhost:3000';

@Component({
  selector: 'app-cms-redirect',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="cms-portal-container">
      <div class="cms-card">
        <div class="icon-badge">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>

        <h1>APK Elite Services — CMS Portal</h1>
        <p class="subtitle">Access the Internal Lead Management & Website Content Control Center.</p>

        <div class="url-info">
          <span class="label">Target Portal URL:</span>
          <code class="url-code">{{ cmsUrl }}</code>
        </div>

        <div class="actions">
          <a [href]="cmsUrl" target="_blank" rel="noopener noreferrer" class="btn-launch">
            <span>Launch CMS Dashboard</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </a>

          <a routerLink="/" class="btn-back">← Back to Website</a>
        </div>

        <div class="features-list">
          <div class="feat">✓ Real-time Lead Viewer</div>
          <div class="feat">✓ 1-Click WhatsApp & Call</div>
          <div class="feat">✓ Edit Prices & Form Fields</div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cms-portal-container {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .cms-card {
      background: white;
      max-width: 520px;
      width: 100%;
      border-radius: 24px;
      padding: 2.5rem;
      text-align: center;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }
    .icon-badge {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      box-shadow: 0 10px 25px rgba(2, 132, 199, 0.25);
    }
    h1 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem;
    }
    .subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }
    .url-info {
      background: #f1f5f9;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      text-align: left;
    }
    .label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }
    .url-code {
      font-family: monospace;
      font-size: 0.85rem;
      color: #0284c7;
      font-weight: 700;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .btn-launch {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #0284c7;
      color: white;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0.85rem 1.5rem;
      border-radius: 12px;
      transition: background 0.15s ease;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
    }
    .btn-launch:hover {
      background: #0369a1;
    }
    .btn-back {
      color: #64748b;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .btn-back:hover {
      color: #0f172a;
    }
    .features-list {
      display: flex;
      justify-content: center;
      gap: 1rem;
      border-top: 1px solid #f1f5f9;
      padding-top: 1.25rem;
      font-size: 0.75rem;
      color: #475569;
      font-weight: 600;
    }
    @media (max-width: 480px) {
      .features-list {
        flex-direction: column;
        gap: 0.4rem;
      }
    }
  `]
})
export class CmsRedirectComponent implements OnInit {
  cmsUrl = DEFAULT_CMS_URL;

  constructor(
    private seo: SeoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cmsUrl = (window as any).__APK_CMS_URL__ || DEFAULT_CMS_URL;
    }

    this.seo.generateTags({
      title: 'CMS Portal | APK Elite Services',
      description: 'Internal CMS viewer and lead management portal.',
      path: '/cms'
    });
  }
}
