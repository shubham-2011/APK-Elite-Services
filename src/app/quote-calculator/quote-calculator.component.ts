import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const WA_NUMBER = '918830167863';

@Component({
  selector: 'app-quote-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="calculator-section">
      <div class="calculator-card">
        <div class="calc-header">
          <h2>Calculate Your Cleaning Rate</h2>
          <p>Select your property configuration to calculate an estimated price range.</p>
        </div>

        <div class="calc-body">
          <!-- Step 1: Property Type -->
          <div class="calc-group">
            <label class="group-label">1. Property Configuration</label>
            <div class="options-grid">
              <button type="button" 
                      class="option-btn" 
                      [class.active]="propertySize === '1bhk'"
                      (click)="propertySize = '1bhk'; calculate()">
                <span>1 BHK</span>
              </button>
              <button type="button" 
                      class="option-btn" 
                      [class.active]="propertySize === '2bhk'"
                      (click)="propertySize = '2bhk'; calculate()">
                <span>2 BHK</span>
              </button>
              <button type="button" 
                      class="option-btn" 
                      [class.active]="propertySize === '3bhk'"
                      (click)="propertySize = '3bhk'; calculate()">
                <span>3 BHK</span>
              </button>
              <button type="button" 
                      class="option-btn" 
                      [class.active]="propertySize === 'villa'"
                      (click)="propertySize = 'villa'; calculate()">
                <span>4 BHK / Villa</span>
              </button>
            </div>
          </div>

          <!-- Step 2: Occupancy Status -->
          <div class="calc-group">
            <label class="group-label">2. Occupancy Status</label>
            <div class="options-grid two-col">
              <button type="button" 
                      class="option-btn" 
                      [class.active]="occupancy === 'unfurnished'"
                      (click)="occupancy = 'unfurnished'; calculate()">
                <span>Vacant / Unfurnished</span>
              </button>
              <button type="button" 
                      class="option-btn" 
                      [class.active]="occupancy === 'furnished'"
                      (click)="occupancy = 'furnished'; calculate()">
                <span>Occupied / Furnished</span>
              </button>
            </div>
          </div>

          <!-- Step 3: Add-on Services -->
          <div class="calc-group">
            <label class="group-label">3. Add-On Services (Optional)</label>
            <div class="addon-grid">
              <label class="addon-chip" [class.selected]="addons.sofa">
                <input type="checkbox" [(ngModel)]="addons.sofa" (change)="calculate()" />
                <span>Sofa Shampooing (+₹599)</span>
              </label>
              <label class="addon-chip" [class.selected]="addons.pest">
                <input type="checkbox" [(ngModel)]="addons.pest" (change)="calculate()" />
                <span>Pest Control (+₹699)</span>
              </label>
              <label class="addon-chip" [class.selected]="addons.balcony">
                <input type="checkbox" [(ngModel)]="addons.balcony" (change)="calculate()" />
                <span>Balcony Jet Wash (+₹399)</span>
              </label>
            </div>
          </div>

          <!-- Result Box -->
          <div class="result-box">
            <div class="estimate-text">
              <span class="est-label">Estimated Rate Range</span>
              <div class="est-price">₹{{ minPrice.toLocaleString('en-IN') }} – ₹{{ maxPrice.toLocaleString('en-IN') }}</div>
              <span class="est-note">*Final quote verified based on property condition</span>
            </div>

            <a [href]="whatsAppUrl" target="_blank" rel="noopener" class="calc-cta-btn" data-umami-event="calculator-whatsapp-click">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L0 24l6.335-1.502A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.52-5.17-1.426l-.37-.22-3.76.892.946-3.653-.24-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              <span>Book Estimate on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 3rem 1.25rem; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }`,
    `.calculator-section { max-width: 1140px; margin: 0 auto; }`,
    `.calculator-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 2.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); max-width: 820px; margin: 0 auto; }`,
    `.calc-header { text-align: center; margin-bottom: 2rem; }`,
    `h2 { font-size: 1.6rem; color: #0f172a; margin: 0 0 0.4rem; font-weight: 700; letter-spacing: -0.01em; }`,
    `.calc-header p { color: #64748b; font-size: 0.92rem; margin: 0; }`,
    `.calc-group { margin-bottom: 1.35rem; }`,
    `.group-label { display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.5rem; }`,
    `.options-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }`,
    `.options-grid.two-col { grid-template-columns: 1fr 1fr; }`,
    `.option-btn { padding: 0.75rem 0.5rem; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: #334155; cursor: pointer; transition: all 0.15s ease; text-align: center; font-family: inherit; }`,
    `.option-btn:hover { border-color: #0f172a; }`,
    `.option-btn.active { border-color: #0f172a; background: #0f172a; color: white; }`,
    `.addon-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }`,
    `.addon-chip { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; font-weight: 500; color: #334155; cursor: pointer; background: white; transition: all 0.15s ease; }`,
    `.addon-chip.selected { border-color: #16a34a; background: #f0fdf4; color: #15803d; font-weight: 600; }`,
    `.addon-chip input { cursor: pointer; }`,
    `.result-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-top: 1.75rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }`,
    `.estimate-text { display: flex; flex-direction: column; }`,
    `.est-label { font-size: 0.78rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }`,
    `.est-price { font-size: 1.65rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }`,
    `.est-note { font-size: 0.78rem; color: #94a3b8; }`,
    `.calc-cta-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.35rem; border-radius: 8px; background: #16a34a; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: background 0.2s ease; border: none; cursor: pointer; white-space: nowrap; }`,
    `.calc-cta-btn:hover { background: #15803d; }`,
    `@media (max-width: 640px) { .options-grid { grid-template-columns: 1fr 1fr; } .result-box { flex-direction: column; text-align: center; } }`
  ]
})
export class QuoteCalculatorComponent {
  propertySize: '1bhk' | '2bhk' | '3bhk' | 'villa' = '2bhk';
  occupancy: 'unfurnished' | 'furnished' = 'furnished';
  addons = {
    sofa: false,
    pest: false,
    balcony: false
  };

  minPrice = 3499;
  maxPrice = 3999;
  whatsAppUrl = '';

  constructor() {
    this.calculate();
  }

  calculate() {
    let baseMin = 2499;
    let baseMax = 2999;

    if (this.propertySize === '1bhk') {
      baseMin = 2499;
      baseMax = 2999;
    } else if (this.propertySize === '2bhk') {
      baseMin = 3299;
      baseMax = 3799;
    } else if (this.propertySize === '3bhk') {
      baseMin = 4299;
      baseMax = 4999;
    } else if (this.propertySize === 'villa') {
      baseMin = 6999;
      baseMax = 8999;
    }

    if (this.occupancy === 'furnished') {
      baseMin += 500;
      baseMax += 700;
    }

    if (this.addons.sofa) {
      baseMin += 599;
      baseMax += 599;
    }
    if (this.addons.pest) {
      baseMin += 699;
      baseMax += 699;
    }
    if (this.addons.balcony) {
      baseMin += 399;
      baseMax += 399;
    }

    this.minPrice = baseMin;
    this.maxPrice = baseMax;

    const propLabel = this.propertySize.toUpperCase();
    const occLabel = this.occupancy === 'furnished' ? 'Furnished' : 'Unfurnished';
    const msg = `Hi, I calculated an estimate on your website for a ${propLabel} (${occLabel}). Estimated range: ₹${this.minPrice} - ₹${this.maxPrice}. Please confirm booking availability in Pune.`;
    this.whatsAppUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  }
}
