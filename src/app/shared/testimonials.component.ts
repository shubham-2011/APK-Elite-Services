import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  name: string;
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
    <section class="testimonials-section">
      <div class="container-inner">
        <!-- Header & Overall Rating -->
        <div class="header-box">
          <div class="badge-pill">
            <span class="stars-gold">★★★★★</span>
            <span class="badge-text">Verified Pune Customer Reviews</span>
          </div>

          <h2>Trusted by 5,000+ Homes & Offices in Pune</h2>
          <p class="subtitle">
            See why homeowners in Wakad, Baner, Hinjewadi, and Kharadi rate us 
            <strong>4.9/5 on Google</strong>.
          </p>

          <!-- Google Rating Summary Pill -->
          <div class="google-rating-card">
            <div class="rating-num">
              <span class="score">4.9</span>
              <div class="stars-gold">★★★★★</div>
            </div>
            <div class="divider"></div>
            <div class="rating-meta">
              <p class="count">180+ Google Reviews</p>
              <p class="sub-meta">100% In-House Staff · Wakad, Pune</p>
            </div>
            <a
              href="https://wa.me/918830167863?text=Hi%20APK%20Elite%20Services,%20I%20saw%20your%20Google%20reviews%20and%20would%20like%20a%20quote.%20[Ref:%20Web/Testimonials]"
              target="_blank"
              rel="noopener noreferrer"
              class="quote-link"
              aria-label="Get a fast quote on WhatsApp"
            >
              Get a Fast Quote &rarr;
            </a>
          </div>
        </div>

        <!-- Testimonials Grid -->
        <div class="reviews-grid">
          <div *ngFor="let t of testimonials" class="review-card">
            <div class="review-body">
              <div class="stars-row">
                <div class="stars-gold">
                  <span *ngFor="let s of [1,2,3,4,5]">★</span>
                </div>
                <span class="review-date">{{ t.date }}</span>
              </div>
              <p class="review-text">&ldquo;{{ t.review }}&rdquo;</p>
            </div>

            <div class="review-footer">
              <div class="reviewer-info">
                <h4 class="reviewer-name">
                  {{ t.name }}
                  <span *ngIf="t.verified" class="verified-check" title="Verified Customer">✓</span>
                </h4>
                <p class="reviewer-loc">📍 {{ t.locality }}</p>
              </div>
              <span class="service-pill">{{ t.service }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }`,
    `.testimonials-section { padding: clamp(48px, 8vw, 80px) 1.25rem; }`,
    `.container-inner { max-width: 1140px; margin: 0 auto; }`,
    `.header-box { text-align: center; max-width: 720px; margin: 0 auto 3rem; }`,
    `.badge-pill { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.85rem; border-radius: 9999px; background: #1e293b; border: 1px solid #334155; margin-bottom: 1rem; }`,
    `.stars-gold { color: #f59e0b; font-size: 0.95rem; letter-spacing: 1px; }`,
    `.badge-text { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #e2e8f0; }`,
    `h2 { font-size: clamp(1.75rem, 4vw, 2.35rem); font-weight: 800; color: #ffffff; letter-spacing: -0.02em; margin: 0 0 0.75rem; line-height: 1.2; }`,
    `.subtitle { font-size: 1rem; color: #94a3b8; margin: 0; line-height: 1.6; }`,
    `.subtitle strong { color: #f59e0b; }`,
    `.google-rating-card { margin-top: 1.75rem; display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1.25rem; padding: 1rem 1.5rem; border-radius: 16px; background: rgba(30, 41, 59, 0.85); border: 1px solid #334155; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }`,
    `.rating-num { display: flex; align-items: center; gap: 0.5rem; font-size: 1.5rem; font-weight: 900; color: #ffffff; }`,
    `.score { color: #f59e0b; }`,
    `.divider { width: 1px; height: 32px; background: #334155; display: block; }`,
    `.rating-meta { text-align: left; }`,
    `.rating-meta .count { font-size: 0.85rem; font-weight: 700; color: #ffffff; margin: 0; }`,
    `.rating-meta .sub-meta { font-size: 0.75rem; color: #94a3b8; margin: 0; }`,
    `.quote-link { padding: 0.55rem 1.1rem; border-radius: 10px; background: #0284c7; color: #ffffff; font-size: 0.8rem; font-weight: 700; text-decoration: none; transition: background 0.2s; }`,
    `.quote-link:hover { background: #0369a1; }`,
    `.reviews-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }`,
    `.review-card { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; transition: border-color 0.2s, transform 0.2s; }`,
    `.review-card:hover { border-color: #475569; transform: translateY(-3px); }`,
    `.stars-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; }`,
    `.review-date { font-size: 0.75rem; color: #64748b; font-weight: 500; }`,
    `.review-text { font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin: 0 0 1.25rem; font-style: italic; }`,
    `.review-footer { pt: 1rem; border-top: 1px solid rgba(51, 65, 85, 0.8); display: flex; align-items: center; justify-content: space-between; }`,
    `.reviewer-name { font-size: 0.9rem; font-weight: 700; color: #ffffff; margin: 0; display: flex; align-items: center; gap: 0.35rem; }`,
    `.verified-check { color: #34d399; font-size: 0.8rem; font-weight: 900; }`,
    `.reviewer-loc { font-size: 0.75rem; color: #94a3b8; margin: 0.15rem 0 0; }`,
    `.service-pill { padding: 0.25rem 0.6rem; border-radius: 6px; background: #334155; color: #38bdf8; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }`,
    `@media (max-width: 980px) { .reviews-grid { grid-template-columns: repeat(2, 1fr); } }`,
    `@media (max-width: 640px) { .reviews-grid { grid-template-columns: 1fr; } .divider { display: none; } .google-rating-card { flex-direction: column; text-align: center; } .rating-meta { text-align: center; } }`
  ]
})
export class TestimonialsComponent {
  testimonials: Testimonial[] = [
    {
      name: 'Rahul Deshmukh',
      locality: 'Wakad, Pune',
      service: 'Deep Cleaning',
      rating: 5,
      review: 'Booked full home deep cleaning before moving in. Their in-house staff arrived on time with heavy-duty vacuum and scrubbers. Bathrooms and kitchen look brand new!',
      date: 'Aug 2026',
      verified: true
    },
    {
      name: 'Pooja Kulkarni',
      locality: 'Baner, Pune',
      service: 'Sofa Cleaning',
      rating: 5,
      review: 'Stubborn food and pet stains were completely removed from our 5-seater fabric sofa. Dried within 3 hours. Outstanding attention to detail without chemical odor.',
      date: 'Jul 2026',
      verified: true
    },
    {
      name: 'Vikram Shinde',
      locality: 'Hinjewadi Phase 2',
      service: 'Office Cleaning',
      rating: 5,
      review: 'Hired APK Elite for our IT facility AMC. Consistent quality, background-checked uniformed staff, and transparent GST invoicing. Highly recommended for commercial needs.',
      date: 'Aug 2026',
      verified: true
    },
    {
      name: 'Sneha Patil',
      locality: 'Kharadi, Pune',
      service: 'Kitchen Deep Clean',
      rating: 5,
      review: 'Super polite and hardworking team. Transparent upfront pricing on WhatsApp without any surprise charges. My kitchen chimney and tiles are sparkling clean.',
      date: 'Sep 2026',
      verified: true
    }
  ];
}
