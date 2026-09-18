import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="about-page">
      
      <!-- Hero -->
      <div class="about-hero">
        <span class="badge-tag">About APK Elite Services</span>
        <h1>Professional Deep Cleaning & Facility Management in Pune</h1>
        <p class="hero-desc">We provide reliable, high-quality residential and commercial cleaning services across Pune and PCMC. Unlike platforms that assign random freelancers, we employ a 100% in-house, background-verified professional team dedicated to keeping your home and workplace spotless.</p>
        <div class="cta-row">
          <a routerLink="/services" class="btn-primary">Browse All Services</a>
          <a routerLink="/contact" class="btn-secondary">Get a Custom Quote</a>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid-2">
        <div class="info-card">
          <h2>Who We Serve</h2>
          <p>From 1BHK apartments and luxury villas to corporate IT parks, clinics, and post-construction projects, we serve clients across all key Pune neighborhoods:</p>
          <div class="locality-tags">
            <span>Baner</span>
            <span>Wakad</span>
            <span>Kharadi</span>
            <span>Hinjewadi</span>
            <span>Viman Nagar</span>
            <span>Kothrud</span>
            <span>Hadapsar</span>
            <span>Pimpri-Chinchwad</span>
          </div>
        </div>

        <div class="info-card">
          <h2>Our Core Guarantees</h2>
          <ul class="advantage-list">
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              <div>
                <strong>100% In-House Trained Staff</strong>
                <p>No third-party gig workers or random subcontractors.</p>
              </div>
            </li>
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              <div>
                <strong>Non-Toxic & Eco-Friendly Solutions</strong>
                <p>Child-safe and pet-safe cleaning agents standard on every job.</p>
              </div>
            </li>
            <li>
              <svg class="check-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              <div>
                <strong>Transparent Pricing</strong>
                <p>Clear rate cards with no hidden fees or unexpected charges.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Services Overview -->
      <div class="expertise-section">
        <h2>Our Core Expertise</h2>
        <div class="grid-4">
          <div class="exp-card">
            <h3>Home Deep Cleaning</h3>
            <p>Complete top-to-bottom cleaning including kitchen degreasing, bathroom descaling, window track cleaning, and single-disc floor scrubbing.</p>
          </div>
          <div class="exp-card">
            <h3>Sofa & Carpet Care</h3>
            <p>Fabric-safe foam shampooing and high-suction extraction that eliminates tough stains, dust mites, and odors from upholstery.</p>
          </div>
          <div class="exp-card">
            <h3>Commercial & Office Cleaning</h3>
            <p>Flexible scheduled janitorial contracts, workstation sanitization, and floor polishing designed for productive business environments.</p>
          </div>
          <div class="exp-card">
            <h3>Pest Control & Tank Cleaning</h3>
            <p>Targeted treatments for termites, cockroaches, and bed bugs, plus hygienic multi-stage water tank cleaning.</p>
          </div>
        </div>
      </div>

      <!-- Guarantee Card -->
      <div class="guarantee-box">
        <h2>Customer Satisfaction Guarantee</h2>
        <p>We take pride in our work. If any area of your cleaning service does not meet your expectations, notify our team within 24 hours and we will re-clean it promptly at no extra charge.</p>
      </div>

    </section>
  `,
  styles: [
    `:host { display: block; padding: 2.5rem 1.25rem 4rem; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }`,
    `.about-page { max-width: 1140px; margin: 0 auto; }`,
    `.about-hero { background: white; border-radius: 16px; padding: 2.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 2rem; text-align: center; }`,
    `.badge-tag { display: inline-block; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; padding: 0.3rem 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; }`,
    `h1 { font-size: 2.2rem; color: #0f172a; margin: 0 0 0.75rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; }`,
    `.hero-desc { color: #475569; line-height: 1.6; font-size: 1rem; max-width: 780px; margin: 0 auto 1.5rem; }`,
    `.cta-row { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.85rem; }`,
    `.btn-primary { display: inline-flex; align-items: center; padding: 0.75rem 1.35rem; border-radius: 8px; background: #0284c7; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: background 0.2s ease; }`,
    `.btn-primary:hover { background: #0369a1; }`,
    `.btn-secondary { display: inline-flex; align-items: center; padding: 0.75rem 1.35rem; border-radius: 8px; background: #f1f5f9; color: #334155; text-decoration: none; font-weight: 600; font-size: 0.92rem; border: 1px solid #cbd5e1; }`,
    `.btn-secondary:hover { background: #e2e8f0; }`,
    `.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }`,
    `.info-card { background: white; border-radius: 16px; padding: 2rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }`,
    `h2 { font-size: 1.35rem; color: #0f172a; margin: 0 0 0.75rem; font-weight: 700; letter-spacing: -0.01em; }`,
    `.info-card p { color: #475569; font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.25rem; }`,
    `.locality-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }`,
    `.locality-tags span { background: #f1f5f9; color: #334155; font-size: 0.82rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0; }`,
    `.advantage-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }`,
    `.advantage-list li { display: flex; align-items: flex-start; gap: 0.75rem; }`,
    `.check-icon { color: #16a34a; flex-shrink: 0; margin-top: 0.25rem; }`,
    `.advantage-list strong { display: block; font-size: 0.92rem; color: #0f172a; font-weight: 600; margin-bottom: 0.15rem; }`,
    `.advantage-list p { margin: 0; font-size: 0.85rem; color: #64748b; }`,
    `.expertise-section { margin-bottom: 2rem; }`,
    `.expertise-section h2 { font-size: 1.4rem; color: #0f172a; text-align: center; margin-bottom: 1.5rem; }`,
    `.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }`,
    `.exp-card { background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }`,
    `.exp-card h3 { font-size: 1.05rem; color: #0f172a; margin: 0 0 0.5rem; font-weight: 600; }`,
    `.exp-card p { color: #64748b; font-size: 0.88rem; line-height: 1.55; margin: 0; }`,
    `.guarantee-box { background: #0f172a; color: white; border-radius: 16px; padding: 2.25rem; text-align: center; }`,
    `.guarantee-box h2 { color: white; margin-top: 0; margin-bottom: 0.5rem; font-size: 1.4rem; }`,
    `.guarantee-box p { font-size: 0.95rem; color: #cbd5e1; line-height: 1.6; max-width: 760px; margin: 0 auto; }`,
    `@media (max-width: 840px) { .grid-2, .grid-4 { grid-template-columns: 1fr; } h1 { font-size: 1.75rem; } }`
  ]
})
export class AboutPageComponent implements OnInit {
  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.generateTags({
      title: 'About APK Elite Services | Professional Cleaning in Pune',
      description: 'Learn about APK Elite Services. We provide trained in-house staff, eco-friendly products, and reliable deep cleaning across Pune & PCMC.',
      path: '/about'
    });
  }
}
