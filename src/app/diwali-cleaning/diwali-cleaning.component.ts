import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';
import { QuoteCalculatorComponent } from '../quote-calculator/quote-calculator.component';

const WA_NUMBER = '918830167863';

@Component({
  selector: 'app-diwali-cleaning',
  standalone: true,
  imports: [CommonModule, RouterLink, QuoteCalculatorComponent],
  template: `
    <section class="diwali-page">
      
      <!-- Hero Banner -->
      <div class="diwali-hero">
        <div class="hero-content">
          <span class="festival-badge">Diwali Special Offer 2026</span>
          <h1>Diwali Deep Cleaning Services in Pune</h1>
          <p class="hero-desc">Welcome prosperity and fresh energy into your home this festive season. Get thorough, top-to-bottom deep cleaning, sofa shampooing & sanitization by Pune's trusted team.</p>
          
          <div class="offer-box">
            <div class="offer-title">⚡ Pre-Diwali Booking Special: 15% OFF</div>
            <p>Book your cleaning slot before festival rush. Limited daily slots available in Baner, Wakad, Kharadi, Hinjewadi & PCMC.</p>
          </div>

          <div class="cta-group">
            <a [href]="whatsAppUrl" target="_blank" rel="noopener" class="btn-primary" data-umami-event="diwali-hero-whatsapp">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L0 24l6.335-1.502A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.52-5.17-1.426l-.37-.22-3.76.892.946-3.653-.24-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              <span>Book Diwali Slot on WhatsApp</span>
            </a>
            <a routerLink="/contact" class="btn-secondary">Request Call Back</a>
          </div>
        </div>
      </div>

      <!-- Checklist Section -->
      <div class="section-card">
        <h2>What's Included in Diwali Deep Cleaning?</h2>
        <p class="sub-text">Our comprehensive festival cleaning checklist covers every corner of your home:</p>
        
        <div class="grid-3">
          <div class="check-box">
            <h3>Kitchen Deep Cleaning</h3>
            <ul>
              <li>Degreasing chimney exterior & cabinets</li>
              <li>Scrubbing wall tiles & countertops</li>
              <li>Cleaning appliances exteriors</li>
              <li>Floor scrubbing & sanitization</li>
            </ul>
          </div>

          <div class="check-box">
            <h3>Bathroom Descaling</h3>
            <ul>
              <li>Hard water stain removal from tiles</li>
              <li>Sanitizing toilet, sink & shower fittings</li>
              <li>Mirror & glass partition cleaning</li>
              <li>Drain cleaning & disinfection</li>
            </ul>
          </div>

          <div class="check-box">
            <h3>Living & Bedroom Care</h3>
            <ul>
              <li>Cobweb removal & ceiling fan cleaning</li>
              <li>Window glass, tracks & mesh cleaning</li>
              <li>Sofa & carpet vacuuming/shampooing</li>
              <li>Single-disc machine floor scrubbing</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Calculator Section -->
      <app-quote-calculator></app-quote-calculator>

    </section>
  `,
  styles: [
    `:host { display: block; padding: 2.5rem 1.25rem 4rem; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }`,
    `.diwali-page { max-width: 1140px; margin: 0 auto; }`,
    `.diwali-hero { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; border-radius: 16px; padding: 2.5rem; margin-bottom: 2rem; border: 1px solid #334155; }`,
    `.festival-badge { display: inline-block; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.3rem 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; }`,
    `h1 { font-size: 2.2rem; margin: 0 0 0.75rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }`,
    `.hero-desc { font-size: 1rem; color: #cbd5e1; margin-bottom: 1.5rem; line-height: 1.6; max-width: 760px; }`,
    `.offer-box { background: rgba(255, 255, 255, 0.08); border: 1px dashed rgba(245, 158, 11, 0.5); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.75rem; }`,
    `.offer-title { font-weight: 700; color: #fbbf24; font-size: 1.05rem; margin-bottom: 0.25rem; }`,
    `.offer-box p { margin: 0; color: #e2e8f0; font-size: 0.88rem; }`,
    `.cta-group { display: flex; flex-wrap: wrap; gap: 0.85rem; }`,
    `.btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.35rem; border-radius: 8px; background: #16a34a; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: background 0.2s ease; }`,
    `.btn-primary:hover { background: #15803d; }`,
    `.btn-secondary { display: inline-flex; align-items: center; padding: 0.75rem 1.35rem; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; border: 1px solid rgba(255, 255, 255, 0.2); }`,
    `.btn-secondary:hover { background: rgba(255, 255, 255, 0.2); }`,
    `.section-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 2.25rem; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }`,
    `h2 { font-size: 1.4rem; color: #0f172a; margin: 0 0 0.4rem; font-weight: 700; }`,
    `.sub-text { color: #64748b; font-size: 0.92rem; margin: 0 0 1.5rem; }`,
    `.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }`,
    `.check-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }`,
    `.check-box h3 { font-size: 1.05rem; color: #0f172a; margin: 0 0 0.75rem; font-weight: 600; }`,
    `.check-box ul { padding-left: 1.1rem; margin: 0; color: #475569; font-size: 0.88rem; line-height: 1.6; }`,
    `@media (max-width: 768px) { .grid-3 { grid-template-columns: 1fr; } h1 { font-size: 1.75rem; } }`
  ]
})
export class DiwaliCleaningComponent implements OnInit {
  whatsAppUrl = '';

  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    const msg = 'Hi, I want to book a Diwali Deep Cleaning slot for my home in Pune. Please share available packages and 15% discount details.';
    this.whatsAppUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

    this.seo.generateTags({
      title: 'Diwali Deep Cleaning Services in Pune 2026 | APK Elite Services',
      description: 'Book festival deep cleaning in Pune for Diwali. Top-to-bottom home cleaning, sofa shampooing & sanitization in Baner, Wakad, Kharadi & Hinjewadi.',
      path: '/diwali-deep-cleaning-pune'
    });
  }
}
