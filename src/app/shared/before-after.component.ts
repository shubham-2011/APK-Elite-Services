import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BeforeAfterCase {
  id: string;
  title: string;
  service: string;
  startingPrice: string;
  beforeTitle: string;
  beforePoints: string[];
  afterTitle: string;
  afterPoints: string[];
  equipment: string;
  duration: string;
}

@Component({
  selector: 'app-before-after',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="before-after-section">
      <div class="container-inner">
        <!-- Header -->
        <div class="header-box">
          <div class="badge-pill">
            <span>✨ Visual Proof & Results</span>
          </div>
          <h2>See the Difference Our In-House Specialists Deliver</h2>
          <p class="subtitle">
            Real cleaning transformations delivered across Pune apartments, villas, and commercial offices.
          </p>

          <!-- Tabs -->
          <div class="tabs-container">
            <button
              *ngFor="let item of cases; let idx = index"
              (click)="activeIdx = idx"
              [class.active]="activeIdx === idx"
              class="tab-btn"
            >
              {{ item.title }}
            </button>
          </div>
        </div>

        <!-- Selected Case Showcase -->
        <div *ngIf="cases[activeIdx]" class="showcase-card">
          <div class="showcase-top">
            <div class="meta-col">
              <span class="service-tag">{{ cases[activeIdx].service }}</span>
              <h3 class="case-heading">{{ cases[activeIdx].title }}</h3>
              <div class="specs-row">
                <span>⏱️ Duration: <strong>{{ cases[activeIdx].duration }}</strong></span>
                <span>🧪 Chemical Standard: <strong>{{ cases[activeIdx].equipment }}</strong></span>
              </div>
            </div>

            <div class="cta-col">
              <div class="price-box">
                <span class="price-sub">Starting From</span>
                <span class="price-val">{{ cases[activeIdx].startingPrice }}</span>
              </div>
              <a
                [href]="'https://wa.me/918830167863?text=Hi%20APK%20Elite%20Services,%20I%20saw%20your%20' + cases[activeIdx].service + '%20results%20and%20want%20a%20similar%20cleaning%20quote.%20[Ref:%20Web/BeforeAfter]'"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-wa"
                aria-label="Book this cleaning on WhatsApp"
              >
                <span>💬 Get This Cleaned</span>
              </a>
            </div>
          </div>

          <!-- Side by Side Transformation Cards -->
          <div class="cards-grid">
            <!-- BEFORE -->
            <div class="state-card before-card">
              <div class="state-badge before-badge">
                <span>❌ BEFORE</span>
                <span>Unattended / Stained</span>
              </div>
              <h4>{{ cases[activeIdx].beforeTitle }}</h4>
              <ul class="points-list">
                <li *ngFor="let pt of cases[activeIdx].beforePoints">
                  <span class="bullet-x">•</span>
                  <span>{{ pt }}</span>
                </li>
              </ul>
            </div>

            <!-- AFTER -->
            <div class="state-card after-card">
              <div class="state-badge after-badge">
                <span>✅ AFTER</span>
                <span>APK In-House Deep Clean</span>
              </div>
              <h4>{{ cases[activeIdx].afterTitle }}</h4>
              <ul class="points-list">
                <li *ngFor="let pt of cases[activeIdx].afterPoints">
                  <span class="bullet-check">✓</span>
                  <span>{{ pt }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; background: #ffffff; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }`,
    `.before-after-section { padding: clamp(48px, 8vw, 80px) 1.25rem; border-top: 1px solid #e2e8f0; }`,
    `.container-inner { max-width: 1140px; margin: 0 auto; }`,
    `.header-box { text-align: center; max-width: 760px; margin: 0 auto 2.5rem; }`,
    `.badge-pill { display: inline-flex; align-items: center; padding: 0.35rem 0.85rem; border-radius: 9999px; background: #f0f9ff; border: 1px solid #bae6fd; color: #0284c7; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }`,
    `h2 { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0 0 0.75rem; line-height: 1.25; }`,
    `.subtitle { font-size: 1rem; color: #64748b; margin: 0; line-height: 1.6; }`,
    `.tabs-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; }`,
    `.tab-btn { padding: 0.55rem 1.15rem; border-radius: 10px; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }`,
    `.tab-btn:hover { background: #e2e8f0; color: #0f172a; }`,
    `.tab-btn.active { background: #0284c7; border-color: #0284c7; color: #ffffff; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); }`,
    `.showcase-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: clamp(1.25rem, 3vw, 2rem); box-shadow: 0 4px 16px rgba(0,0,0,0.03); }`,
    `.showcase-top { display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }`,
    `.meta-col { flex: 1; text-align: left; }`,
    `.service-tag { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #0284c7; }`,
    `.case-heading { font-size: 1.35rem; color: #0f172a; margin: 0.25rem 0 0.5rem; font-weight: 700; line-height: 1.3; }`,
    `.specs-row { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.82rem; color: #64748b; }`,
    `.specs-row strong { color: #0f172a; }`,
    `.cta-col { display: flex; align-items: center; gap: 1rem; }`,
    `.price-box { text-align: right; }`,
    `.price-sub { font-size: 0.75rem; color: #64748b; display: block; }`,
    `.price-val { font-size: 1.25rem; font-weight: 800; color: #0f172a; }`,
    `.btn-wa { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem; border-radius: 10px; background: #16a34a; color: #ffffff; font-size: 0.88rem; font-weight: 700; text-decoration: none; transition: background 0.2s; white-space: nowrap; }`,
    `.btn-wa:hover { background: #15803d; }`,
    `.cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }`,
    `.state-card { background: #ffffff; border-radius: 14px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }`,
    `.before-card { border: 2px solid #fecdd3; }`,
    `.after-card { border: 2px solid #a7f3d0; }`,
    `.state-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.85rem; }`,
    `.before-badge { background: #ffe4e6; color: #9f1239; }`,
    `.after-badge { background: #d1fae5; color: #065f46; }`,
    `.state-card h4 { font-size: 1rem; color: #0f172a; margin: 0 0 0.85rem; font-weight: 700; line-height: 1.4; }`,
    `.points-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }`,
    `.points-list li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.85rem; color: #475569; line-height: 1.5; }`,
    `.bullet-x { color: #e11d48; font-weight: 900; }`,
    `.bullet-check { color: #16a34a; font-weight: 900; }`,
    `@media (max-width: 860px) { .showcase-top { flex-direction: column; align-items: flex-start; } .cta-col { width: 100%; justify-content: space-between; } .cards-grid { grid-template-columns: 1fr; } }`
  ]
})
export class BeforeAfterComponent {
  activeIdx = 0;

  cases: BeforeAfterCase[] = [
    {
      id: 'kitchen',
      title: 'Kitchen Chimney & Grout Degreasing',
      service: 'Kitchen Deep Cleaning',
      startingPrice: '₹1,299',
      duration: '2 - 3 Hours',
      equipment: 'Taski Degreaser & Steam Buffing',
      beforeTitle: 'Accumulated cooking oil, sticky yellow exhaust & dirty tile grouting',
      beforePoints: [
        'Thick sticky oil layer coating chimney mesh filters',
        'Yellowed oil streaks on back-splash wall tiles',
        'Grease accumulation on exhaust fan blades causing low airflow',
        'Stale rancid oil odor persisting across the kitchen'
      ],
      afterTitle: '100% degreased, spotless tiles & odor-free stainless finish',
      afterPoints: [
        'Mesh filters hot-chemical-treated and restored to factory shine',
        'Tile grout steam scrubbed and sanitized without surface scratches',
        'Counters and cabinets disinfected with food-grade Taski solutions',
        'Fresh, hygienic workspace ready for safe family cooking'
      ]
    },
    {
      id: 'sofa',
      title: 'Fabric Sofa Deep Extraction',
      service: 'Sofa Shampooing',
      startingPrice: '₹799',
      duration: '1.5 - 2 Hours',
      equipment: 'Kärcher Injection-Extraction System',
      beforeTitle: 'Embedded dust mites, spilled tea/coffee marks & pet stains',
      beforePoints: [
        'Dark coffee/tea patches on seating cushions',
        'Fine construction dust deeply settled into upholstery fabric',
        'Dull, faded look from years of everyday use',
        'Mildew or musty damp odor inside foam cushions'
      ],
      afterTitle: 'Revitalized fabric, extracted contaminants & rapid drying',
      afterPoints: [
        'Deep chemical injection breaks down deep-set stains',
        'Powerful suction extracts 95% of dirty water & microscopic mites',
        'Original fabric color and soft texture fully restored',
        'Quick-dry technology ensures sofa is usable within 3 to 4 hours'
      ]
    },
    {
      id: 'bathroom',
      title: 'Bathroom Hard-Water Descaling',
      service: 'Bathroom Deep Cleaning',
      startingPrice: '₹799',
      duration: '1.5 - 2 Hours',
      equipment: 'Acid-Free Taski R9 & Hard-Water Buffers',
      beforeTitle: 'White calcium mineral crust on glass, tiles & chrome fittings',
      beforePoints: [
        'Opaque calcified film covering shower glass partitions',
        'Clogged, tarnished chrome taps and showerheads',
        'Yellow/black water scaling in tile corners and commode rim',
        'Slippery tile surface prone to soap scum accumulation'
      ],
      afterTitle: 'Sparkling chrome, crystal-clear glass & sanitized floor',
      afterPoints: [
        'Shower glass restored to 100% transparency with specialized descalers',
        'Chrome taps and showerheads buffed to original silver gloss',
        'Grout and commode fully sanitized with hospital-grade disinfectant',
        'Pleasant floral scent with long-lasting anti-scale protection'
      ]
    },
    {
      id: 'floor',
      title: 'Marble & Granite Crystallization',
      service: 'Floor Polishing',
      startingPrice: '₹1,999',
      duration: '3 - 5 Hours',
      equipment: 'Single-Disc Heavy Rotary Scrubber + Diamond Pads',
      beforeTitle: 'Micro-scratched dull stone, traffic marks & lost reflection',
      beforePoints: [
        'Loss of stone shine from foot traffic and acidic mopping liquids',
        'Visible scratch marks and uneven cloudy spots',
        'Dirty grout lines absorbing dust and muddy water',
        'Rough feel under bare feet'
      ],
      afterTitle: 'High-gloss mirror reflection & hardened stone sealant',
      afterPoints: [
        'Graduated diamond grit sanding flattens microscopic scratches',
        'Crystallization powder creates a mirror-like light reflection',
        'Stone pores sealed to prevent future wine, oil, or water stains',
        'Adds luxury aesthetic appeal to your living and dining areas'
      ]
    }
  ];
}
