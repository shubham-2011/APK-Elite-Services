import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SeoService } from '../seo.service';
import { LeadApiService } from '../shared/lead-api.service';
import { ContentApiService } from '../shared/content-api.service';
import { FootmarkApiService } from '../shared/footmark-api.service';

const WA_NUMBER = '918830167863';

interface ContactForm {
  name: string;
  phone: string;
  email: string;
  service: string;
  locality: string;
  message: string;
}

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="contact-page">

      <!-- Page Hero -->
      <div class="page-hero">
        <span class="badge-tag">Get in Touch · Pune</span>
        <h1>Book a Service or Request a Quote</h1>
        <p class="hero-sub">Need assistance? Fill out the inquiry form below or reach our team directly via phone or WhatsApp.</p>
        
        <div class="hero-cta-row">
          <a href="https://wa.me/{{ waNumber }}?text=Hi%2C%20I%20need%20a%20cleaning%20service%20quote%20in%20Pune."
             target="_blank" rel="noopener"
             class="btn-whatsapp"
             data-umami-event="whatsapp-contact-hero">
            <svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L0 24l6.335-1.502A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.52-5.17-1.426l-.37-.22-3.76.892.946-3.653-.24-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            <span>WhatsApp Us</span>
          </a>
          <a href="tel:+918830167863" class="btn-call" data-umami-event="call-contact-hero">
            <svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            <span>+91 88301 67863</span>
          </a>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="contact-grid">

        <!-- Form Section -->
        <div class="form-card">
          <h2>Send Us an Enquiry</h2>
          <p class="form-sub">Fill out the details below and our team will get back to you promptly.</p>

          <!-- Success View -->
          <div class="success-state" *ngIf="submitted">
            <div class="check-circle">
              <svg viewBox="0 0 24 24" width="28" height="28"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3>Enquiry Submitted Successfully</h3>
            <p>Thank you, <strong>{{ form.name }}</strong>. We have received your message and will contact you shortly on <strong>{{ form.phone }}</strong>.</p>
            <div class="success-actions">
              <a [href]="successEmailUrl" class="btn-call" data-umami-event="email-post-form">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                <span>Send via Email (info&#64;apkeliteservices.in)</span>
              </a>
              <a [href]="successWhatsAppUrl" target="_blank" rel="noopener" class="btn-whatsapp" data-umami-event="whatsapp-post-form">
                <svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L0 24l6.335-1.502A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.52-5.17-1.426l-.37-.22-3.76.892.946-3.653-.24-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                <span>Continue on WhatsApp</span>
              </a>
              <button class="btn-secondary-link" (click)="resetForm()">Submit another response</button>
            </div>
          </div>

          <!-- Form View -->
          <form *ngIf="!submitted" (ngSubmit)="onSubmit()" action="https://api.web3forms.com/submit" method="POST" target="web3forms_contact_iframe" #contactFormRef="ngForm" novalidate>
            <input type="hidden" name="access_key" value="101e2c51-0926-4dd3-b6e5-a04034ecca39" />
            <input type="hidden" name="from_name" value="APK Elite Services Website" />
            <input type="hidden" name="subject" [value]="'New Website Contact Form: ' + form.service + ' (' + form.locality + ')'" />
            <input type="hidden" name="email" [value]="form.email || 'customer@apkeliteservices.in'" />
            
            <div class="form-row">
              <div class="field" [class.error]="nameFld.invalid && nameFld.touched">
                <label for="contact-name">Full Name <span class="req">*</span></label>
                <input id="contact-name" name="name" type="text" [(ngModel)]="form.name"
                       required minlength="2" #nameFld="ngModel"
                       placeholder="Enter your full name" autocomplete="name" />
                <span class="err-msg" *ngIf="nameFld.invalid && nameFld.touched">Please enter your name</span>
              </div>

              <div class="field" [class.error]="phoneFld.invalid && phoneFld.touched">
                <label for="contact-phone">Phone / Mobile Number <span class="req">*</span></label>
                <input id="contact-phone" name="phone" type="tel" [(ngModel)]="form.phone"
                       required pattern="[6-9][0-9]{9}" #phoneFld="ngModel"
                       placeholder="10-digit mobile number" autocomplete="tel" />
                <span class="err-msg" *ngIf="phoneFld.invalid && phoneFld.touched">Valid 10-digit mobile number required</span>
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label for="contact-service">Service Required <span class="req">*</span></label>
                <select id="contact-service" name="service" [(ngModel)]="form.service" required #serviceFld="ngModel">
                  <option value="" disabled>Select service</option>
                  <option *ngFor="let s of servicesList" [value]="s">{{ s }}</option>
                </select>
              </div>

              <div class="field">
                <label for="contact-locality">Locality in Pune <span class="req">*</span></label>
                <select id="contact-locality" name="locality" [(ngModel)]="form.locality" required>
                  <option value="" disabled>Select locality</option>
                  <option *ngFor="let loc of localitiesList" [value]="loc">{{ loc }}</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label for="contact-message">Requirements / Property Details <span class="opt">(Optional)</span></label>
              <textarea id="contact-message" name="message" [(ngModel)]="form.message"
                        rows="3" placeholder="Describe property size (e.g. 2 BHK, office space, preferred date, etc.)"></textarea>
            </div>

            <div class="error-banner" *ngIf="submitError">
              {{ submitError }}
            </div>

            <button type="submit" class="btn-submit" [class.loading]="sending" [disabled]="contactFormRef.invalid">
              <span>Submit Enquiry</span>
            </button>

            <p class="form-footer-note">Your privacy is important to us. View our <a routerLink="/privacy-policy">Privacy Policy</a>.</p>
          </form>

          <iframe name="web3forms_contact_iframe" style="display:none;"></iframe>
        </div>

        <!-- Sidebar Info -->
        <div class="sidebar">
          
          <!-- Direct Contact Card -->
          <div class="sidebar-card">
            <h3>Direct Contact</h3>
            <div class="contact-item">
              <div class="item-icon">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </div>
              <div class="item-text">
                <span class="label">Phone / WhatsApp</span>
                <a href="tel:+918830167863" class="value">+91 88301 67863</a>
              </div>
            </div>

            <div class="contact-item">
              <div class="item-icon">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </div>
              <div class="item-text">
                <span class="label">Email Address</span>
                <a href="mailto:info@apkeliteservices.in" class="value">info&#64;apkeliteservices.in</a>
              </div>
            </div>

            <div class="contact-item">
              <div class="item-icon">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </div>
              <div class="item-text">
                <span class="label">Service Coverage</span>
                <span class="value-text">Pune, PCMC & Nearby Areas</span>
              </div>
            </div>

            <div class="contact-item">
              <div class="item-icon">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
              </div>
              <div class="item-text">
                <span class="label">Hours of Operation</span>
                <span class="value-text">Monday – Sunday | 8:00 AM – 8:00 PM</span>
              </div>
            </div>
          </div>

          <!-- Professional Service Guarantee Card -->
          <div class="sidebar-card feature-card">
            <h3>Service Standards</h3>
            <ul class="feature-list">
              <li>
                <svg class="check-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                <span>Trained & In-House Professional Team</span>
              </li>
              <li>
                <svg class="check-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                <span>Safe, Non-Toxic & Eco-Friendly Solutions</span>
              </li>
              <li>
                <svg class="check-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                <span>Transparent & Upfront Pricing</span>
              </li>
              <li>
                <svg class="check-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                <span>Punctual Execution & Quality Assurance</span>
              </li>
            </ul>
          </div>

          <!-- Navigation Links -->
          <div class="sidebar-card">
            <h3>Popular Services</h3>
            <div class="nav-links-grid">
              <a routerLink="/services/deep-cleaning">Deep Cleaning Services</a>
              <a routerLink="/services/sofa-cleaning">Sofa Shampooing</a>
              <a routerLink="/services/pest-control">Pest Control Management</a>
              <a routerLink="/services/office-cleaning">Commercial & Office Cleaning</a>
              <a routerLink="/services/water-tank-cleaning">Water Tank Cleaning</a>
            </div>
          </div>

        </div>

      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 2.5rem 1.25rem 4rem; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }`,
    `.contact-page { max-width: 1140px; margin: 0 auto; }`,

    /* Hero */
    `.page-hero { background: white; border-radius: 16px; padding: 2.25rem 2.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 2rem; }`,
    `.badge-tag { display: inline-block; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; padding: 0.3rem 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; }`,
    `h1 { font-size: 2.1rem; color: #0f172a; margin: 0 0 0.5rem; font-weight: 700; letter-spacing: -0.02em; }`,
    `.hero-sub { color: #475569; margin: 0 0 1.5rem; font-size: 1rem; line-height: 1.6; max-width: 720px; }`,
    `.hero-cta-row { display: flex; flex-wrap: wrap; gap: 0.85rem; }`,

    /* Buttons */
    `.btn-whatsapp { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.35rem; border-radius: 8px; background: #16a34a; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: all 0.2s ease; border: none; cursor: pointer; }`,
    `.btn-whatsapp:hover { background: #15803d; }`,
    `.btn-call { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.35rem; border-radius: 8px; background: #0f172a; color: white; text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: all 0.2s ease; border: none; }`,
    `.btn-call:hover { background: #1e293b; }`,

    /* Grid */
    `.contact-grid { display: grid; grid-template-columns: 1.45fr 1fr; gap: 2rem; align-items: start; }`,

    /* Form Card */
    `.form-card { background: white; border-radius: 16px; padding: 2.25rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }`,
    `h2 { font-size: 1.35rem; color: #0f172a; margin: 0 0 0.35rem; font-weight: 700; letter-spacing: -0.01em; }`,
    `.form-sub { color: #64748b; margin: 0 0 1.75rem; font-size: 0.92rem; }`,
    `.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }`,

    /* Fields */
    `.field { margin-bottom: 1.25rem; }`,
    `.field label { display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem; }`,
    `.req { color: #dc2626; }`,
    `.opt { color: #94a3b8; font-weight: 400; font-size: 0.8rem; }`,
    `.field input, .field select, .field textarea { width: 100%; padding: 0.7rem 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.92rem; color: #0f172a; background: #ffffff; transition: all 0.15s ease; box-sizing: border-box; font-family: inherit; }`,
    `.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15); }`,
    `.field input::placeholder, .field textarea::placeholder { color: #94a3b8; }`,
    `.field.error input, .field.error select { border-color: #ef4444; }`,
    `.err-msg { color: #dc2626; font-size: 0.8rem; margin-top: 0.3rem; display: block; font-weight: 500; }`,

    /* Submit Button */
    `.btn-submit { width: 100%; padding: 0.85rem 1.5rem; border-radius: 8px; background: #0284c7; color: white; border: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; margin-top: 0.5rem; }`,
    `.btn-submit:hover:not(:disabled) { background: #0369a1; }`,
    `.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }`,
    `.form-footer-note { font-size: 0.8rem; color: #64748b; margin-top: 1rem; text-align: center; }`,
    `.form-footer-note a { color: #0284c7; text-decoration: none; }`,
    `.form-footer-note a:hover { text-decoration: underline; }`,

    /* Success State */
    `.success-state { text-align: center; padding: 2rem 1rem; }`,
    `.check-circle { width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }`,
    `.success-state h3 { font-size: 1.3rem; color: #0f172a; margin: 0 0 0.5rem; }`,
    `.success-state p { color: #475569; margin: 0 0 1.5rem; font-size: 0.95rem; line-height: 1.6; }`,
    `.success-actions { display: flex; flex-direction: column; align-items: center; gap: 0.85rem; }`,
    `.btn-secondary-link { background: none; border: none; color: #64748b; font-size: 0.88rem; cursor: pointer; text-decoration: underline; }`,

    /* Sidebar Cards */
    `.sidebar { display: flex; flex-direction: column; gap: 1.5rem; }`,
    `.sidebar-card { background: white; border-radius: 16px; padding: 1.75rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }`,
    `.sidebar-card h3 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; letter-spacing: -0.01em; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; }`,
    
    /* Contact Items */
    `.contact-item { display: flex; align-items: flex-start; gap: 0.85rem; margin-bottom: 1.1rem; }`,
    `.contact-item:last-child { margin-bottom: 0; }`,
    `.item-icon { width: 36px; height: 36px; border-radius: 8px; background: #f1f5f9; color: #0284c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }`,
    `.item-text { display: flex; flex-direction: column; }`,
    `.item-text .label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }`,
    `.item-text .value { font-size: 0.92rem; font-weight: 600; color: #0f172a; text-decoration: none; }`,
    `.item-text a.value:hover { color: #0284c7; }`,
    `.item-text .value-text { font-size: 0.9rem; color: #334155; font-weight: 500; }`,

    /* Feature List */
    `.feature-card { background: #fafafa; }`,
    `.feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.85rem; }`,
    `.feature-list li { display: flex; align-items: center; gap: 0.65rem; font-size: 0.88rem; color: #334155; font-weight: 500; }`,
    `.check-icon { color: #16a34a; flex-shrink: 0; }`,

    /* Links Grid */
    `.nav-links-grid { display: flex; flex-direction: column; gap: 0.6rem; }`,
    `.nav-links-grid a { font-size: 0.88rem; color: #0284c7; text-decoration: none; font-weight: 500; transition: color 0.15s ease; }`,
    `.nav-links-grid a:hover { color: #0369a1; text-decoration: underline; }`,

    /* Responsive */
    `@media (max-width: 840px) { .contact-grid { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }`
  ]
})
export class ContactPageComponent implements OnInit, OnDestroy {
  waNumber = WA_NUMBER;
  targetEmail = 'info@apkeliteservices.in';
  submitted = false;
  sending = false;
  submitError = '';
  successWhatsAppUrl = '';
  successEmailUrl = '';

  localitiesList: string[] = ['Baner', 'Wakad', 'Hinjewadi', 'Kharadi', 'Viman Nagar', 'Kothrud', 'Aundh', 'Hadapsar', 'Other Area'];
  servicesList: string[] = ['Deep Cleaning', 'Sofa Cleaning', 'Office Cleaning', 'Post-Construction Cleaning', 'Pest Control', 'Water Tank Cleaning', 'Floor Polishing', 'Facade Cleaning'];

  private contentSub?: Subscription;

  form: ContactForm = {
    name: '',
    phone: '',
    email: '',
    service: '',
    locality: '',
    message: ''
  };

  constructor(
    private seo: SeoService,
    private leadApi: LeadApiService,
    private contentApi: ContentApiService,
    private footmarkApi: FootmarkApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.seo.generateTags({
      title: 'Contact APK Elite Services | Get a Free Quote in Pune',
      description: 'Contact APK Elite Services for professional cleaning, sanitization, and facility services in Pune. Request a quote or get in touch with our team.',
      path: '/contact'
    });

    this.contentSub = this.contentApi.content$.subscribe(content => {
      if (content && content.formConfig) {
        if (content.formConfig.localities && content.formConfig.localities.length) {
          this.localitiesList = content.formConfig.localities;
        }
        if (content.formConfig.services && content.formConfig.services.length) {
          this.servicesList = content.formConfig.services;
        }
      }
      if (content.email) this.targetEmail = content.email;
      if (content.whatsapp) this.waNumber = content.whatsapp;
    });
  }

  onFieldFocus(fieldName: string): void {
    this.footmarkApi.trackFormLifecycle('start', 'contact_page_form', {
      field: fieldName,
      service: this.form.service,
      locality: this.form.locality
    });
  }

  ngOnDestroy(): void {
    this.contentSub?.unsubscribe();
  }

  onSubmit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.footmarkApi.trackFormLifecycle('submit', 'contact_page_form', {
      service: this.form.service,
      locality: this.form.locality
    });

    // Asynchronously capture lead in Next.js + MongoDB CMS
    this.leadApi.submitLead({
      name: this.form.name,
      phone: this.form.phone,
      email: this.form.email,
      service: this.form.service,
      locality: this.form.locality,
      message: this.form.message,
      source: 'contact_page'
    });

    const subject = `Website Contact Form: ${this.form.service} (${this.form.locality})`;
    const body = `Hi APK Elite Services Team,\n\nI submitted an enquiry via your website:\n\nName: ${this.form.name}\nPhone: ${this.form.phone}\nService Required: ${this.form.service}\nLocality: ${this.form.locality}\nMessage: ${this.form.message || 'None'}\n\nPlease contact me promptly.`;

    this.successEmailUrl = `mailto:${this.targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const msg = `Hi%2C%20I%27m%20${encodeURIComponent(this.form.name)}%20from%20${encodeURIComponent(this.form.locality)}.%20I%20need%20${encodeURIComponent(this.form.service)}.%20My%20number%20is%20${encodeURIComponent(this.form.phone)}.%20${encodeURIComponent(this.form.message)}`;
    this.successWhatsAppUrl = `https://wa.me/${this.waNumber}?text=${msg}`;

    // Trigger direct native email draft open to target email
    window.location.href = this.successEmailUrl;

    this.footmarkApi.trackFormLifecycle('success', 'contact_page_form', {
      service: this.form.service,
      locality: this.form.locality
    });

    if ((window as any).umami) {
      (window as any).umami.track('contact-form-submit', { service: this.form.service, locality: this.form.locality });
    }

    this.submitted = true;
  }

  resetForm(): void {
    this.submitted = false;
    this.submitError = '';
    this.form = { name: '', phone: '', email: '', service: '', locality: '', message: '' };
  }
}
