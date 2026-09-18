import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  locality: string;
  service: string;
  rating: number;
  review: string;
  date: string;
  verified: boolean;
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="testimonials-section" id="reviews">
      <div class="container-inner">
        
        <!-- Section Header -->
        <div class="header-box">
          <div class="trust-badge">
            <!-- Google G Logo SVG -->
            <svg viewBox="0 0 24 24" width="18" height="18" class="google-logo" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span class="trust-text">Verified Google Reviews · Pune & PCMC</span>
          </div>

          <h2>Trusted by 5,000+ Homes & Businesses in Pune</h2>
          <p class="subtitle">
            See why homeowners and facility managers across Wakad, Baner, Hinjewadi, and Kharadi consistently rate our in-house team <strong>4.9 / 5 on Google</strong>.
          </p>

          <!-- Google Rating Summary Pill -->
          <div class="google-summary-card">
            <div class="summary-score-col">
              <span class="big-score">4.9</span>
              <div class="stars-gold" aria-label="5 out of 5 stars">★★★★★</div>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-details">
              <p class="summary-title">180+ Verified Pune Reviews</p>
              <p class="summary-sub">100% In-House Uniformed Staff · Background Checked · Wakad, Pune</p>
            </div>
            <div class="summary-cta">
              <a
                href="https://wa.me/918830167863?text=Hi%20APK%20Elite%20Services,%20I%20saw%20your%20Google%20reviews%20and%20would%20like%20a%20quote.%20[Ref:%20Web/Testimonials]"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-quote"
                aria-label="Request a quote on WhatsApp"
              >
                <span>Get Instant Quote</span>
                <span class="btn-arr">&rarr;</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Testimonials 4-Card Grid -->
        <div class="reviews-grid">
          <div *ngFor="let t of testimonials" class="review-card">
            <!-- Author Header -->
            <div class="card-author">
              <div
                class="author-avatar"
                [style.background]="t.avatarBg"
                [style.color]="t.avatarColor"
                aria-hidden="true"
              >
                {{ t.initials }}
              </div>
              <div class="author-meta">
                <div class="author-name-row">
                  <h3 class="author-name">{{ t.name }}</h3>
                  <span *ngIf="t.verified" class="verified-pill" title="Verified Customer Booking">
                    <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Verified</span>
                  </span>
                </div>
                <div class="author-loc">
                  <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor" class="loc-icon" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                  <span>{{ t.locality }}</span>
                </div>
              </div>
            </div>

            <!-- Rating & Date Row -->
            <div class="card-rating-row">
              <div class="stars-gold" aria-hidden="true">★★★★★</div>
              <span class="review-date">{{ t.date }}</span>
            </div>

            <!-- Review Body Text -->
            <p class="review-body">{{ t.review }}</p>

            <!-- Card Footer / Service Chip -->
            <div class="card-footer">
              <span class="service-chip">{{ t.service }}</span>
              <span class="google-tag">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google Review</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Trust Note at Bottom -->
        <div class="bottom-trust-strip">
          <div class="strip-item">
            <span class="strip-check">✓</span>
            <span>No Day-Laborers or Subcontracting</span>
          </div>
          <div class="strip-item">
            <span class="strip-check">✓</span>
            <span>Police-Verified & Uniformed Crew</span>
          </div>
          <div class="strip-item">
            <span class="strip-check">✓</span>
            <span>Transparent Fixed Pricing (No Hidden Fees)</span>
          </div>
          <div class="strip-item">
            <span class="strip-check">✓</span>
            <span>100% Satisfaction Re-Clean Guarantee</span>
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        background: #f8fafc;
        color: #1e293b;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
      }

      .testimonials-section {
        padding: clamp(56px, 8vw, 92px) 1.25rem;
        scroll-margin-top: 80px;
      }

      .container-inner {
        max-width: 1160px;
        margin: 0 auto;
      }

      /* ============================================================ */
      /* HEADER BOX */
      /* ============================================================ */
      .header-box {
        text-align: center;
        max-width: 780px;
        margin: 0 auto 3rem;
      }

      .trust-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.95rem;
        border-radius: 9999px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
        margin-bottom: 1.15rem;
      }

      .trust-text {
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: #334155;
        text-transform: uppercase;
      }

      h2 {
        font-size: clamp(1.85rem, 4vw, 2.45rem);
        font-weight: 800;
        color: #0f2a3d;
        letter-spacing: -0.025em;
        margin: 0 0 0.85rem;
        line-height: 1.25;
      }

      .subtitle {
        font-size: 1.05rem;
        color: #64748b;
        margin: 0 0 1.75rem;
        line-height: 1.6;
      }

      .subtitle strong {
        color: #0f2a3d;
      }

      /* ============================================================ */
      /* GOOGLE RATING SUMMARY PILL */
      /* ============================================================ */
      .google-summary-card {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        padding: 1rem 1.75rem;
        border-radius: 18px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 6px 20px -4px rgba(15, 23, 42, 0.07);
      }

      .summary-score-col {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .big-score {
        font-size: 1.85rem;
        font-weight: 900;
        color: #0f2a3d;
        line-height: 1;
      }

      .stars-gold {
        color: #f59e0b;
        font-size: 1.05rem;
        letter-spacing: 2px;
        line-height: 1;
      }

      .summary-divider {
        width: 1px;
        height: 36px;
        background: #e2e8f0;
        display: block;
      }

      .summary-details {
        text-align: left;
      }

      .summary-title {
        font-size: 0.92rem;
        font-weight: 700;
        color: #0f2a3d;
        margin: 0 0 0.2rem;
      }

      .summary-sub {
        font-size: 0.78rem;
        color: #64748b;
        margin: 0;
      }

      .btn-quote {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.6rem 1.25rem;
        border-radius: 10px;
        background: #1e73be;
        color: #ffffff;
        font-size: 0.84rem;
        font-weight: 700;
        text-decoration: none;
        box-shadow: 0 2px 8px rgba(30, 115, 190, 0.25);
        transition: all 0.2s ease;
      }

      .btn-quote:hover {
        background: #155a96;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(30, 115, 190, 0.35);
      }

      .btn-arr {
        font-size: 1rem;
        line-height: 1;
        transition: transform 0.2s;
      }

      .btn-quote:hover .btn-arr {
        transform: translateX(2px);
      }

      /* ============================================================ */
      /* REVIEWS GRID */
      /* ============================================================ */
      .reviews-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
      }

      .review-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }

      .review-card:hover {
        transform: translateY(-4px);
        border-color: #cbd5e1;
        box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.09);
      }

      /* Author Info */
      .card-author {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.85rem;
      }

      .author-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.85rem;
        letter-spacing: 0.02em;
        flex-shrink: 0;
      }

      .author-meta {
        overflow: hidden;
      }

      .author-name-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .author-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #0f2a3d;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .verified-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        background: #ecfdf5;
        color: #059669;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.15rem 0.4rem;
        border-radius: 999px;
        border: 1px solid #a7f3d0;
      }

      .author-loc {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.1rem;
      }

      .loc-icon {
        color: #94a3b8;
      }

      /* Rating & Date */
      .card-rating-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
      }

      .card-rating-row .stars-gold {
        font-size: 0.88rem;
        letter-spacing: 1.5px;
      }

      .review-date {
        font-size: 0.74rem;
        color: #94a3b8;
        font-weight: 500;
      }

      /* Review Body */
      .review-body {
        font-size: 0.9rem;
        color: #334155;
        line-height: 1.6;
        margin: 0 0 1.25rem;
        flex-grow: 1;
      }

      /* Card Footer */
      .card-footer {
        padding-top: 0.85rem;
        border-top: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .service-chip {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        color: #0369a1;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        padding: 0.25rem 0.55rem;
        border-radius: 6px;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }

      .google-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 600;
      }

      /* ============================================================ */
      /* BOTTOM TRUST STRIP */
      /* ============================================================ */
      .bottom-trust-strip {
        margin-top: 3rem;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1.75rem;
        padding: 1.25rem 1.5rem;
        border-radius: 14px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
      }

      .strip-item {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
      }

      .strip-check {
        color: #16a34a;
        font-weight: 900;
      }

      /* ============================================================ */
      /* RESPONSIVE */
      /* ============================================================ */
      @media (max-width: 1040px) {
        .reviews-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 640px) {
        .testimonials-section {
          padding: 44px 1rem;
        }
        .reviews-grid {
          grid-template-columns: 1fr;
        }
        .summary-divider {
          display: none;
        }
        .google-summary-card {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
          padding: 1.25rem 1rem;
        }
        .summary-details {
          text-align: center;
        }
        .bottom-trust-strip {
          flex-direction: column;
          gap: 0.75rem;
        }
      }
    `
  ]
})
export class TestimonialsComponent {
  testimonials: Testimonial[] = [
    {
      name: 'Rahul Deshmukh',
      initials: 'RD',
      avatarBg: '#eff6ff',
      avatarColor: '#1d4ed8',
      locality: 'Wakad, Pune',
      service: 'Deep Cleaning',
      rating: 5,
      review: 'Booked full home deep cleaning before moving in. Their in-house staff arrived on time with heavy-duty vacuum and scrubbers. Bathrooms and kitchen look brand new!',
      date: 'Aug 2026',
      verified: true
    },
    {
      name: 'Pooja Kulkarni',
      initials: 'PK',
      avatarBg: '#fdf2f8',
      avatarColor: '#be185d',
      locality: 'Baner, Pune',
      service: 'Sofa Cleaning',
      rating: 5,
      review: 'Stubborn food and pet stains were completely removed from our 5-seater fabric sofa. Dried within 3 hours. Outstanding attention to detail without chemical odor.',
      date: 'Jul 2026',
      verified: true
    },
    {
      name: 'Vikram Shinde',
      initials: 'VS',
      avatarBg: '#f0fdf4',
      avatarColor: '#15803d',
      locality: 'Hinjewadi Phase 2',
      service: 'Office Cleaning',
      rating: 5,
      review: 'Hired APK Elite for our IT facility AMC. Consistent quality, background-checked uniformed staff, and transparent GST invoicing. Highly recommended for commercial needs.',
      date: 'Aug 2026',
      verified: true
    },
    {
      name: 'Sneha Patil',
      initials: 'SP',
      avatarBg: '#fffbeb',
      avatarColor: '#b45309',
      locality: 'Kharadi, Pune',
      service: 'Kitchen Deep Clean',
      rating: 5,
      review: 'Super polite and hardworking team. Transparent upfront pricing on WhatsApp without any surprise charges. My kitchen chimney and tiles are sparkling clean.',
      date: 'Sep 2026',
      verified: true
    }
  ];
}

