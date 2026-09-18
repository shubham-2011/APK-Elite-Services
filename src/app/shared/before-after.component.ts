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
    <section class="before-after-section" id="transformations">
      <div class="container-inner">
        <!-- Header -->
        <div class="header-box">
          <div class="badge-pill">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
            </svg>
            <span>Verified Results & Quality Benchmark</span>
          </div>
          <h2>Proven Transformations Across Pune Homes & Offices</h2>
          <p class="subtitle">
            Compare real initial site conditions with the hygienic, factory-restored finish our specialized equipment delivers.
          </p>

          <!-- Service Category Tabs -->
          <div class="tabs-container" role="tablist">
            <button
              *ngFor="let item of cases; let idx = index"
              (click)="activeIdx = idx"
              [class.active]="activeIdx === idx"
              class="tab-btn"
              role="tab"
              [attr.aria-selected]="activeIdx === idx"
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
                <span class="spec-item">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" class="spec-icon" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                  </svg>
                  <span>Duration: <strong>{{ cases[activeIdx].duration }}</strong></span>
                </span>
                <span class="spec-item">
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" class="spec-icon" aria-hidden="true">
                    <path fill-rule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C1.72 13.867 2.42 16 4.142 16H15.86c1.72 0 2.42-2.133 1.434-3.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7z" clip-rule="evenodd"/>
                  </svg>
                  <span>Standard: <strong>{{ cases[activeIdx].equipment }}</strong></span>
                </span>
              </div>
            </div>

            <div class="cta-col">
              <div class="price-box">
                <span class="price-sub">Fixed Upfront Starting At</span>
                <span class="price-val">{{ cases[activeIdx].startingPrice }}</span>
              </div>
              <a
                [href]="'https://wa.me/918830167863?text=Hi%20APK%20Elite%20Services,%20I%20saw%20your%20' + cases[activeIdx].service + '%20results%20and%20want%20a%20similar%20cleaning%20quote.%20[Ref:%20Web/BeforeAfter]'"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-wa"
                aria-label="Request quote on WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.35.49 1.199.533 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z"/>
                </svg>
                <span>Book This Service</span>
              </a>
            </div>
          </div>

          <!-- Side-by-Side Architectural Transformation Cards -->
          <div class="cards-grid">
            <!-- BEFORE -->
            <div class="state-card before-card">
              <div class="state-badge-row">
                <span class="state-badge before-badge">Initial Site Finding</span>
                <span class="state-caption">Pre-Treatment Condition</span>
              </div>
              <h4 class="state-title">{{ cases[activeIdx].beforeTitle }}</h4>
              <ul class="points-list">
                <li *ngFor="let pt of cases[activeIdx].beforePoints">
                  <span class="bullet-icon before-dot" aria-hidden="true">&ndash;</span>
                  <span>{{ pt }}</span>
                </li>
              </ul>
            </div>

            <!-- AFTER -->
            <div class="state-card after-card">
              <div class="state-badge-row">
                <span class="state-badge after-badge">APK Elite Delivered Standard</span>
                <span class="state-caption">Certified Hygienic Finish</span>
              </div>
              <h4 class="state-title">{{ cases[activeIdx].afterTitle }}</h4>
              <ul class="points-list">
                <li *ngFor="let pt of cases[activeIdx].afterPoints">
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="#16a34a" class="check-svg" aria-hidden="true">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
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
    `
      :host {
        display: block;
        background: #ffffff;
        color: #1e293b;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .before-after-section {
        padding: clamp(56px, 8vw, 92px) 1.25rem;
        border-top: 1px solid #e2e8f0;
      }

      .container-inner {
        max-width: 1160px;
        margin: 0 auto;
      }

      .header-box {
        text-align: center;
        max-width: 780px;
        margin: 0 auto 2.75rem;
      }

      .badge-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.35rem 0.9rem;
        border-radius: 9999px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        color: #0369a1;
        font-size: 0.76rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 0.9rem;
      }

      h2 {
        font-size: clamp(1.85rem, 4vw, 2.35rem);
        font-weight: 800;
        color: #0f2a3d;
        letter-spacing: -0.025em;
        margin: 0 0 0.8rem;
        line-height: 1.25;
      }

      .subtitle {
        font-size: 1.02rem;
        color: #64748b;
        margin: 0;
        line-height: 1.6;
      }

      /* Tabs */
      .tabs-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.6rem;
        margin-top: 1.75rem;
      }

      .tab-btn {
        padding: 0.6rem 1.25rem;
        border-radius: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #475569;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tab-btn:hover {
        background: #f1f5f9;
        color: #0f2a3d;
        border-color: #cbd5e1;
      }

      .tab-btn.active {
        background: #1e73be;
        border-color: #1e73be;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(30, 115, 190, 0.28);
      }

      /* Showcase Card */
      .showcase-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: clamp(1.25rem, 3.5vw, 2.25rem);
        box-shadow: 0 6px 24px -4px rgba(15, 23, 42, 0.05);
      }

      .showcase-top {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 1.5rem;
        margin-bottom: 1.75rem;
      }

      .meta-col {
        flex: 1;
        text-align: left;
      }

      .service-tag {
        font-size: 0.74rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #1e73be;
        display: block;
        margin-bottom: 0.25rem;
      }

      .case-heading {
        font-size: 1.35rem;
        color: #0f2a3d;
        margin: 0 0 0.6rem;
        font-weight: 800;
        line-height: 1.3;
      }

      .specs-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1.25rem;
        font-size: 0.84rem;
        color: #64748b;
      }

      .spec-item {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }

      .spec-icon {
        color: #94a3b8;
      }

      .specs-row strong {
        color: #1e293b;
      }

      .cta-col {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }

      .price-box {
        text-align: right;
      }

      .price-sub {
        font-size: 0.72rem;
        color: #64748b;
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        font-weight: 600;
      }

      .price-val {
        font-size: 1.35rem;
        font-weight: 800;
        color: #0f2a3d;
      }

      .btn-wa {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.35rem;
        border-radius: 12px;
        background: #16a34a;
        color: #ffffff;
        font-size: 0.88rem;
        font-weight: 700;
        text-decoration: none;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 3px 10px rgba(22, 163, 74, 0.25);
      }

      .btn-wa:hover {
        background: #15803d;
        transform: translateY(-1px);
        box-shadow: 0 5px 15px rgba(22, 163, 74, 0.35);
      }

      /* Cards Grid */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }

      .state-card {
        border-radius: 16px;
        padding: 1.65rem;
        display: flex;
        flex-direction: column;
      }

      .before-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      .after-card {
        background: #ffffff;
        border: 1px solid #bbf7d0;
        box-shadow: 0 4px 18px -2px rgba(22, 163, 74, 0.08);
      }

      .state-badge-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.9rem;
      }

      .state-badge {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
      }

      .before-badge {
        background: #e2e8f0;
        color: #475569;
      }

      .after-badge {
        background: #dcfce7;
        color: #15803d;
        border: 1px solid #86efac;
      }

      .state-caption {
        font-size: 0.74rem;
        color: #94a3b8;
        font-weight: 500;
      }

      .state-title {
        font-size: 1.02rem;
        color: #0f2a3d;
        margin: 0 0 1rem;
        font-weight: 700;
        line-height: 1.45;
      }

      .points-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }

      .points-list li {
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
        font-size: 0.88rem;
        color: #334155;
        line-height: 1.55;
      }

      .before-dot {
        font-weight: 900;
        color: #94a3b8;
        font-size: 1.1rem;
        line-height: 1;
      }

      .check-svg {
        flex-shrink: 0;
        margin-top: 0.15rem;
      }

      @media (max-width: 900px) {
        .showcase-top {
          flex-direction: column;
          align-items: flex-start;
        }
        .cta-col {
          width: 100%;
          justify-content: space-between;
        }
        .cards-grid {
          grid-template-columns: 1fr;
        }
      }
    `
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
