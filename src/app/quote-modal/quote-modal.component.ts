import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { QuoteModalService } from '../shared/quote-modal.service';
import { LeadApiService } from '../shared/lead-api.service';
import { ContentApiService } from '../shared/content-api.service';
import { FootmarkApiService } from '../shared/footmark-api.service';
import { AttributionService } from '../shared/attribution.service';

const WA_NUMBER = '918830167863';
const TARGET_EMAIL = 'info@apkeliteservices.in';

interface ModalForm {
  name: string;
  phone: string;
  service: string;
  locality: string;
  message: string;
}

@Component({
  selector: 'app-quote-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="modal-card">
        
        <!-- Close Button -->
        <button type="button" class="close-btn" (click)="close()" aria-label="Close quote modal">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>

        <!-- Header -->
        <div class="modal-header">
          <span class="badge-tag">Direct Inquiry · Pune</span>
          <h2>{{ modalTitle }}</h2>
          <p>{{ modalSubtitle }}</p>
        </div>

        <!-- Success State -->
        <div class="success-state" *ngIf="submitted">
          <div class="check-circle">
            <svg viewBox="0 0 24 24" width="28" height="28"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h3>Quote Details Ready to Send!</h3>
          <p>Thank you, <strong>{{ form.name }}</strong>. Click below to confirm via Email or WhatsApp:</p>
          
          <div class="success-actions">
            <a [href]="mailtoUrl" class="btn-email" data-umami-event="modal-email-click">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              <span>Send Email to {{ targetEmail }}</span>
            </a>
            <a [href]="whatsAppUrl" target="_blank" rel="noopener" class="btn-whatsapp" (click)="onWhatsAppSuccessClick()" data-umami-event="modal-whatsapp-click">
              <svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L0 24l6.335-1.502A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.52-5.17-1.426l-.37-.22-3.76.892.946-3.653-.24-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              <span>Instant Chat on WhatsApp</span>
            </a>
            <button class="btn-done" (click)="close()">Done</button>
          </div>
        </div>

        <!-- Form View -->
        <form *ngIf="!submitted" (ngSubmit)="onSubmit()" #modalFormRef="ngForm" novalidate>
          <div class="form-row">
            <div class="field" [class.error]="nameFld.invalid && (nameFld.dirty || nameFld.touched)">
              <label for="modal-name">Full Name <span class="req">*</span></label>
              <input id="modal-name" name="name" type="text" [(ngModel)]="form.name"
                     (focus)="onFieldFocus('name')"
                     required minlength="2" #nameFld="ngModel"
                     placeholder="Your name" autocomplete="name" />
              <div *ngIf="nameFld.invalid && (nameFld.dirty || nameFld.touched)" class="field-error-msg">
                Please enter your full name (at least 2 characters)
              </div>
            </div>

            <div class="field" [class.error]="phoneFld.invalid && (phoneFld.dirty || phoneFld.touched)">
              <label for="modal-phone">Mobile Number <span class="req">*</span></label>
              <input id="modal-phone" name="phone" type="tel" [(ngModel)]="form.phone"
                     (focus)="onFieldFocus('phone')"
                     required pattern="[6-9][0-9]{9}" #phoneFld="ngModel"
                     placeholder="10-digit phone" autocomplete="tel" />
              <div *ngIf="phoneFld.invalid && (phoneFld.dirty || phoneFld.touched)" class="field-error-msg">
                Enter a 10-digit mobile number starting with 6-9
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="modal-service">Service <span class="req">*</span></label>
              <select id="modal-service" name="service" [(ngModel)]="form.service" required>
                <option *ngFor="let s of servicesList" [value]="s">{{ s }}</option>
              </select>
            </div>

            <div class="field">
              <label for="modal-locality">Locality in Pune <span class="req">*</span></label>
              <select id="modal-locality" name="locality" [(ngModel)]="form.locality" required>
                <option *ngFor="let loc of localitiesList" [value]="loc">{{ loc }}</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="modal-message">Property Details / Message <span class="opt">(Optional)</span></label>
            <textarea id="modal-message" name="message" [(ngModel)]="form.message"
                      rows="2" placeholder="e.g. 2 BHK flat, preferred date, etc."></textarea>
          </div>

          <button type="submit" class="btn-submit" [disabled]="modalFormRef.invalid">
            <span>Send Quote Request via Email</span>
          </button>
        </form>

      </div>
    </div>
  `,
  styles: [
    `:host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }`,
    `.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }`,
    `.modal-card { background: white; border-radius: 16px; width: 100%; max-width: 540px; padding: 2rem; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.2); animation: modalIn 0.2s ease-out; }`,
    `@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`,
    `.close-btn { position: absolute; top: 1.25rem; right: 1.25rem; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: background 0.15s; }`,
    `.close-btn:hover { background: #e2e8f0; color: #0f172a; }`,
    `.modal-header { margin-bottom: 1.5rem; text-align: left; }`,
    `.badge-tag { display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; padding: 0.2rem 0.55rem; border-radius: 6px; margin-bottom: 0.4rem; }`,
    `.modal-header h2 { font-size: 1.35rem; color: #0f172a; margin: 0 0 0.3rem; font-weight: 700; }`,
    `.modal-header p { color: #64748b; font-size: 0.88rem; margin: 0; }`,
    `.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }`,
    `.field { margin-bottom: 1rem; }`,
    `.field label { display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.3rem; }`,
    `.req { color: #dc2626; }`,
    `.opt { color: #94a3b8; font-weight: 400; font-size: 0.75rem; }`,
    `.field input, .field select, .field textarea { width: 100%; padding: 0.65rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; color: #0f172a; background: white; font-family: inherit; box-sizing: border-box; }`,
    `.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15); }`,
    `.field.error input { border-color: #ef4444; background: #fff5f5; }`,
    `.field-error-msg { color: #dc2626; font-size: 0.72rem; margin-top: 0.25rem; font-weight: 500; }`,
    `.btn-submit { width: 100%; padding: 0.8rem; border-radius: 8px; background: #0284c7; color: white; border: none; font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 0.4rem; }`,
    `.btn-submit:hover:not(:disabled) { background: #0369a1; }`,
    `.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }`,
    `.success-state { text-align: center; padding: 1rem 0; }`,
    `.check-circle { width: 48px; height: 48px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }`,
    `.success-state h3 { font-size: 1.2rem; color: #0f172a; margin: 0 0 0.4rem; }`,
    `.success-state p { color: #475569; font-size: 0.88rem; line-height: 1.5; margin: 0 0 1.25rem; }`,
    `.success-actions { display: flex; flex-direction: column; gap: 0.65rem; }`,
    `.btn-email { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 8px; background: #0f172a; color: white; text-decoration: none; font-weight: 600; font-size: 0.9rem; }`,
    `.btn-email:hover { background: #1e293b; }`,
    `.btn-whatsapp { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 8px; background: #16a34a; color: white; text-decoration: none; font-weight: 600; font-size: 0.9rem; }`,
    `.btn-whatsapp:hover { background: #15803d; }`,
    `.btn-done { background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 0.6rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }`,
    `@media (max-width: 580px) { .form-row { grid-template-columns: 1fr; } }`
  ]
})
export class QuoteModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  submitted = false;
  whatsAppUrl = '';
  mailtoUrl = '';
  modalTitle = 'Request a Free Service Quote';
  modalSubtitle = 'Fill out your details below to send a quote request directly to our team.';
  targetEmail = TARGET_EMAIL;
  targetWhatsApp = WA_NUMBER;
  localitiesList: string[] = ['Baner', 'Wakad', 'Kharadi', 'Hinjewadi', 'Viman Nagar', 'Kothrud', 'Aundh', 'Hadapsar', 'Other Area'];
  servicesList: string[] = ['Deep Cleaning', 'Sofa Cleaning', 'Office Cleaning', 'Post-Construction Cleaning', 'Pest Control', 'Water Tank Cleaning', 'Floor Polishing', 'Facade Cleaning'];

  private sub?: Subscription;
  private contentSub?: Subscription;

  form: ModalForm = {
    name: '',
    phone: '',
    service: 'Deep Cleaning',
    locality: 'Baner',
    message: ''
  };

  constructor(
    private modalService: QuoteModalService,
    private leadApi: LeadApiService,
    private contentApi: ContentApiService,
    private footmarkApi: FootmarkApiService,
    private attribution: AttributionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.sub = this.modalService.isOpen$.subscribe(open => {
      this.isOpen = open;
      if (open && isPlatformBrowser(this.platformId)) {
        this.footmarkApi.trackEvent('quote_modal_open', {
          service: this.form.service,
          locality: this.form.locality
        });
      }
      if (!open) {
        this.resetForm();
      }
    });

    this.contentSub = this.contentApi.content$.subscribe(content => {
      if (content && content.formConfig) {
        this.modalTitle = content.formConfig.modalTitle || this.modalTitle;
        this.modalSubtitle = content.formConfig.modalSubtitle || this.modalSubtitle;
        if (content.formConfig.localities && content.formConfig.localities.length) {
          this.localitiesList = content.formConfig.localities;
          if (!this.form.locality) {
            this.form.locality = this.localitiesList[0];
          }
        }
        if (content.formConfig.services && content.formConfig.services.length) {
          this.servicesList = content.formConfig.services;
          if (!this.form.service) {
            this.form.service = this.servicesList[0];
          }
        }
      }
      if (content.email) this.targetEmail = content.email;
      if (content.whatsapp) this.targetWhatsApp = content.whatsapp;
    });
  }

  onFieldFocus(fieldName: string): void {
    this.footmarkApi.trackFormLifecycle('start', 'quote_modal', {
      field: fieldName,
      service: this.form.service,
      locality: this.form.locality
    });
  }

  onWhatsAppSuccessClick(): void {
    this.footmarkApi.trackWhatsAppClick(
      this.form.service,
      this.form.service,
      'quote_modal_success',
      window.location.pathname
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.contentSub?.unsubscribe();
  }

  close(): void {
    if (!this.submitted && (this.form.name || this.form.phone)) {
      this.footmarkApi.trackEvent('form_abandonment', {
        form_name: 'quote_modal',
        service: this.form.service,
        locality: this.form.locality,
        has_name: Boolean(this.form.name),
        has_phone: Boolean(this.form.phone)
      });
    }
    this.modalService.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  onSubmit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.footmarkApi.trackFormLifecycle('submit', 'quote_modal', {
      service: this.form.service,
      locality: this.form.locality
    });

    const attr = this.attribution.getAttribution();
    const attrTag = this.attribution.getCompactAttributionTag(this.form.locality);

    // Asynchronously capture lead in Next.js + MongoDB CMS with marketing attribution
    this.leadApi.submitLead({
      name: this.form.name,
      phone: this.form.phone,
      service: this.form.service,
      locality: this.form.locality,
      message: this.form.message,
      source: 'quote_modal',
      utm_source: attr.utm_source,
      utm_medium: attr.utm_medium,
      utm_campaign: attr.utm_campaign,
      utm_term: attr.utm_term,
      utm_content: attr.utm_content,
      gclid: attr.gclid,
      landing_page: attr.landing_page,
      initial_referrer: attr.initial_referrer,
      visit_count: attr.visit_count
    });

    // 1. Prepare formatted mailto URL (Direct email to dynamic CMS email)
    const subject = `Service Quote Request: ${this.form.service} (${this.form.locality}) ${attrTag}`;
    const body = `Hi APK Elite Services Team,\n\nI would like to request a quote with the following details:\n\nName: ${this.form.name}\nPhone / Mobile: ${this.form.phone}\nService Required: ${this.form.service}\nLocality: ${this.form.locality}\nProperty Details: ${this.form.message || 'None'}\n\nAttribution: ${attrTag}\n\nPlease respond with pricing and availability.`;

    this.mailtoUrl = `mailto:${this.targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // 2. Prepare WhatsApp backup URL using dynamic CMS WhatsApp number and attribution tag
    const waMsg = `Hi, I submitted a Quote request: Name: ${this.form.name}, Phone: ${this.form.phone}, Service: ${this.form.service}, Locality: ${this.form.locality}, Details: ${this.form.message || 'N/A'} ${attrTag}`;
    this.whatsAppUrl = `https://wa.me/${this.targetWhatsApp}?text=${encodeURIComponent(waMsg)}`;

    // 3. Open user's email client directly pre-filled with all details
    window.location.href = this.mailtoUrl;

    this.footmarkApi.trackFormLifecycle('success', 'quote_modal', {
      service: this.form.service,
      locality: this.form.locality
    });

    if ((window as any).umami) {
      (window as any).umami.track('quote-modal-submit', {
        service: this.form.service,
        locality: this.form.locality,
        attribution: attrTag
      });
    }

    this.submitted = true;
  }

  resetForm(): void {
    this.submitted = false;
    this.form = {
      name: '',
      phone: '',
      service: this.servicesList[0] || 'Deep Cleaning',
      locality: this.localitiesList[0] || 'Baner',
      message: ''
    };
  }
}
