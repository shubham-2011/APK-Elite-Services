import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { CmsRedirectComponent } from './cms-redirect.component';
import { SeoService } from '../seo.service';
import { LeadApiService, LeadItem } from '../shared/lead-api.service';
import { ContentApiService, DynamicContent } from '../shared/content-api.service';
import { FootmarkApiService, FootmarkStats, FootmarkEvent } from '../shared/footmark-api.service';

describe('CmsRedirectComponent (CMS Dashboard Unit Test Suite)', () => {
  let component: CmsRedirectComponent;
  let fixture: ComponentFixture<CmsRedirectComponent>;

  const mockLeads: LeadItem[] = [
    {
      _id: 'lead_1',
      name: 'Rohan Sharma',
      phone: '9820011223',
      email: 'rohan@example.com',
      service: 'Deep Cleaning',
      locality: 'Wakad',
      source: 'Google Ads',
      status: 'NEW',
      notes: [],
      createdAt: '2026-11-12T10:00:00.000Z',
      updatedAt: '2026-11-12T10:00:00.000Z'
    },
    {
      _id: 'lead_2',
      name: 'Priya Patil',
      phone: '9876543210',
      email: 'priya@example.com',
      service: 'Kitchen Deep Cleaning',
      locality: 'Baner',
      source: 'Direct',
      status: 'CONTACTED',
      notes: [{ note: 'Called customer, requested callback in evening', author: 'Admin', createdAt: '2026-11-12T10:30:00.000Z' }],
      createdAt: '2026-11-12T09:00:00.000Z',
      updatedAt: '2026-11-12T10:30:00.000Z'
    },
    {
      _id: 'lead_3',
      name: 'Amit Deshmukh',
      phone: '9123456789',
      service: 'Sofa & Upholstery Cleaning',
      locality: 'Hinjewadi',
      source: 'WhatsApp',
      status: 'QUOTE_SENT',
      notes: [],
      createdAt: '2026-11-12T08:00:00.000Z',
      updatedAt: '2026-11-12T08:00:00.000Z'
    }
  ];

  const mockFootmarkEvents: FootmarkEvent[] = [
    {
      _id: 'ev_1',
      visitorId: 'vis_alpha',
      sessionId: 'ses_1',
      path: '/',
      pageTitle: 'Home',
      landingPage: '/',
      referrer: 'https://www.google.com/search',
      browser: 'Chrome',
      os: 'Windows',
      device: 'desktop',
      city: 'Pune',
      createdAt: new Date().toISOString()
    },
    {
      _id: 'ev_2',
      visitorId: 'vis_alpha',
      sessionId: 'ses_1',
      path: '/services/deep-cleaning',
      pageTitle: 'Deep Cleaning',
      landingPage: '/',
      referrer: 'https://www.google.com/search',
      browser: 'Chrome',
      os: 'Windows',
      device: 'desktop',
      city: 'Pune',
      createdAt: new Date(Date.now() + 60000).toISOString()
    },
    {
      _id: 'ev_3',
      visitorId: 'vis_beta',
      sessionId: 'ses_2',
      path: '/about',
      pageTitle: 'About Us',
      landingPage: '/about',
      referrer: 'https://wa.me/',
      browser: 'Safari',
      os: 'iOS',
      device: 'mobile',
      city: 'Pune',
      createdAt: new Date().toISOString()
    }
  ];

  const mockFootmarkStats: FootmarkStats = {
    totalFootmarks: 3,
    uniqueVisitors: 2,
    todayFootmarks: 3,
    todayUniqueVisitors: 2,
    topPages: [
      { path: '/', title: 'Home', count: 1, percentage: 33 },
      { path: '/services/deep-cleaning', title: 'Deep Cleaning', count: 1, percentage: 33 },
      { path: '/about', title: 'About Us', count: 1, percentage: 33 }
    ],
    deviceCounts: { mobile: 1, desktop: 2, tablet: 0 },
    topReferrers: [{ referrer: 'google.com', count: 2 }, { referrer: 'whatsapp', count: 1 }],
    recentFootmarks: mockFootmarkEvents
  };

  let mockSeoService: jasmine.SpyObj<SeoService>;
  let mockLeadApiService: jasmine.SpyObj<LeadApiService>;
  let mockContentApiService: jasmine.SpyObj<ContentApiService>;
  let mockFootmarkApiService: jasmine.SpyObj<FootmarkApiService>;

  beforeEach(async () => {
    mockSeoService = jasmine.createSpyObj('SeoService', ['generateTags']);
    mockLeadApiService = jasmine.createSpyObj('LeadApiService', [
      'fetchAllLeads',
      'updateStatus',
      'addNote',
      'deleteLead',
      'submitLead'
    ]);
    mockContentApiService = jasmine.createSpyObj('ContentApiService', ['fetchLiveContent', 'saveContent']);
    mockFootmarkApiService = jasmine.createSpyObj('FootmarkApiService', ['fetchStats', 'simulateVisit']);

    mockLeadApiService.fetchAllLeads.and.returnValue(Promise.resolve([...mockLeads]));
    mockLeadApiService.updateStatus.and.returnValue(Promise.resolve({ success: true } as any));
    mockLeadApiService.addNote.and.returnValue(Promise.resolve({ success: true } as any));
    mockLeadApiService.deleteLead.and.returnValue(Promise.resolve({ success: true } as any));
    mockContentApiService.fetchLiveContent.and.returnValue(Promise.resolve({
      companyName: 'APK Elite Services',
      phone: '+91 88301 67863',
      whatsapp: '918830167863',
      email: 'info@apkeliteservices.in',
      promoBanner: { enabled: true, text: 'Sale', discountPercent: 10 },
      formConfig: { modalTitle: 'Quote', modalSubtitle: 'Details', localities: ['Wakad'], services: ['Deep Cleaning'] }
    }));
    mockFootmarkApiService.fetchStats.and.returnValue(Promise.resolve(mockFootmarkStats));

    await TestBed.configureTestingModule({
      imports: [CmsRedirectComponent],
      providers: [
        provideRouter([]),
        { provide: SeoService, useValue: mockSeoService },
        { provide: LeadApiService, useValue: mockLeadApiService },
        { provide: ContentApiService, useValue: mockContentApiService },
        { provide: FootmarkApiService, useValue: mockFootmarkApiService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CmsRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ========================================================
  // 1. INITIALIZATION & SEO
  // ========================================================
  describe('Initialization & Setup', () => {
    it('should create the CMS dashboard component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize SEO tags with CMS title and /cms route', () => {
      expect(mockSeoService.generateTags).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'APK Elite Services Analytics & Admin Portal',
        path: '/cms'
      }));
    });

    it('should have default admin credentials and dark mode enabled by default', () => {
      expect(component.adminName).toBeDefined();
      expect(component.adminUsername).toBeDefined();
      expect(component.darkMode).toBeTrue();
    });
  });

  // ========================================================
  // 2. LEAD CRM & FILTRATION
  // ========================================================
  describe('Lead Management & Search Filtering', () => {
    beforeEach(() => {
      component.leads = [...mockLeads];
    });

    it('should return all leads when statusFilter is ALL and searchQuery is empty', () => {
      component.statusFilter = 'ALL';
      component.searchQuery = '';
      expect(component.filteredLeads.length).toBe(3);
    });

    it('should filter leads by status correctly', () => {
      component.statusFilter = 'NEW';
      expect(component.filteredLeads.length).toBe(1);
      expect(component.filteredLeads[0].name).toBe('Rohan Sharma');

      component.statusFilter = 'CONTACTED';
      expect(component.filteredLeads.length).toBe(1);
      expect(component.filteredLeads[0].name).toBe('Priya Patil');

      component.statusFilter = 'COMPLETED';
      expect(component.filteredLeads.length).toBe(0);
    });

    it('should filter leads by customer name query case-insensitively', () => {
      component.statusFilter = 'ALL';
      component.searchQuery = 'rohan';
      expect(component.filteredLeads.length).toBe(1);
      expect(component.filteredLeads[0]._id).toBe('lead_1');
    });

    it('should filter leads by phone number query', () => {
      component.statusFilter = 'ALL';
      component.searchQuery = '987654';
      expect(component.filteredLeads.length).toBe(1);
      expect(component.filteredLeads[0].name).toBe('Priya Patil');
    });

    it('should filter leads by locality query', () => {
      component.statusFilter = 'ALL';
      component.searchQuery = 'Hinjewadi';
      expect(component.filteredLeads.length).toBe(1);
      expect(component.filteredLeads[0].service).toBe('Sofa & Upholstery Cleaning');
    });

    it('should filter leads by service query', () => {
      component.statusFilter = 'ALL';
      component.searchQuery = 'Kitchen';
      expect(component.filteredLeads.length).toBe(1);
      expect(component.filteredLeads[0].name).toBe('Priya Patil');
    });

    it('should accurately calculate count of leads by status', () => {
      expect(component.getCountByStatus('NEW')).toBe(1);
      expect(component.getCountByStatus('CONTACTED')).toBe(1);
      expect(component.getCountByStatus('QUOTE_SENT')).toBe(1);
      expect(component.getCountByStatus('CONFIRMED')).toBe(0);
    });
  });

  // ========================================================
  // 3. CRM ACTIONS (Status, Notes, WhatsApp, CSV)
  // ========================================================
  describe('CRM Actions (Status Update, Notes, WhatsApp, CSV)', () => {
    beforeEach(() => {
      component.leads = JSON.parse(JSON.stringify(mockLeads));
    });

    it('should update lead status and notify with a toast', async () => {
      await component.onStatusChange('lead_1', 'CONTACTED');
      expect(mockLeadApiService.updateStatus).toHaveBeenCalledWith('lead_1', 'CONTACTED');
      const updated = component.leads.find(l => l._id === 'lead_1');
      expect(updated?.status).toBe('CONTACTED');
      expect(component.toastMessage).toContain('Lead status updated to CONTACTED');
    });

    it('should append internal staff note with author and timestamp', async () => {
      await component.addNote('lead_1', 'Customer requested callback on Saturday');
      expect(mockLeadApiService.addNote).toHaveBeenCalledWith('lead_1', 'Customer requested callback on Saturday');
      const updated = component.leads.find(l => l._id === 'lead_1');
      expect(updated?.notes.length).toBe(1);
      expect(updated?.notes[0].note).toBe('Customer requested callback on Saturday');
      expect(updated?.notes[0].author).toBe('Admin');
      expect(component.toastMessage).toBe('Note added');
    });

    it('should ignore empty or whitespace-only notes', async () => {
      await component.addNote('lead_1', '   ');
      expect(mockLeadApiService.addNote).not.toHaveBeenCalled();
    });

    it('should construct a sanitized WhatsApp deep link with 91 country code and prefilled message', () => {
      const lead = component.leads[0]; // Rohan Sharma, phone 9820011223
      const waLink = component.getWhatsAppLink(lead);
      expect(waLink).toContain('https://wa.me/919820011223');
      expect(waLink).toContain(encodeURIComponent('Rohan Sharma'));
      expect(waLink).toContain(encodeURIComponent('Deep Cleaning'));
      expect(waLink).toContain(encodeURIComponent('Wakad'));
    });

    it('should handle already-prefixed phone numbers in WhatsApp link correctly', () => {
      const leadWithPrefix: LeadItem = {
        ...mockLeads[0],
        phone: '+91 98200 11223'
      };
      const waLink = component.getWhatsAppLink(leadWithPrefix);
      expect(waLink).toContain('https://wa.me/919820011223');
      expect(waLink).not.toContain('9191');
    });
  });

  // ========================================================
  // 4. UMAMI-STYLE ANALYTICS & METRIC CALCULATIONS
  // ========================================================
  describe('Analytics & Telemetry Metrics Calculations', () => {
    beforeEach(() => {
      component.footmarkStats = JSON.parse(JSON.stringify(mockFootmarkStats));
      component.analyticsTimeframe = 'all';
    });

    it('should calculate unique visitor metric correctly', () => {
      // mockFootmarkEvents has 2 unique visitors: vis_alpha and vis_beta
      expect(component.metricVisitors).toBe(2);
    });

    it('should calculate unique visits/sessions metric correctly', () => {
      // mockFootmarkEvents has 2 unique sessions: ses_1 and ses_2
      expect(component.metricVisits).toBe(2);
    });

    it('should calculate total views metric correctly', () => {
      // mockFootmarkEvents has 3 events
      expect(component.metricViews).toBe(3);
    });

    it('should compute bounce rate accurately (single-page sessions / total sessions)', () => {
      // ses_1 has 2 events (not bounced)
      // ses_2 has 1 event (bounced)
      // Bounce rate = 1 / 2 = 50%
      expect(component.metricBounceRate).toBe(50);
    });

    it('should compute average visit duration in minutes and seconds', () => {
      // ses_1 diff is 60000ms = 60s -> 1m 0s
      const duration = component.metricVisitDuration;
      expect(duration).toContain('m');
      expect(duration).toContain('s');
    });

    it('should generate breakdown lists for visited paths', () => {
      component.pagesSubTab = 'path';
      const pages = component.activePagesList;
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.some(p => p.key === '/')).toBeTrue();
    });

    it('should generate breakdown lists for client environment (browsers, os, devices)', () => {
      component.envSubTab = 'browsers';
      const browsers = component.activeEnvList;
      expect(browsers.some(b => b.name === 'Chrome')).toBeTrue();

      component.envSubTab = 'devices';
      const devices = component.activeEnvList;
      expect(devices.some(d => d.name === 'Desktop')).toBeTrue();
      expect(devices.some(d => d.name === 'Mobile')).toBeTrue();
    });

    it('should generate breakdown lists for traffic sources', () => {
      component.sourcesSubTab = 'referrers';
      const sources = component.activeSourcesList;
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some(s => s.name.includes('google'))).toBeTrue();
    });

    it('should generate signature stacked chart data structure', () => {
      const chart = component.stackedChartData;
      expect(chart.bars).toBeDefined();
      expect(chart.bars.length).toBeGreaterThan(0);
      expect(chart.maxVal).toBeGreaterThanOrEqual(10);
      expect(chart.gridLines.length).toBe(6);
    });
  });

  // ========================================================
  // 5. PROFILE & MULTI-USER STATE
  // ========================================================
  describe('Profile & Multi-User Modal Management', () => {
    it('should open and populate the profile PIN modal', () => {
      component.adminName = 'Operations Manager';
      component.adminUsername = 'manager@apkeliteservices.in';
      component.openPinModal();

      expect(component.showPinModal).toBeTrue();
      expect(component.profileNameInput).toBe('Operations Manager');
      expect(component.profileUsernameInput).toBe('manager@apkeliteservices.in');
      expect(component.pinChangeError).toBe('');
    });

    it('should validate display name and reject empty input', () => {
      component.openPinModal();
      component.profileNameInput = '   ';
      component.profileUsernameInput = 'manager@apkeliteservices.in';
      const fakeEvent = new Event('submit');
      component.onSaveNewPin(fakeEvent);

      expect(component.pinChangeError).toContain('Display Name cannot be empty');
      expect(component.showPinModal).toBeTrue();
    });

    it('should validate username and reject empty input', () => {
      component.openPinModal();
      component.profileNameInput = 'Operations Manager';
      component.profileUsernameInput = '   ';
      const fakeEvent = new Event('submit');
      component.onSaveNewPin(fakeEvent);

      expect(component.pinChangeError).toContain('Username / Email cannot be empty');
      expect(component.showPinModal).toBeTrue();
    });

    it('should update profile display name and username successfully', () => {
      component.openPinModal();
      component.profileNameInput = 'Operations Manager';
      component.profileUsernameInput = 'manager@apkeliteservices.in';
      const fakeEvent = new Event('submit');
      component.onSaveNewPin(fakeEvent);

      expect(component.adminName).toBe('Operations Manager');
      expect(component.adminUsername).toBe('manager@apkeliteservices.in');
      expect(component.showPinModal).toBeFalse();
      expect(component.toastMessage).toContain('updated successfully');
    });
  });

  // ========================================================
  // 6. DYNAMIC CONTENT CONFIGURATION
  // ========================================================
  describe('Dynamic Content & Form Configuration', () => {
    it('should add a new locality and prevent duplicates or blanks', () => {
      const initialCount = component.dynamicContent.formConfig.localities.length;
      component.newLocalityName = 'Ravet West';
      component.addLocality();

      expect(component.dynamicContent.formConfig.localities.length).toBe(initialCount + 1);
      expect(component.dynamicContent.formConfig.localities).toContain('Ravet West');
      expect(component.newLocalityName).toBe('');
    });

    it('should remove a locality by index', () => {
      const initialCount = component.dynamicContent.formConfig.localities.length;
      component.removeLocality(0);
      expect(component.dynamicContent.formConfig.localities.length).toBe(initialCount - 1);
    });

    it('should add a new service item', () => {
      const initialCount = component.dynamicContent.formConfig.services.length;
      component.newServiceName = 'Facade & Glass Cleaning';
      component.addService();

      expect(component.dynamicContent.formConfig.services.length).toBe(initialCount + 1);
      expect(component.dynamicContent.formConfig.services).toContain('Facade & Glass Cleaning');
      expect(component.newServiceName).toBe('');
    });

    it('should remove a service item by index', () => {
      const initialCount = component.dynamicContent.formConfig.services.length;
      component.removeService(0);
      expect(component.dynamicContent.formConfig.services.length).toBe(initialCount - 1);
    });
  });

  // ========================================================
  // 7. UI TOGGLES & THEME
  // ========================================================
  describe('UI Toggles & Theme Management', () => {
    it('should toggle dark mode state and show toast', () => {
      component.darkMode = true;
      component.toggleDarkMode();
      expect(component.darkMode).toBeFalse();
      expect(component.toastMessage).toContain('Light Mode');

      component.toggleDarkMode();
      expect(component.darkMode).toBeTrue();
      expect(component.toastMessage).toContain('Dark Mode');
    });

    it('should toggle and close mobile sidebar drawer', () => {
      expect(component.mobileSidebarOpen).toBeFalse();
      component.toggleMobileSidebar();
      expect(component.mobileSidebarOpen).toBeTrue();
      component.closeMobileSidebar();
      expect(component.mobileSidebarOpen).toBeFalse();
    });

    it('should return safe SVG markup for recognized platforms without throwing', () => {
      const winSvg = component.getIconSvg('Windows');
      expect(winSvg).toBeDefined();

      const macSvg = component.getIconSvg('macOS');
      expect(macSvg).toBeDefined();

      const androidSvg = component.getIconSvg('Android');
      expect(androidSvg).toBeDefined();

      const chromeSvg = component.getIconSvg('Chrome');
      expect(chromeSvg).toBeDefined();
    });
  });
});
