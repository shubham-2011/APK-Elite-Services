import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface LeadPayload {
  name: string;
  phone: string;
  email?: string;
  service: string;
  locality?: string;
  propertyType?: string;
  message?: string;
  source: string;
}

const DEFAULT_CMS_API = 'http://localhost:3000/api/leads';

@Injectable({
  providedIn: 'root'
})
export class LeadApiService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async submitLead(payload: LeadPayload): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    try {
      const endpoint = (window as any).__APK_CMS_API__ || DEFAULT_CMS_API;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (err) {
      // Graceful fallback so user is never blocked
      console.warn('CMS API is currently offline or unreachable. Using email/WhatsApp fallback.', err);
      return false;
    }
  }
}
