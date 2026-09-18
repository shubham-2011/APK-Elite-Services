import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface LeadNote {
  note: string;
  author?: string;
  createdAt: string;
}

export interface LeadItem {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  locality?: string;
  propertyType?: string;
  message?: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'CONFIRMED' | 'COMPLETED' | 'LOST';
  notes: LeadNote[];
  createdAt: string;
  updatedAt: string;
}

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

const STORAGE_KEY = 'apk_elite_leads_cache';

@Injectable({
  providedIn: 'root'
})
export class LeadApiService {
  private apiEndpoint = '/api/leads';
  private devEndpoint = 'http://localhost:3000/api/leads';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Submit new lead from forms (Quote Modal or Contact Page)
  async submitLead(payload: LeadPayload): Promise<boolean> {
    if (!this.isBrowser()) return false;

    const leadRecord: LeadItem = {
      _id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: payload.name,
      phone: payload.phone,
      email: payload.email || '',
      service: payload.service,
      locality: payload.locality || 'Pune',
      propertyType: payload.propertyType || '',
      message: payload.message || '',
      source: payload.source || 'Website',
      status: 'NEW',
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately cache in localStorage for instant offline access
    this.saveLocalLead(leadRecord);

    // 2. Post to live API
    try {
      let res = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok && window.location.hostname === 'localhost') {
        // Fallback for local Next.js dev server
        res = await fetch(this.devEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      return res.ok;
    } catch (err) {
      console.warn('Lead synced to browser local cache; server endpoint currently unreachable:', err);
      return true; // Still true so user gets success confirmation
    }
  }

  // Fetch all leads for CMS Dashboard
  async fetchAllLeads(): Promise<LeadItem[]> {
    if (!this.isBrowser()) return [];

    let remoteLeads: LeadItem[] = [];
    try {
      let res = await fetch(this.apiEndpoint);
      if (!res.ok && window.location.hostname === 'localhost') {
        res = await fetch(this.devEndpoint);
      }
      if (res.ok) {
        const data = await res.json();
        if (data.leads && Array.isArray(data.leads)) {
          remoteLeads = data.leads;
        }
      }
    } catch (err) {
      console.info('Using local lead cache (remote API offline):', err);
    }

    // Merge remote leads with any un-synced local leads
    const localLeads = this.getLocalLeads();
    const map = new Map<string, LeadItem>();

    // Put remote leads first
    remoteLeads.forEach(l => map.set(l._id || (l.phone + '_' + l.createdAt), l));
    // Merge local leads if not present
    localLeads.forEach(l => {
      const key = l._id || (l.phone + '_' + l.createdAt);
      if (!map.has(key)) {
        map.set(key, l);
      }
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Update local cache with latest merged set
    if (merged.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }

    return merged;
  }

  // Update lead status
  async updateStatus(id: string, status: LeadItem['status']): Promise<boolean> {
    if (!this.isBrowser()) return false;

    // Update local cache
    const local = this.getLocalLeads();
    const item = local.find(l => l._id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    }

    // Attempt remote update
    try {
      await fetch(this.apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
    } catch (e) {
      // Ignored
    }
    return true;
  }

  // Add staff internal note
  async addNote(id: string, note: string): Promise<boolean> {
    if (!this.isBrowser()) return false;

    const noteObj: LeadNote = {
      note,
      author: 'Admin',
      createdAt: new Date().toISOString()
    };

    const local = this.getLocalLeads();
    const item = local.find(l => l._id === id);
    if (item) {
      item.notes = item.notes || [];
      item.notes.push(noteObj);
      item.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    }

    try {
      await fetch(this.apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, note })
      });
    } catch (e) {
      // Ignored
    }
    return true;
  }

  // Delete lead
  async deleteLead(id: string): Promise<boolean> {
    if (!this.isBrowser()) return false;

    const local = this.getLocalLeads().filter(l => l._id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));

    try {
      await fetch(this.apiEndpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      // Ignored
    }
    return true;
  }

  // Local storage helpers
  private getLocalLeads(): LeadItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalLead(lead: LeadItem) {
    try {
      const list = this.getLocalLeads();
      list.unshift(lead);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 300)));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }
}
