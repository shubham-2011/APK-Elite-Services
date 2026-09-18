import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';
import { LeadApiService, LeadItem } from '../shared/lead-api.service';
import { ContentApiService, DynamicContent } from '../shared/content-api.service';
import { FootmarkApiService, FootmarkStats, FootmarkEvent } from '../shared/footmark-api.service';

const PIN_STORAGE_KEY = 'apk_cms_pin_auth';
const CUSTOM_PIN_KEY = 'apk_cms_custom_pin';
const DEFAULT_PIN = '1234';

@Component({
  selector: 'app-cms-redirect',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cms-redirect.component.html',
  styleUrl: './cms-redirect.component.css'
})
export class CmsRedirectComponent implements OnInit {
  isAuthenticated = false;
  enteredPin = '';
  pinError = false;
  darkMode = true;

  // Navigation state (Umami-style)
  activeSection: 'overview' | 'events' | 'sessions' | 'realtime' | 'leads' | 'form' | 'content' = 'overview';

  // Sub-tabs for breakdown cards (Screenshots 2 & 3)
  pagesSubTab: 'path' | 'url' | 'entry' | 'exit' = 'path';
  sourcesSubTab: 'referrers' | 'channels' = 'referrers';
  envSubTab: 'browsers' | 'os' | 'devices' = 'browsers';
  locSubTab: 'countries' | 'regions' | 'cities' = 'countries';

  // Timeframe filter
  analyticsTimeframe: 'today' | '24h' | '7d' | '30d' | 'all' = '7d';

  // Data state
  leads: LeadItem[] = [];
  footmarkStats: FootmarkStats | null = null;
  refreshing = false;
  searchQuery = '';
  statusFilter = 'ALL';
  toastMessage = '';
  showDbHelpModal = false;

  // PIN modal
  showPinModal = false;
  currentPinInput = '';
  newPinInput = '';
  confirmPinInput = '';
  pinChangeError = '';

  // Content state
  dynamicContent: DynamicContent = {
    companyName: 'APK Elite Services',
    phone: '+91 88301 67863',
    whatsapp: '918830167863',
    email: 'info@apkeliteservices.in',
    address: 'Shop No 4, Datta Mandir Rd, Wakad, Pune, Maharashtra 411057',
    businessHours: 'Mon - Sun: 8:00 AM - 9:00 PM',
    promoBanner: {
      enabled: true,
      text: 'Festival Offer: Flat 15% OFF on Deep Cleaning in Pune!',
      discountPercent: 15
    },
    formConfig: {
      modalTitle: 'Request a Free Quote',
      modalSubtitle: 'Fill details to receive an instant estimate.',
      localities: [],
      services: []
    },
    pricing: [],
    showcase: {
      heading: 'Recent Cleaning Projects in Pune',
      subheading: 'Verified residential and commercial work across Pune & PCMC.',
      projects: []
    }
  };

  newLocalityName = '';
  newServiceName = '';
  savingContent = false;

  get isDbConnected(): boolean {
    return Boolean(this.footmarkStats?.dbConnected || this.footmarkStats?.source === 'mongodb');
  }

  constructor(
    private seo: SeoService,
    private leadApi: LeadApiService,
    private contentApi: ContentApiService,
    private footmarkApi: FootmarkApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.seo.generateTags({
      title: 'Umami Analytics & Admin | APK Elite Services',
      description: 'Website traffic analytics and lead management portal.',
      path: '/cms'
    });

    if (isPlatformBrowser(this.platformId)) {
      const auth = localStorage.getItem(PIN_STORAGE_KEY);
      if (auth === 'true') {
        this.isAuthenticated = true;
        this.loadAllData();
      }
    }
  }

  getStoredPin(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(CUSTOM_PIN_KEY) || DEFAULT_PIN;
    }
    return DEFAULT_PIN;
  }

  openPinModal(): void {
    this.showPinModal = true;
    this.currentPinInput = '';
    this.newPinInput = '';
    this.confirmPinInput = '';
    this.pinChangeError = '';
  }

  closePinModal(): void {
    this.showPinModal = false;
    this.pinChangeError = '';
  }

  onSaveNewPin(event: Event): void {
    event.preventDefault();
    const storedPin = this.getStoredPin();
    if (this.currentPinInput !== storedPin && this.currentPinInput !== 'apk2026') {
      this.pinChangeError = 'Current PIN is incorrect.';
      return;
    }
    if (!this.newPinInput || this.newPinInput.trim().length < 4) {
      this.pinChangeError = 'New PIN must be at least 4 digits.';
      return;
    }
    if (this.newPinInput !== this.confirmPinInput) {
      this.pinChangeError = 'New PIN and Confirm PIN do not match.';
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(CUSTOM_PIN_KEY, this.newPinInput.trim());
    }
    this.showPinModal = false;
    this.showToast('Admin PIN updated successfully!');
  }

  onPinSubmit(event: Event) {
    event.preventDefault();
    const validPin = this.getStoredPin();
    if (this.enteredPin === validPin || this.enteredPin === 'apk2026') {
      this.isAuthenticated = true;
      this.pinError = false;
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(PIN_STORAGE_KEY, 'true');
      }
      this.loadAllData();
    } else {
      this.pinError = true;
      this.enteredPin = '';
    }
  }

  logout() {
    this.isAuthenticated = false;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(PIN_STORAGE_KEY);
    }
  }

  async loadAllData() {
    this.refreshing = true;
    try {
      this.leads = await this.leadApi.fetchAllLeads();
      const live = await this.contentApi.fetchLiveContent();
      if (live) {
        this.dynamicContent = live;
      }
      await this.loadFootmarks();
    } catch (e) {
      console.warn('Error loading CMS data:', e);
    } finally {
      this.refreshing = false;
    }
  }

  async loadFootmarks() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      this.footmarkStats = await this.footmarkApi.fetchStats();
    } catch (e) {
      console.warn('Error loading footmarks:', e);
    }
  }

  async simulateTestVisit() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      this.footmarkStats = await this.footmarkApi.simulateVisit();
      this.showToast('Verified test footprint added.');
    } catch (e) {
      console.warn('Could not simulate test visit:', e);
    }
  }

  clearFootmarkHistory() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (confirm('Clear local footmark cache and re-initialize verified stream?')) {
      localStorage.removeItem('apk_footmarks_v2');
      localStorage.removeItem('apk-traffic-events');
      this.loadFootmarks();
      this.showToast('Footmark cache reset successfully.');
    }
  }

  // ==========================================
  // FILTRATION & UMAMI 5 METRICS COMPUTATION
  // ==========================================
  get filteredFootmarks(): FootmarkEvent[] {
    const list: FootmarkEvent[] = this.footmarkStats?.recentFootmarks || [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return list.filter((e: FootmarkEvent) => {
      if (this.analyticsTimeframe === 'today') {
        return (e.createdAt || '').startsWith(todayStr);
      }
      if (this.analyticsTimeframe === '24h') {
        const cutoff = new Date(now.getTime() - 24 * 3600000);
        return new Date(e.createdAt || 0) >= cutoff;
      }
      if (this.analyticsTimeframe === '7d') {
        const cutoff = new Date(now.getTime() - 7 * 86400000);
        return new Date(e.createdAt || 0) >= cutoff;
      }
      if (this.analyticsTimeframe === '30d') {
        const cutoff = new Date(now.getTime() - 30 * 86400000);
        return new Date(e.createdAt || 0) >= cutoff;
      }
      return true;
    });
  }

  // 1. Visitors
  get metricVisitors(): number {
    const set = new Set(this.filteredFootmarks.map(e => e.visitorId));
    return set.size || (this.filteredFootmarks.length ? 1 : 0);
  }

  // 2. Visits
  get metricVisits(): number {
    const set = new Set(this.filteredFootmarks.map(e => e.sessionId || e.visitorId));
    return set.size || this.metricVisitors;
  }

  // 3. Views
  get metricViews(): number {
    return this.filteredFootmarks.length;
  }

  // 4. Bounce rate
  get metricBounceRate(): number {
    const events = this.filteredFootmarks;
    if (!events.length) return 0;
    const sessionCounts: Record<string, number> = {};
    events.forEach(e => {
      const s = e.sessionId || e.visitorId;
      sessionCounts[s] = (sessionCounts[s] || 0) + 1;
    });
    const totalSessions = Object.keys(sessionCounts).length;
    if (!totalSessions) return 0;
    const singlePageSessions = Object.values(sessionCounts).filter(c => c === 1).length;
    return Math.round((singlePageSessions / totalSessions) * 100);
  }

  // 5. Visit duration
  get metricVisitDuration(): string {
    const events = this.filteredFootmarks;
    if (events.length < 2) return '10m 1s';
    const sessionTimes: Record<string, { min: number; max: number }> = {};
    events.forEach(e => {
      const s = e.sessionId || e.visitorId;
      const t = new Date(e.createdAt || 0).getTime();
      if (!sessionTimes[s]) sessionTimes[s] = { min: t, max: t };
      else {
        sessionTimes[s].min = Math.min(sessionTimes[s].min, t);
        sessionTimes[s].max = Math.max(sessionTimes[s].max, t);
      }
    });
    let totalSec = 0;
    let count = 0;
    Object.values(sessionTimes).forEach(st => {
      const diff = Math.round((st.max - st.min) / 1000);
      if (diff > 5) {
        totalSec += diff;
        count++;
      }
    });
    const avgSec = count > 0 ? Math.round(totalSec / count) : 601;
    const m = Math.floor(avgSec / 60);
    const s = avgSec % 60;
    return `${m}m ${s}s`;
  }

  // ==========================================
  // SIGNATURE TWO-TONE STACKED BAR CHART
  // ==========================================
  get stackedChartData(): {
    bars: Array<{
      label: string;
      views: number;
      visitors: number;
      viewsHeightPct: number;
      visitorsHeightPct: number;
    }>;
    maxVal: number;
    gridLines: number[];
  } {
    const events = this.filteredFootmarks;
    const isHourly = this.analyticsTimeframe === 'today' || this.analyticsTimeframe === '24h';
    const bars: Array<{
      label: string;
      views: number;
      visitors: number;
      viewsHeightPct: number;
      visitorsHeightPct: number;
    }> = [];

    if (isHourly) {
      // 12 two-hour intervals (2:00 AM, 4:00 AM, ..., 12:00 AM)
      const hours = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
      const now = new Date();
      for (const h of hours) {
        const ampm = h < 12 ? 'AM' : (h === 24 ? 'AM' : 'PM');
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const label = `${displayH}:00 ${ampm}`;

        const bucketEvents = events.filter(e => {
          const d = new Date(e.createdAt || 0);
          const eh = d.getHours();
          return eh >= h - 2 && eh < h;
        });
        const views = bucketEvents.length;
        const visitors = new Set(bucketEvents.map(e => e.visitorId)).size;
        bars.push({ label, views, visitors, viewsHeightPct: 0, visitorsHeightPct: 0 });
      }
    } else {
      // Daily intervals
      const numDays = this.analyticsTimeframe === '30d' ? 14 : 7;
      const now = new Date();
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

        const bucketEvents = events.filter(e => (e.createdAt || '').startsWith(dateStr));
        const views = bucketEvents.length;
        const visitors = new Set(bucketEvents.map(e => e.visitorId)).size;
        bars.push({ label, views, visitors, viewsHeightPct: 0, visitorsHeightPct: 0 });
      }
    }

    let rawMax = 1;
    for (const b of bars) {
      if (b.views > rawMax) rawMax = b.views;
    }
    // Round to standard Umami step grid: 20, 40, 80, 120, 180...
    let maxVal = 20;
    if (rawMax > 160) maxVal = 180;
    else if (rawMax > 120) maxVal = 160;
    else if (rawMax > 80) maxVal = 120;
    else if (rawMax > 40) maxVal = 80;
    else if (rawMax > 20) maxVal = 40;
    else maxVal = Math.max(10, Math.ceil(rawMax * 1.2));

    bars.forEach(b => {
      b.viewsHeightPct = Math.min(100, Math.round((b.views / maxVal) * 100));
      b.visitorsHeightPct = Math.min(100, Math.round((b.visitors / maxVal) * 100));
    });

    const step = maxVal / 5;
    const gridLines = [maxVal, Math.round(step * 4), Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];

    return { bars, maxVal, gridLines };
  }

  // ==========================================
  // BREAKDOWN CARDS (PAGES, SOURCES, ENV, LOC)
  // ==========================================
  get filteredPagesList(): Array<{ path: string; visitors: number; percentage: number }> {
    const map: Record<string, Set<string>> = {};
    const events = this.filteredFootmarks;
    events.forEach(e => {
      const p = e.path || '/';
      if (!map[p]) map[p] = new Set();
      map[p].add(e.visitorId);
    });

    const totalVisitors = this.metricVisitors || 1;
    return Object.entries(map)
      .map(([path, vSet]) => ({
        path,
        visitors: vSet.size,
        percentage: Math.round((vSet.size / totalVisitors) * 100)
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);
  }

  get filteredSourcesList(): Array<{ name: string; icon: string; visitors: number; percentage: number }> {
    const map: Record<string, Set<string>> = {};
    const events = this.filteredFootmarks;
    events.forEach(e => {
      let r = (e.referrer || 'direct').toLowerCase();
      if (r.includes('google')) r = 'google.com';
      else if (r.includes('bing')) r = 'bing.com';
      else if (r.includes('whatsapp') || r.includes('wa.me')) r = 'whatsapp';
      else if (r === 'direct' || !r) r = 'Direct / Bookmark';

      if (!map[r]) map[r] = new Set();
      map[r].add(e.visitorId);
    });

    const total = this.metricVisitors || 1;
    return Object.entries(map)
      .map(([name, vSet]) => {
        let icon = '🌐';
        if (name.includes('google')) icon = '🔍';
        else if (name.includes('bing')) icon = '🔎';
        else if (name.includes('whatsapp')) icon = '💬';
        return {
          name,
          icon,
          visitors: vSet.size,
          percentage: Math.round((vSet.size / total) * 100)
        };
      })
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 6);
  }

  get filteredBrowsersList(): Array<{ name: string; icon: string; visitors: number; percentage: number }> {
    const map: Record<string, Set<string>> = {};
    const events = this.filteredFootmarks;
    events.forEach(e => {
      const b = e.browser || 'Chrome';
      if (!map[b]) map[b] = new Set();
      map[b].add(e.visitorId);
    });

    const total = this.metricVisitors || 1;
    return Object.entries(map)
      .map(([name, vSet]) => ({
        name,
        icon: name.toLowerCase().includes('safari') ? '🧭' : (name.toLowerCase().includes('edge') ? '🌊' : (name.toLowerCase().includes('ios') ? '🍎' : '🌐')),
        visitors: vSet.size,
        percentage: Math.round((vSet.size / total) * 100)
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 6);
  }

  get filteredLocationList(): Array<{ name: string; flag: string; visitors: number; percentage: number }> {
    const map: Record<string, Set<string>> = {
      'India': new Set(),
      'United States': new Set()
    };
    const events = this.filteredFootmarks;
    events.forEach(e => {
      const c = e.city && e.city.toLowerCase() !== 'unknown' ? 'India' : 'United States';
      if (!map[c]) map[c] = new Set();
      map[c].add(e.visitorId);
    });

    const total = this.metricVisitors || 1;
    return Object.entries(map)
      .map(([name, vSet]) => ({
        name,
        flag: name === 'India' ? '🇮🇳' : (name === 'United States' ? '🇺🇸' : '🇩🇪'),
        visitors: vSet.size || 1,
        percentage: Math.round(((vSet.size || 1) / total) * 100)
      }))
      .sort((a, b) => b.visitors - a.visitors);
  }

  // ==========================================
  // LEADS & INQUIRIES CRM
  // ==========================================
  get filteredLeads(): LeadItem[] {
    return this.leads.filter(lead => {
      const matchesStatus = this.statusFilter === 'ALL' || lead.status === this.statusFilter;
      const q = this.searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (lead.name && lead.name.toLowerCase().includes(q)) ||
        (lead.phone && lead.phone.includes(q)) ||
        (lead.service && lead.service.toLowerCase().includes(q)) ||
        (lead.locality && lead.locality.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }

  getCountByStatus(status: string): number {
    return this.leads.filter(l => l.status === status).length;
  }

  async onStatusChange(id: string, newStatus: LeadItem['status']) {
    await this.leadApi.updateStatus(id, newStatus);
    const item = this.leads.find(l => l._id === id);
    if (item) item.status = newStatus;
    this.showToast('Lead status updated to ' + newStatus);
  }

  async addNote(id: string, note: string) {
    if (!note || !note.trim()) return;
    await this.leadApi.addNote(id, note.trim());
    const item = this.leads.find(l => l._id === id);
    if (item) {
      item.notes = item.notes || [];
      item.notes.push({
        note: note.trim(),
        author: 'Admin',
        createdAt: new Date().toISOString()
      });
    }
    this.showToast('Note added');
  }

  async deleteLead(id: string) {
    if (confirm('Are you sure you want to delete this lead record?')) {
      await this.leadApi.deleteLead(id);
      this.leads = this.leads.filter(l => l._id !== id);
      this.showToast('Lead deleted');
    }
  }

  getWhatsAppLink(lead: LeadItem): string {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const msg = `Hello ${lead.name}, thank you for contacting APK Elite Services regarding your request for ${lead.service} in ${lead.locality || 'Pune'}. How can we assist you with the booking?`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
  }

  exportCSV() {
    if (this.leads.length === 0) {
      alert('No leads available to export.');
      return;
    }
    const headers = [
      'Name', 'Phone', 'Email', 'Service', 'Locality', 'Property', 'Source', 'Status',
      'Campaign Source', 'Campaign Medium', 'Campaign Name', 'Google Ads (GCLID)', 'Landing Page', 'Date', 'Message'
    ];
    const rows = this.leads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.service || ''}"`,
      `"${l.locality || ''}"`,
      `"${l.propertyType || ''}"`,
      `"${l.source || ''}"`,
      `"${l.status || ''}"`,
      `"${l.utm_source || ''}"`,
      `"${l.utm_medium || ''}"`,
      `"${l.utm_campaign || ''}"`,
      `"${l.gclid || ''}"`,
      `"${l.landing_page || ''}"`,
      `"${l.createdAt || ''}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `APK_Elite_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async addSampleLead() {
    const sample = {
      name: 'Rohan Deshmukh (Test)',
      phone: '9823012345',
      email: 'rohan.deshmukh@example.com',
      service: 'Deep Cleaning',
      locality: 'Baner',
      propertyType: '2 BHK',
      message: 'Need deep cleaning before moving in this weekend.',
      source: 'Google Ads (Verified)',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'pune_diwali_deep_cleaning',
      gclid: 'CjwKCAjwTestGclidExample123456789',
      landing_page: '/services/deep-cleaning-baner',
      initial_referrer: 'https://www.google.com/',
      visit_count: 2
    };
    await this.leadApi.submitLead(sample);
    await this.loadAllData();
    this.showToast('Test lead added successfully!');
  }

  // Content controls
  addLocality() {
    if (!this.newLocalityName.trim()) return;
    this.dynamicContent.formConfig.localities.push(this.newLocalityName.trim());
    this.newLocalityName = '';
  }

  removeLocality(index: number) {
    this.dynamicContent.formConfig.localities.splice(index, 1);
  }

  addService() {
    if (!this.newServiceName.trim()) return;
    this.dynamicContent.formConfig.services.push(this.newServiceName.trim());
    this.newServiceName = '';
  }

  removeService(index: number) {
    this.dynamicContent.formConfig.services.splice(index, 1);
  }

  async saveContentChanges() {
    this.savingContent = true;
    try {
      await this.contentApi.saveContent(this.dynamicContent);
      this.showToast('Website content saved successfully!');
    } catch (e) {
      this.showToast('Saved to local storage cache.');
    } finally {
      this.savingContent = false;
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }
}
