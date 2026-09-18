import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';
import { ServiceComponentComponent } from '../service-component/service-component.component';
import { AddWhyChooseComponent } from '../add-why-choose/add-why-choose.component';
import { AddMissionComponent } from '../add-mission/add-mission.component';
import { AboutSectionsComponent } from '../about-sections/about-sections.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="privacy-page">
      <div class="privacy-container">
        <h1>Privacy Policy</h1>
        <p class="updated">Last updated: August 2, 2026</p>

        <p>At <strong>APK Elite Services</strong>, accessible from https://www.apkeliteservices.in, we prioritize the privacy of our visitors and customers across Pune. This Privacy Policy document contains types of information that is collected and recorded by APK Elite Services and how we use it.</p>

        <h2>1. Information We Collect</h2>
        <p>When you request a service, fill out our inquiry form, or contact us via WhatsApp/Phone, we may collect personal information including:</p>
        <ul>
          <li>Name and contact phone number</li>
          <li>Service area / location in Pune</li>
          <li>Service requirements and property details</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, operate, and maintain our cleaning & facility management services</li>
          <li>Process service inquiries and send price quotations</li>
          <li>Communicate with you directly for booking confirmations and service updates</li>
          <li>Improve customer service and response times</li>
        </ul>

        <h2>3. Data Protection & Privacy</h2>
        <p>We strictly do not sell, trade, or rent your personal identification information to third parties. All customer information is handled securely for official service communication only.</p>

        <h2>4. Contact Us</h2>
        <p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at:</p>
        <p><strong>Phone:</strong> +91 88301 67863<br>
        <strong>Email:</strong> info&#64;apkeliteservices.in<br>
        <strong>Address:</strong> Pune, Maharashtra</p>

        <div class="back-home">
          <a routerLink="/" class="btn-home">← Back to Home</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 3rem 1.25rem; background: #f8fafc; min-height: 70vh; }`,
    `.privacy-container { max-width: 850px; margin: 0 auto; background: white; border-radius: 20px; padding: 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.05); color: #334155; line-height: 1.7; }`,
    `h1 { font-size: 2.2rem; color: #0f172a; margin-top: 0; margin-bottom: 0.25rem; }`,
    `.updated { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }`,
    `h2 { color: #0f172a; font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }`,
    `ul { padding-left: 1.2rem; }`,
    `.back-home { margin-top: 2rem; pt: 1rem; border-top: 1px solid #e2e8f0; }`,
    `.btn-home { display: inline-block; padding: 0.75rem 1.25rem; border-radius: 999px; background: #1e73be; color: white; text-decoration: none; font-weight: 600; }`
  ]
})
export class PrivacyPolicyComponent implements OnInit {
  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.generateTags({
      title: 'Privacy Policy | APK Elite Services Pune',
      description: 'Privacy Policy for APK Elite Services in Pune. Learn how we handle and protect customer information for cleaning and facility services.',
      path: '/privacy-policy'
    });
  }
}
