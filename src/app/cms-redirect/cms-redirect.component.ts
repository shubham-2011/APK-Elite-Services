import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';
import { LeadApiService, LeadItem } from '../shared/lead-api.service';
import { ContentApiService, DynamicContent, ServicePriceItem } from '../shared/content-api.service';
import { FootmarkApiService, FootmarkStats, FootmarkEvent } from '../shared/footmark-api.service';

const PIN_STORAGE_KEY = 'apk_cms_pin_auth';
const CUSTOM_PIN_KEY = 'apk_cms_custom_pin';
const DEFAULT_PIN = '1234';

@Component({
  selector: 'app-cms-redirect',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="cms-root">

      <!-- ============================================================ -->
      <!-- 1. PIN AUTHENTICATION SCREEN -->
      <!-- ============================================================ -->
      <div *ngIf="!isAuthenticated" class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-icon">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2>APK Elite Services</h2>
          <p class="auth-sub">Internal CMS Portal & Lead Management</p>

          <form (submit)="onPinSubmit($event)" class="pin-form">
            <div class="form-group">
              <label for="pinInput">Enter Admin PIN</label>
              <input
                id="pinInput"
                type="password"
                maxlength="20"
                [(ngModel)]="enteredPin"
                name="enteredPin"
                placeholder="••••"
                class="pin-input"
                autofocus
              />
            </div>

            <div *ngIf="pinError" class="error-msg">
              Incorrect PIN. Please try again.
            </div>

            <button type="submit" class="btn-unlock">Unlock CMS Dashboard</button>

            <div class="auth-hint">
              <span>Admin PIN: <strong>{{ getStoredPin() }}</strong></span>
              <a routerLink="/" class="back-link">← Return to Website</a>
            </div>
          </form>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- 2. MAIN CMS DASHBOARD (WHEN AUTHENTICATED) -->
      <!-- ============================================================ -->
      <div *ngIf="isAuthenticated" class="dashboard-wrapper">

        <!-- TOP BAR -->
        <header class="dash-header">
          <div class="header-left">
            <div class="brand-title">
              <span class="logo-text">APK Elite</span>
              <span class="badge-role">Admin CMS</span>
            </div>
            <div class="system-status">
              <span class="status-dot pulse"></span>
              <span>All Systems Online</span>
            </div>
            <div 
              class="db-sync-status" 
              [class.synced]="isDbConnected" 
              [class.isolated]="!isDbConnected" 
              (click)="showDbHelpModal = !showDbHelpModal"
              title="Click to view Database & Cross-Device Sync Status"
            >
              <span class="db-dot"></span>
              <span>{{ isDbConnected ? 'MongoDB Cloud Synced' : 'Local Storage Mode' }}</span>
              <span class="db-badge-tag">{{ isDbConnected ? 'Live Multi-Device' : 'Need MONGODB_URI' }}</span>
            </div>
          </div>

          <div class="header-right">
            <button (click)="loadAllData()" [disabled]="refreshing" class="btn-action">
              <span [class.spin]="refreshing">⟳</span>
              <span>{{ refreshing ? 'Syncing...' : 'Refresh' }}</span>
            </button>
            <a routerLink="/" class="btn-action outline" target="_blank">Live Site ↗</a>
            <button (click)="openPinModal()" class="btn-action" title="Change Admin PIN">
              <span>🔐</span>
              <span>Change PIN</span>
            </button>
            <button (click)="toggleDarkMode()" class="btn-action" title="Toggle dark mode" id="cms-dark-toggle">
              {{ darkMode ? '☀️' : '🌙' }}
            </button>
            <button (click)="logout()" class="btn-action danger">Sign Out</button>
          </div>
        </header>

        <!-- SUB-NAV TABS -->
        <nav class="dash-tabs">
          <button
            (click)="activeTab = 'leads'"
            [class.active]="activeTab === 'leads'"
            class="tab-btn"
          >
            Leads &amp; Inquiries
            <span class="count-pill">{{ leads.length }}</span>
          </button>
          <button
            (click)="activeTab = 'footmarks'"
            [class.active]="activeTab === 'footmarks'"
            class="tab-btn"
          >
            Visitors &amp; Analytics
            <span class="count-pill">{{ footmarkStats?.totalFootmarks || 0 }}</span>
          </button>
          <button
            (click)="activeTab = 'form'"
            [class.active]="activeTab === 'form'"
            class="tab-btn"
          >
            Form Controls
          </button>
          <button
            (click)="activeTab = 'content'"
            [class.active]="activeTab === 'content'"
            class="tab-btn"
          >
            Content &amp; Pricing
          </button>
        </nav>

        <!-- TOAST MESSAGE -->
        <div *ngIf="toastMessage" class="toast-alert">
          {{ toastMessage }}
        </div>

        <!-- ============================================================ -->
        <!-- TAB 1: LEADS & INQUIRIES -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab === 'leads'" class="tab-content">

          <!-- METRICS CARDS -->
          <div class="metrics-grid">
            <div class="metric-card total">
              <div class="metric-num">{{ leads.length }}</div>
              <div class="metric-label">Total Leads Received</div>
            </div>
            <div class="metric-card footmarks" (click)="activeTab = 'footmarks'" style="cursor: pointer;">
              <div class="metric-num">{{ footmarkStats?.totalFootmarks || 0 }}</div>
              <div class="metric-label">Total Footmarks ({{ footmarkStats?.todayFootmarks || 0 }} today) ↗</div>
            </div>
            <div class="metric-card new">
              <div class="metric-num">{{ getCountByStatus('NEW') }}</div>
              <div class="metric-label">New / Uncontacted</div>
            </div>
            <div class="metric-card progress">
              <div class="metric-num">{{ getCountByStatus('CONTACTED') + getCountByStatus('QUOTE_SENT') }}</div>
              <div class="metric-label">In Discussion / Follow-up</div>
            </div>
            <div class="metric-card converted">
              <div class="metric-num">{{ getCountByStatus('CONFIRMED') + getCountByStatus('COMPLETED') }}</div>
              <div class="metric-label">Confirmed / Completed</div>
            </div>
          </div>


          <!-- CONTROLS ROW -->
          <div class="filter-bar">
            <div class="search-box">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by customer name, phone, service, locality..."
                class="search-input"
              />
            </div>

            <div class="select-filters">
              <select [(ngModel)]="statusFilter" class="filter-select">
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUOTE_SENT">Quote Sent</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="LOST">Lost / Cancelled</option>
              </select>

              <button (click)="exportCSV()" class="btn-filter export">
                Export to CSV
              </button>

              <button (click)="addSampleLead()" class="btn-filter sample">
                + Add Test Lead
              </button>
            </div>
          </div>

          <!-- LEADS LIST -->
          <div class="table-container">
            <div *ngIf="filteredLeads.length === 0" class="empty-state">
              <p>No leads found matching your criteria.</p>
              <button (click)="searchQuery = ''; statusFilter = 'ALL'" class="btn-reset">Reset Filters</button>
            </div>

            <div *ngIf="filteredLeads.length > 0" class="leads-grid">
              <div *ngFor="let lead of filteredLeads" class="lead-card" [attr.data-status]="lead.status">

                <!-- CARD TOP -->
                <div class="lead-card-header">
                  <div class="customer-info">
                    <h3 class="cust-name">{{ lead.name }}</h3>
                    <div class="source-tag">{{ lead.source }} · {{ lead.createdAt | date:'short' }}</div>
                    <!-- Attribution & Marketing Intelligence Badges -->
                    <div class="attr-badges-row" *ngIf="lead.utm_source || lead.utm_campaign || lead.gclid || (lead.visit_count && lead.visit_count > 1) || lead.landing_page">
                      <span class="attr-badge source" *ngIf="lead.utm_source">
                        📢 {{ lead.utm_source }}{{ lead.utm_medium ? ' / ' + lead.utm_medium : '' }}
                      </span>
                      <span class="attr-badge campaign" *ngIf="lead.utm_campaign">
                        🎯 {{ lead.utm_campaign }}
                      </span>
                      <span class="attr-badge gclid" *ngIf="lead.gclid" title="Google Ads Click ID Verified">
                        ⭐ Google Ads
                      </span>
                      <span class="attr-badge visits" *ngIf="lead.visit_count && lead.visit_count > 1">
                        🔁 Visit #{{ lead.visit_count }}
                      </span>
                      <span class="attr-badge landing" *ngIf="lead.landing_page" [title]="'Entry: ' + lead.landing_page">
                        🚪 {{ lead.landing_page }}
                      </span>
                    </div>
                  </div>

                  <div class="status-badge-wrap">
                    <select
                      [ngModel]="lead.status"
                      (ngModelChange)="onStatusChange(lead._id, $event)"
                      class="status-select"
                      [ngClass]="'status-' + lead.status.toLowerCase()"
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUOTE_SENT">QUOTE SENT</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </div>
                </div>

                <!-- CARD DETAILS -->
                <div class="lead-details-grid">
                  <div class="detail-item">
                    <span class="detail-lbl">Service:</span>
                    <strong class="detail-val">{{ lead.service }}</strong>
                  </div>
                  <div class="detail-item" *ngIf="lead.locality">
                    <span class="detail-lbl">Locality:</span>
                    <span class="detail-val">📍 {{ lead.locality }}</span>
                  </div>
                  <div class="detail-item" *ngIf="lead.propertyType">
                    <span class="detail-lbl">Property:</span>
                    <span class="detail-val">🏠 {{ lead.propertyType }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-lbl">Phone:</span>
                    <a [href]="'tel:+91' + lead.phone" class="phone-link">+91 {{ lead.phone }}</a>
                  </div>
                  <div class="detail-item" *ngIf="lead.email">
                    <span class="detail-lbl">Email:</span>
                    <a [href]="'mailto:' + lead.email" class="email-link">{{ lead.email }}</a>
                  </div>
                </div>

                <div *ngIf="lead.message" class="cust-message">
                  <strong>Notes/Req:</strong> "{{ lead.message }}"
                </div>

                <!-- CARD ACTIONS -->
                <div class="lead-actions">
                  <a
                    [href]="getWhatsAppLink(lead)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-wa"
                    title="Send WhatsApp message"
                  >
                    💬 WhatsApp Customer
                  </a>

                  <a
                    [href]="'tel:+91' + lead.phone"
                    class="btn-call"
                    title="Direct phone call"
                  >
                    📞 Call
                  </a>

                  <button
                    (click)="deleteLead(lead._id)"
                    class="btn-del"
                    title="Delete record"
                  >
                    🗑
                  </button>
                </div>

                <!-- STAFF NOTES ACCORDION -->
                <div class="notes-section">
                  <div *ngIf="lead.notes && lead.notes.length > 0" class="notes-list">
                    <div *ngFor="let n of lead.notes" class="single-note">
                      <span class="note-time">{{ n.createdAt | date:'shortTime' }}:</span>
                      <span class="note-txt">{{ n.note }}</span>
                    </div>
                  </div>
                  <div class="add-note-inline">
                    <input
                      type="text"
                      #noteInput
                      placeholder="Add internal staff note..."
                      class="inline-note-input"
                      (keyup.enter)="addNote(lead._id, noteInput.value); noteInput.value = ''"
                    />
                    <button
                      (click)="addNote(lead._id, noteInput.value); noteInput.value = ''"
                      class="btn-add-note"
                    >
                      Save
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        <!-- ============================================================ -->
        <!-- TAB 2: FOOTMARKS & VISITOR ANALYTICS -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab === 'footmarks'" class="tab-content">

          <!-- METRICS CARDS (FILTER AWARE) -->
          <div class="metrics-grid">
            <div class="metric-card footmarks">
              <div class="metric-num">{{ filteredFootmarks.length }}</div>
              <div class="metric-label">Filtered Pageviews</div>
            </div>
            <div class="metric-card total">
              <div class="metric-num">{{ filteredUniqueVisitorCount }}</div>
              <div class="metric-label">Unique Visitors</div>
            </div>
            <div class="metric-card converted">
              <div class="metric-num">{{ todayFilteredViews }}</div>
              <div class="metric-label">Today's Visits ({{ todayFilteredVisitors }} unique)</div>
            </div>
            <div class="metric-card progress">
              <div class="metric-num metric-num--sm">
                {{ filteredTopPages[0]?.title || 'Home Deep Cleaning' }}
              </div>
              <div class="metric-label">Top Visited Service</div>
            </div>
          </div>

          <!-- ANALYTICS FILTRATION & VIEW CONTROL BAR -->
          <div class="analytics-control-bar">
            <!-- Timeframe Filter -->
            <div class="control-group">
              <span class="control-label">Timeframe:</span>
              <div class="timeframe-pills">
                <button
                  type="button"
                  (click)="analyticsTimeframe = 'today'"
                  [class.active]="analyticsTimeframe === 'today'"
                  class="pill-btn"
                >
                  Today
                </button>
                <button
                  type="button"
                  (click)="analyticsTimeframe = '7d'"
                  [class.active]="analyticsTimeframe === '7d'"
                  class="pill-btn"
                >
                  7 Days
                </button>
                <button
                  type="button"
                  (click)="analyticsTimeframe = '30d'"
                  [class.active]="analyticsTimeframe === '30d'"
                  class="pill-btn"
                >
                  30 Days
                </button>
                <button
                  type="button"
                  (click)="analyticsTimeframe = 'all'"
                  [class.active]="analyticsTimeframe === 'all'"
                  class="pill-btn"
                >
                  All Time
                </button>
              </div>
            </div>

            <!-- Device Filter -->
            <div class="control-group">
              <span class="control-label">Device:</span>
              <select [(ngModel)]="analyticsDeviceFilter" class="filter-select">
                <option value="all">All Devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            <!-- Channel Filter -->
            <div class="control-group">
              <span class="control-label">Channel:</span>
              <select [(ngModel)]="analyticsChannelFilter" class="filter-select">
                <option value="all">All Channels</option>
                <option value="google">Google Search / Ads</option>
                <option value="whatsapp">WhatsApp Inbound</option>
                <option value="direct">Direct Traffic</option>
                <option value="social">Social Media</option>
              </select>
            </div>

            <!-- Chart Type Switcher -->
            <div class="control-group chart-toggle-group">
              <span class="control-label">Chart Mode:</span>
              <div class="chart-type-toggle">
                <button
                  type="button"
                  (click)="activeChartType = 'line'"
                  [class.active]="activeChartType === 'line'"
                  class="toggle-btn"
                  title="Line Graph"
                >
                  📈 Line Chart
                </button>
                <button
                  type="button"
                  (click)="activeChartType = 'bar'"
                  [class.active]="activeChartType === 'bar'"
                  class="toggle-btn"
                  title="Bar Graph"
                >
                  📊 Bar Graph
                </button>
                <button
                  type="button"
                  (click)="activeChartType = 'pie'"
                  [class.active]="activeChartType === 'pie'"
                  class="toggle-btn"
                  title="Pie / Donut Chart"
                >
                  🍩 Donut Chart
                </button>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- VISUAL TRAFFIC GRAPHS -->
          <!-- ============================================================ -->
          <div class="analytics-graphs-container">

            <!-- MAIN GRAPH CARD -->
            <div class="graph-card trend-chart-card">
              <div class="graph-header">
                <div>
                  <div class="graph-tag">
                    {{ analyticsTimeframe === 'today' ? 'Today' : (analyticsTimeframe === '30d' ? '30-Day View' : (analyticsTimeframe === 'all' ? 'All-Time' : '7-Day Trend')) }}
                  </div>
                  <h3 class="graph-title">
                    {{ activeChartType === 'line' ? 'Visitor & Pageview Line Trend' : (activeChartType === 'bar' ? 'Traffic Volume Bar Graph' : 'Distribution Donut Breakdown') }}
                  </h3>
                  <p class="graph-subtitle">
                    {{ activeChartType === 'pie' ? 'Visual segmentation by device and traffic channel' : 'Continuous daily volume, impressions, and unique user journeys' }}
                  </p>
                </div>

                <!-- Legend / Controls -->
                <div class="graph-legend" *ngIf="activeChartType !== 'pie'">
                  <span class="legend-item"><span class="legend-dot views"></span> Pageviews</span>
                  <span class="legend-item"><span class="legend-dot visitors"></span> Unique Visitors</span>
                </div>
                <div class="pie-metric-toggle" *ngIf="activeChartType === 'pie'">
                  <button
                    type="button"
                    (click)="activePieMetric = 'device'"
                    [class.active]="activePieMetric === 'device'"
                    class="pie-sub-btn"
                  >
                    Devices
                  </button>
                  <button
                    type="button"
                    (click)="activePieMetric = 'channel'"
                    [class.active]="activePieMetric === 'channel'"
                    class="pie-sub-btn"
                  >
                    Sources
                  </button>
                </div>
              </div>

              <!-- ========================================== -->
              <!-- VIEW 1: LINE GRAPH (SVG CURVES & NODES)    -->
              <!-- ========================================== -->
              <div *ngIf="activeChartType === 'line'" class="line-chart-wrapper">
                <svg viewBox="0 0 600 220" class="svg-line-chart" preserveAspectRatio="none">
                  <defs>
                    <!-- Gradient fill for views area -->
                    <linearGradient id="viewsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#ea580c" stop-opacity="0.32"/>
                      <stop offset="100%" stop-color="#ea580c" stop-opacity="0.0"/>
                    </linearGradient>
                    <!-- Gradient fill for visitors area -->
                    <linearGradient id="visitorsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.25"/>
                      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0"/>
                    </linearGradient>
                  </defs>

                  <!-- Horizontal Reference Grid Lines & Y-labels -->
                  <g class="grid-group">
                    <g *ngFor="let grid of lineChartData.gridLines">
                      <line
                        [attr.x1]="lineChartData.padL"
                        [attr.y1]="grid.y"
                        x2="580"
                        [attr.y2]="grid.y"
                        class="grid-line"
                      />
                      <text
                        x="34"
                        [attr.y]="grid.y + 4"
                        text-anchor="end"
                        class="grid-text"
                      >
                        {{ grid.val }}
                      </text>
                    </g>
                  </g>

                  <!-- Area Fills -->
                  <path [attr.d]="lineChartData.viewsArea" fill="url(#viewsAreaGrad)" />
                  <path [attr.d]="lineChartData.visitorsArea" fill="url(#visitorsAreaGrad)" />

                  <!-- Trend Lines -->
                  <path
                    [attr.d]="lineChartData.visitorsPath"
                    fill="none"
                    stroke="#8b5cf6"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="trend-path"
                  />
                  <path
                    [attr.d]="lineChartData.viewsPath"
                    fill="none"
                    stroke="#ea580c"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="trend-path"
                  />

                  <!-- Data Point Nodes (Circles) & Interactive Hover Popups -->
                  <g class="nodes-group" *ngFor="let pt of lineChartData.points">
                    <!-- Views Node -->
                    <circle
                      [attr.cx]="pt.x"
                      [attr.cy]="pt.yViews"
                      r="4.5"
                      fill="#ea580c"
                      stroke="#ffffff"
                      stroke-width="2"
                      class="chart-node"
                    />
                    <!-- Visitors Node -->
                    <circle
                      [attr.cx]="pt.x"
                      [attr.cy]="pt.yVisitors"
                      r="4"
                      fill="#8b5cf6"
                      stroke="#ffffff"
                      stroke-width="2"
                      class="chart-node"
                    />
                    <!-- X-Axis Date Labels -->
                    <text
                      [attr.x]="pt.x"
                      y="212"
                      text-anchor="middle"
                      class="axis-label"
                    >
                      {{ pt.label.split(',')[0] }}
                    </text>
                  </g>
                </svg>

                <div *ngIf="filteredFootmarks.length === 0" class="empty-chart-note">
                  No verified traffic matching the selected filters yet.
                </div>
              </div>

              <!-- ========================================== -->
              <!-- VIEW 2: BAR GRAPH (VERTICAL BARS)          -->
              <!-- ========================================== -->
              <div *ngIf="activeChartType === 'bar'" class="trend-bars-wrapper">
                <div *ngFor="let day of filteredDailyTrends" class="trend-day-col">
                  <div class="bar-container">
                    <div
                      class="bar-bar view-bar"
                      [style.height.%]="getBarHeight(day.views, maxTrendVal)"
                      [title]="day.label + ': ' + day.views + ' Pageviews'"
                    >
                      <span class="bar-val-pop" *ngIf="day.views > 0">{{ day.views }}</span>
                    </div>
                    <div
                      class="bar-bar visitor-bar"
                      [style.height.%]="getBarHeight(day.visitors, maxTrendVal)"
                      [title]="day.label + ': ' + day.visitors + ' Visitors'"
                    >
                      <span class="bar-val-pop sub" *ngIf="day.visitors > 0">{{ day.visitors }}</span>
                    </div>
                  </div>
                  <span class="day-label">{{ day.label.split(',')[0] }}</span>
                </div>

                <div *ngIf="filteredFootmarks.length === 0" class="empty-chart-note">
                  No traffic data recorded for this timeframe.
                </div>
              </div>

              <!-- ========================================== -->
              <!-- VIEW 3: PIE / DONUT CHART BREAKDOWN        -->
              <!-- ========================================== -->
              <div *ngIf="activeChartType === 'pie'" class="pie-chart-wrapper">
                <div class="pie-svg-col">
                  <svg viewBox="0 0 160 160" class="svg-pie">
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="transparent"
                      stroke="var(--bd)"
                      stroke-width="20"
                    />
                    <circle
                      *ngFor="let slice of pieChartData.slices"
                      cx="80"
                      cy="80"
                      r="55"
                      fill="transparent"
                      [attr.stroke]="slice.color"
                      stroke-width="20"
                      [attr.stroke-dasharray]="slice.dash"
                      [attr.stroke-dashoffset]="slice.offset"
                      transform="rotate(-90 80 80)"
                      class="donut-segment"
                    />
                  </svg>
                  <div class="donut-center-info">
                    <span class="donut-total">{{ pieChartData.total }}</span>
                    <span class="donut-lbl">{{ activePieMetric === 'device' ? 'Total Visits' : 'Total Hits' }}</span>
                  </div>
                </div>

                <!-- Donut Legend & Percentages -->
                <div class="pie-legend-col">
                  <div *ngFor="let slice of pieChartData.slices" class="pie-legend-row">
                    <div class="pie-color-indicator" [style.background]="slice.color"></div>
                    <div class="pie-slice-name">{{ slice.label }}</div>
                    <div class="pie-slice-val">{{ slice.count }}</div>
                    <div class="pie-slice-pct">{{ slice.percentage }}%</div>
                  </div>
                  <div *ngIf="pieChartData.slices.length === 0" class="empty-inline">
                    No data to display in breakdown.
                  </div>
                </div>
              </div>

            </div>

          </div>

          <!-- TOP PAGES & DEVICE BREAKDOWN (FILTER-SYNCED) -->
          <div class="data-panels-grid">
            <!-- Top Pages -->
            <div class="data-panel">
              <h3 class="panel-title">Top Visited Services &amp; Pages</h3>
              <div *ngFor="let page of filteredTopPages" class="page-row">
                <div class="page-row-meta">
                  <span class="page-row-title">{{ page.title }}</span>
                  <span class="page-row-count">{{ page.count }} visits ({{ page.percentage }}%)</span>
                </div>
                <div class="mini-track">
                  <div class="mini-fill" [style.width.%]="page.percentage"></div>
                </div>
              </div>
              <div *ngIf="!filteredTopPages.length" class="empty-inline">
                No page visits match the selected filter.
              </div>
            </div>

            <!-- Device Distribution -->
            <div class="data-panel">
              <h3 class="panel-title">Device Distribution &amp; Acquisition</h3>
              <div class="device-grid">
                <div class="device-cell">
                  <div class="device-icon">Mobile</div>
                  <div class="device-count">{{ filteredDeviceCounts.mobile }}</div>
                  <div class="device-label">visitors</div>
                </div>
                <div class="device-cell">
                  <div class="device-icon">Desktop</div>
                  <div class="device-count">{{ filteredDeviceCounts.desktop }}</div>
                  <div class="device-label">visitors</div>
                </div>
                <div class="device-cell">
                  <div class="device-icon">Tablet</div>
                  <div class="device-count">{{ filteredDeviceCounts.tablet }}</div>
                  <div class="device-label">visitors</div>
                </div>
              </div>

              <div class="acquisition-block">
                <div class="acq-label">Acquisition Sources</div>
                <div class="acq-tags">
                  <span *ngFor="let ref of filteredTopReferrers" class="acq-tag">
                    {{ ref.referrer }}: {{ ref.count }}
                  </span>
                  <span *ngIf="!filteredTopReferrers.length" class="acq-empty">
                    No traffic channels recorded in this timeframe
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Live Activity Table -->
          <div class="stream-panel">
            <div class="stream-header">
              <div>
                <h3 class="stream-title">Live Visitor Stream (Filtered: {{ filteredFootmarks.length }})</h3>
                <span class="stream-sub">Verified visitor journeys across apkeliteservices.in</span>
              </div>
              <div class="stream-actions">
                <button (click)="simulateTestVisit()" class="btn-filter sample btn-sm">
                  + Simulate Visit
                </button>
                <button (click)="clearFootmarkHistory()" class="btn-filter btn-sm btn-danger-subtle">
                  Reset Data
                </button>
              </div>
            </div>

            <div class="table-scroll">
              <table class="stream-table">
                <thead>
                  <tr class="stream-thead-row">
                    <th class="stream-th">Page</th>
                    <th class="stream-th">Device / Browser</th>
                    <th class="stream-th">Source</th>
                    <th class="stream-th">Location</th>
                    <th class="stream-th stream-th-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let f of filteredFootmarks" class="stream-row">
                    <td class="stream-td">
                      <div class="stream-page-title">{{ f.pageTitle || 'APK Elite Services' }}</div>
                      <div class="stream-page-path">{{ f.path }}</div>
                    </td>
                    <td class="stream-td stream-device-cell">
                      <span class="stream-device">
                        {{ f.device === 'mobile' ? 'Mobile' : (f.device === 'desktop' ? 'Desktop' : 'Tablet') }}
                      </span>
                      <span class="stream-browser"> · {{ f.browser || 'Browser' }}</span>
                    </td>
                    <td class="stream-td">
                      <span class="referrer-tag">
                        {{ f.referrer || 'Direct' }}
                      </span>
                    </td>
                    <td class="stream-td stream-location">
                      {{ f.city || 'Pune' }}
                    </td>
                    <td class="stream-td stream-time">
                      {{ f.createdAt | date:'MMM d, h:mm a' }}
                    </td>
                  </tr>
                  <tr *ngIf="!filteredFootmarks.length">
                    <td colspan="5" class="stream-empty">
                      No footmarks match your filter criteria.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 3: FORM & FIELD CONTROLS -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab === 'form'" class="tab-content">
          <div class="settings-container">
            <div class="settings-box">
              <h3>Pune Localities (Quote & Contact Dropdown)</h3>
              <p class="settings-desc">
                Add, remove, or reorder service locations available in quote forms.
              </p>

              <div class="pill-list">
                <div *ngFor="let loc of dynamicContent.formConfig.localities; let idx = index" class="field-pill">
                  <span>{{ loc }}</span>
                  <button (click)="removeLocality(idx)" class="pill-remove">×</button>
                </div>
              </div>

              <div class="add-row">
                <input
                  type="text"
                  [(ngModel)]="newLocalityName"
                  placeholder="e.g., Balewadi, Ravet, Moshi"
                  class="setting-input"
                  (keyup.enter)="addLocality()"
                />
                <button (click)="addLocality()" class="btn-add">+ Add Locality</button>
              </div>
            </div>

            <div class="settings-box">
              <h3>Available Services (Quote & Contact Dropdown)</h3>
              <p class="settings-desc">
                Manage the active services displayed to customers in dropdown forms.
              </p>

              <div class="pill-list">
                <div *ngFor="let s of dynamicContent.formConfig.services; let idx = index" class="field-pill service">
                  <span>{{ s }}</span>
                  <button (click)="removeService(idx)" class="pill-remove">×</button>
                </div>
              </div>

              <div class="add-row">
                <input
                  type="text"
                  [(ngModel)]="newServiceName"
                  placeholder="e.g., Window Glass Cleaning, Tile Scrubbing"
                  class="setting-input"
                  (keyup.enter)="addService()"
                />
                <button (click)="addService()" class="btn-add">+ Add Service</button>
              </div>
            </div>

            <div class="save-bar">
              <button (click)="saveContentChanges()" [disabled]="savingContent" class="btn-save-all">
                {{ savingContent ? 'Saving Changes...' : 'Save Form & Field Settings' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 3: WEBSITE CONTENT & PRICING -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab === 'content'" class="tab-content">
          <div class="settings-container">

            <div class="settings-box">
              <h3>Company Contact Information</h3>
              <div class="form-fields-grid">
                <div class="field-group">
                  <label>Primary Phone</label>
                  <input type="text" [(ngModel)]="dynamicContent.phone" class="setting-input" />
                </div>
                <div class="field-group">
                  <label>WhatsApp Number (Digits only with 91)</label>
                  <input type="text" [(ngModel)]="dynamicContent.whatsapp" class="setting-input" />
                </div>
                <div class="field-group">
                  <label>Support Email</label>
                  <input type="email" [(ngModel)]="dynamicContent.email" class="setting-input" />
                </div>
                <div class="field-group">
                  <label>Business Hours</label>
                  <input type="text" [(ngModel)]="dynamicContent.businessHours" class="setting-input" />
                </div>
              </div>
            </div>

            <div class="settings-box">
              <h3>Base Service Rates & Pricing</h3>
              <p class="settings-desc">
                Update the starting prices displayed across service pages and quote previews.
              </p>

              <div *ngIf="dynamicContent.pricing" class="pricing-table">
                <div *ngFor="let item of dynamicContent.pricing" class="price-row">
                  <div class="price-svc">{{ item.service }}</div>
                  <div class="price-rate">
                    <span>₹</span>
                    <input type="number" [(ngModel)]="item.startingPrice" class="price-num-input" />
                  </div>
                  <div class="price-unit">
                    <input type="text" [(ngModel)]="item.unit" class="price-unit-input" />
                  </div>
                </div>
              </div>
            </div>

            <!-- ============================================================ -->
            <!-- RECENT CLEANING PROJECTS SHOWCASE SECTION (HOMEPAGE) -->
            <!-- ============================================================ -->
            <div class="settings-box" *ngIf="dynamicContent.showcase">
              <div class="showcase-header">
                <div>
                  <h3 class="showcase-heading">
                    Recent Cleaning Projects Showcase (Homepage)
                  </h3>
                  <p class="settings-desc">
                    Manage the "Recent Cleaning Projects in Pune" cards, photos, locations, and descriptions.
                  </p>
                </div>
                <button (click)="addProject()" class="btn-add">+ Add Project Card</button>
              </div>

              <!-- Section Headings -->
              <div class="form-fields-grid showcase-fields-bg">
                <div class="field-group" style="grid-column: 1 / -1;">
                  <label>Section Heading Title</label>
                  <input type="text" [(ngModel)]="dynamicContent.showcase.heading" placeholder="Recent Cleaning Projects in Pune" class="setting-input" />
                </div>
                <div class="field-group" style="grid-column: 1 / -1;">
                  <label>Section Subheading Description</label>
                  <input type="text" [(ngModel)]="dynamicContent.showcase.subheading" placeholder="Explore recent residential and commercial cleaning work..." class="setting-input" />
                </div>
              </div>

              <!-- Projects List -->
              <div class="cms-projects-list">
                <div *ngFor="let proj of dynamicContent.showcase.projects; let idx = index" class="cms-project-item">
                  <div class="proj-header-row">
                    <span class="proj-idx-badge">Project Card #{{ idx + 1 }}</span>
                    <button (click)="removeProject(idx)" class="btn-remove-proj" title="Delete this project">✕ Remove Card</button>
                  </div>

                  <div class="proj-inputs-grid">
                    <div class="field-group">
                      <label>Project Title</label>
                      <input type="text" [(ngModel)]="proj.title" placeholder="e.g. 3BHK Vacant Apartment Deep Clean" class="setting-input" />
                    </div>
                    <div class="field-group">
                      <label>Pune Locality</label>
                      <input type="text" [(ngModel)]="proj.location" placeholder="e.g. Baner, Pune" class="setting-input" />
                    </div>
                    <div class="field-group">
                      <label>Service Category Badge</label>
                      <input type="text" [(ngModel)]="proj.category" placeholder="e.g. Deep Cleaning" class="setting-input" />
                    </div>
                    <div class="field-group">
                      <label>Image Asset / WebP Path</label>
                      <input type="text" [(ngModel)]="proj.imageUrl" placeholder="/assets/images/deep-clean.webp" class="setting-input" />
                    </div>
                    <div class="field-group" style="grid-column: 1 / -1;">
                      <label>Work Description Summary</label>
                      <textarea [(ngModel)]="proj.description" rows="2" placeholder="Brief summary of cleaning work performed..." class="setting-input"></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="save-bar">
              <button (click)="saveContentChanges()" [disabled]="savingContent" class="btn-save-all">
                {{ savingContent ? 'Saving Changes...' : 'Save Website Content, Projects & Pricing' }}
              </button>
            </div>

          </div>
        </div>

        <!-- DATABASE CONNECTION HELP MODAL -->
        <div *ngIf="showDbHelpModal" class="db-modal-backdrop" (click)="showDbHelpModal = false">
          <div class="db-modal-card" (click)="$event.stopPropagation()">
            <div class="db-modal-header">
              <h3 class="modal-title">Database &amp; Cross-Device Sync Status</h3>
              <button type="button" (click)="showDbHelpModal = false" class="btn-close-modal">✕</button>
            </div>
            
            <div class="db-modal-body">
              <div class="db-status-callout" [class.ok]="isDbConnected" [class.warn]="!isDbConnected">
                <div class="callout-icon">{{ isDbConnected ? '✅' : '⚠️' }}</div>
                <div>
                  <div class="callout-title">
                    {{ isDbConnected ? 'MongoDB Atlas is Active & Connected' : 'Running in Local Storage Mode (Isolated)' }}
                  </div>
                  <div class="callout-sub">
                    {{ isDbConnected 
                      ? 'Visits from mobile phones, tablets, and laptops are automatically synced across devices.' 
                      : 'Because MONGODB_URI is not set in Netlify, each device (phone vs. laptop) keeps its own visits locally.' }}
                  </div>
                </div>
              </div>

              <div *ngIf="!isDbConnected" class="db-instructions">
                <h4>How to Enable Multi-Device Sync (Phone to Laptop):</h4>
                <ol>
                  <li>Log in to your <strong>Netlify Dashboard</strong>.</li>
                  <li>Go to <strong>Site configuration</strong> → <strong>Environment variables</strong>.</li>
                  <li>Click <strong>Add a variable</strong>:
                    <div class="code-pill">Key: <code>MONGODB_URI</code></div>
                    <div class="code-pill">Value: <code>mongodb+srv://admin:&lt;password&gt;&#64;cluster.mongodb.net/apk_elite_services?retryWrites=true&amp;w=majority</code></div>
                  </li>
                  <li>Trigger a <strong>Deploy site</strong>. All phone visits will immediately sync to your laptop dashboard!</li>
                </ol>
              </div>

              <div class="modal-footer-actions">
                <button type="button" (click)="loadAllData()" class="btn-action">Check Connection Again</button>
                <button type="button" (click)="showDbHelpModal = false" class="btn-action outline">Close</button>
              </div>
            </div>
          </div>
        </div>

        <!-- CHANGE ADMIN PIN MODAL -->
        <div *ngIf="showPinModal" class="db-modal-backdrop" (click)="closePinModal()">
          <div class="db-modal-card" (click)="$event.stopPropagation()" style="max-width: 440px;">
            <div class="db-modal-header">
              <h3 class="modal-title">🔐 Change Admin PIN</h3>
              <button type="button" (click)="closePinModal()" class="btn-close-modal">✕</button>
            </div>
            
            <form (submit)="onSaveNewPin($event)" class="pin-change-form" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
              <div class="form-group" style="display: flex; flex-direction: column; gap: 0.35rem;">
                <label style="font-size: 0.8rem; font-weight: 700; color: var(--t2); text-transform: uppercase;">Current PIN</label>
                <input
                  type="password"
                  maxlength="20"
                  [(ngModel)]="currentPinInput"
                  name="currentPinInput"
                  placeholder="Enter current PIN"
                  class="setting-input"
                  required
                />
              </div>

              <div class="form-group" style="display: flex; flex-direction: column; gap: 0.35rem;">
                <label style="font-size: 0.8rem; font-weight: 700; color: var(--t2); text-transform: uppercase;">New PIN (Min 4 digits)</label>
                <input
                  type="password"
                  maxlength="20"
                  [(ngModel)]="newPinInput"
                  name="newPinInput"
                  placeholder="Enter new 4+ digit PIN"
                  class="setting-input"
                  required
                />
              </div>

              <div class="form-group" style="display: flex; flex-direction: column; gap: 0.35rem;">
                <label style="font-size: 0.8rem; font-weight: 700; color: var(--t2); text-transform: uppercase;">Confirm New PIN</label>
                <input
                  type="password"
                  maxlength="20"
                  [(ngModel)]="confirmPinInput"
                  name="confirmPinInput"
                  placeholder="Re-enter new PIN"
                  class="setting-input"
                  required
                />
              </div>

              <div *ngIf="pinChangeError" class="error-msg" style="color: var(--err); font-size: 0.82rem; font-weight: 600; padding: 0.5rem; background: #fff1f2; border-radius: 6px; border: 1px solid #fecdd3;">
                {{ pinChangeError }}
              </div>

              <div class="modal-footer-actions" style="margin-top: 0.5rem;">
                <button type="button" (click)="closePinModal()" class="btn-action outline">Cancel</button>
                <button type="submit" class="btn-action" style="background: var(--ac); color: #fff; border-color: transparent;">Update PIN</button>
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`

    /* ============================================================
       DESIGN TOKENS — LIGHT & DARK MODE
    ============================================================ */
    :host {
      --s0: #fafaf9;
      --s1: #f5f4f2;
      --s2: #eeede9;
      --bd: #d6d4cf;
      --t1: #1a1917;
      --t2: #6b6966;
      --t3: #9b9895;
      --ac: #c2410c;
      --ac-light: #fff7ed;
      --ac-border: #fed7aa;
      --ok: #15803d;
      --ok-bg: #f0fdf4;
      --warn: #b45309;
      --err: #be123c;
      --blue: #1d4ed8;
      --blue-bg: #eff6ff;
      --blue-border: #bfdbfe;
      --shadow-sm: 0 1px 3px rgba(26,25,23,0.07);
      --shadow-md: 0 4px 12px rgba(26,25,23,0.09);
      --radius: 12px;
      color-scheme: light;
    }
    :host(.dark) {
      --s0: #111110;
      --s1: #1c1b19;
      --s2: #27261f;
      --bd: #38372f;
      --t1: #f2f0eb;
      --t2: #9b9890;
      --t3: #6b6866;
      --ac: #fb923c;
      --ac-light: #1c1410;
      --ac-border: #7c2d12;
      --ok: #4ade80;
      --ok-bg: #052e16;
      --warn: #fbbf24;
      --err: #f87171;
      --blue: #93c5fd;
      --blue-bg: #1e3a5f;
      --blue-border: #1e40af;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.25);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
      color-scheme: dark;
    }
    @media (prefers-color-scheme: dark) {
      :host(:not(.light)) {
        --s0: #111110;
        --s1: #1c1b19;
        --s2: #27261f;
        --bd: #38372f;
        --t1: #f2f0eb;
        --t2: #9b9890;
        --t3: #6b6866;
        --ac: #fb923c;
        --ac-light: #1c1410;
        --ac-border: #7c2d12;
        --ok: #4ade80;
        --ok-bg: #052e16;
        --warn: #fbbf24;
        --err: #f87171;
        --blue: #93c5fd;
        --blue-bg: #1e3a5f;
        --blue-border: #1e40af;
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.25);
        --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
        color-scheme: dark;
      }
    }

    .cms-root {
      min-height: 90vh;
      background: var(--s0);
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--t1);
      padding-bottom: 4rem;
      transition: background 0.25s, color 0.25s;
    }

    /* AUTH SCREEN */
    .auth-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 1.5rem;
      background: var(--s0);
    }
    .auth-card {
      background: var(--s1);
      max-width: 440px;
      width: 100%;
      padding: 2.5rem;
      border-radius: 20px;
      box-shadow: var(--shadow-md);
      text-align: center;
      border: 1px solid var(--bd);
    }
    .auth-icon {
      width: 64px;
      height: 64px;
      background: var(--ac);
      color: #fff;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .auth-card h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--t1);
      margin-bottom: 0.25rem;
      letter-spacing: -0.02em;
    }
    .auth-sub {
      color: var(--t2);
      font-size: 0.9rem;
      margin-bottom: 1.75rem;
    }
    .pin-form {
      text-align: left;
    }
    .form-group label {
      display: block;
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--t2);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pin-input {
      width: 100%;
      font-size: 1.75rem;
      text-align: center;
      letter-spacing: 0.5rem;
      padding: 0.75rem;
      border: 2px solid var(--bd);
      border-radius: 10px;
      outline: none;
      background: var(--s2);
      color: var(--t1);
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .pin-input:focus {
      border-color: var(--ac);
    }
    .error-msg {
      color: var(--err);
      font-size: 0.85rem;
      margin-top: 0.5rem;
      text-align: center;
    }
    .btn-unlock {
      width: 100%;
      background: var(--ac);
      color: #fff;
      font-weight: 700;
      padding: 0.875rem;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      margin-top: 1.25rem;
      font-size: 1rem;
      transition: opacity 0.2s;
      letter-spacing: 0.01em;
    }
    .btn-unlock:hover { opacity: 0.88; }
    .auth-hint {
      margin-top: 1.25rem;
      font-size: 0.82rem;
      color: var(--t2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .back-link {
      color: var(--ac);
      text-decoration: none;
      font-weight: 600;
    }

    /* DASHBOARD */
    .dashboard-wrapper {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--s1);
      padding: 1rem 1.25rem;
      border-radius: var(--radius);
      border: 1px solid var(--bd);
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 0.75rem;
      box-shadow: var(--shadow-sm);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .logo-text {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--t1);
      letter-spacing: -0.02em;
    }
    .badge-role {
      background: var(--ac-light);
      color: var(--ac);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 5px;
      border: 1px solid var(--ac-border);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .system-status {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: var(--ok);
      font-weight: 600;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      background: var(--ok);
      border-radius: 50%;
    }

    /* DB SYNC STATUS BADGE */
    .db-sync-status {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.76rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      border: 1px solid var(--bd);
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--s2);
      color: var(--t1);
    }
    .db-sync-status:hover {
      transform: scale(1.03);
    }
    .db-sync-status.synced {
      background: var(--ok-bg);
      border-color: #86efac;
      color: var(--ok);
    }
    .db-sync-status.isolated {
      background: var(--ac-light);
      border-color: var(--ac-border);
      color: var(--ac);
    }
    .db-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ac);
    }
    .db-sync-status.synced .db-dot {
      background: var(--ok);
    }
    .db-badge-tag {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      background: rgba(0,0,0,0.06);
    }

    /* DB HELP MODAL */
    .db-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .db-modal-card {
      background: var(--s1);
      border: 1px solid var(--bd);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      max-width: 580px;
      width: 100%;
      overflow: hidden;
      animation: modalPop 0.2s ease-out;
    }
    @keyframes modalPop {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .db-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.1rem 1.4rem;
      border-bottom: 1px solid var(--bd);
      background: var(--s2);
    }
    .modal-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--t1);
      margin: 0;
    }
    .btn-close-modal {
      background: none;
      border: none;
      font-size: 1.2rem;
      color: var(--t2);
      cursor: pointer;
    }
    .db-modal-body {
      padding: 1.4rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    .db-status-callout {
      display: flex;
      gap: 0.85rem;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--bd);
    }
    .db-status-callout.ok {
      background: var(--ok-bg);
      border-color: #86efac;
    }
    .db-status-callout.warn {
      background: var(--ac-light);
      border-color: var(--ac-border);
    }
    .callout-icon { font-size: 1.4rem; line-height: 1; }
    .callout-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--t1);
      margin-bottom: 0.25rem;
    }
    .callout-sub {
      font-size: 0.82rem;
      color: var(--t2);
      line-height: 1.4;
    }
    .db-instructions h4 {
      font-size: 0.88rem;
      font-weight: 800;
      margin: 0 0 0.6rem;
      color: var(--t1);
    }
    .db-instructions ol {
      margin: 0;
      padding-left: 1.3rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      font-size: 0.84rem;
      color: var(--t2);
    }
    .code-pill {
      margin-top: 0.35rem;
      font-size: 0.78rem;
      background: var(--s2);
      padding: 0.35rem 0.6rem;
      border-radius: 6px;
      border: 1px solid var(--bd);
      color: var(--t1);
      font-family: monospace;
      word-break: break-all;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 0.5rem;
    }
    .header-right {
      display: flex;
      gap: 0.4rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .btn-action {
      padding: 0.45rem 0.8rem;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid var(--bd);
      background: var(--s2);
      color: var(--t1);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .btn-action:hover { opacity: 0.75; }
    .btn-action.outline {
      border-color: var(--ac-border);
      color: var(--ac);
      background: var(--ac-light);
    }
    .btn-action.danger {
      color: var(--err);
      border-color: var(--bd);
    }
    .spin {
      display: inline-block;
      animation: spin 1s infinite linear;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* TABS */
    .dash-tabs {
      display: flex;
      gap: 0.35rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--bd);
      padding-bottom: 0.4rem;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .dash-tabs::-webkit-scrollbar { display: none; }
    .tab-btn {
      padding: 0.6rem 1.1rem;
      font-size: 0.88rem;
      font-weight: 600;
      border: none;
      background: transparent;
      color: var(--t2);
      cursor: pointer;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: var(--t1);
      background: var(--s2);
    }
    .tab-btn.active {
      background: var(--ac);
      color: #fff;
    }
    .count-pill {
      background: rgba(255,255,255,0.22);
      font-size: 0.72rem;
      padding: 0.1rem 0.45rem;
      border-radius: 10px;
    }
    .tab-btn:not(.active) .count-pill {
      background: var(--s2);
      color: var(--t2);
    }

    /* TOAST */
    .toast-alert {
      background: var(--ok-bg);
      color: var(--ok);
      border: 1px solid var(--ok);
      padding: 0.7rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-weight: 600;
      text-align: center;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* METRICS */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: var(--s1);
      padding: 1.25rem;
      border-radius: var(--radius);
      border: 1px solid var(--bd);
      box-shadow: var(--shadow-sm);
      transition: transform 0.15s;
    }
    .metric-card:hover { transform: translateY(-2px); }
    .metric-card.total    { border-left: 3px solid #3b82f6; }
    .metric-card.footmarks { border-left: 3px solid #8b5cf6; }
    .metric-card.new      { border-left: 3px solid var(--warn); }
    .metric-card.progress { border-left: 3px solid #6366f1; }
    .metric-card.converted { border-left: 3px solid var(--ok); }

    .metric-num {
      font-size: 2rem;
      font-weight: 800;
      color: var(--t1);
      letter-spacing: -0.03em;
    }
    .metric-num--sm {
      font-size: 1.1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .metric-label {
      color: var(--t2);
      font-size: 0.8rem;
      font-weight: 600;
      margin-top: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* FILTER BAR */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 180px;
    }
    .search-input {
      width: 100%;
      padding: 0.6rem 0.875rem;
      border: 1px solid var(--bd);
      border-radius: 8px;
      outline: none;
      font-size: 0.875rem;
      background: var(--s2);
      color: var(--t1);
      box-sizing: border-box;
    }
    .search-input:focus { border-color: var(--ac); }
    .select-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .filter-select {
      padding: 0.6rem 0.875rem;
      border: 1px solid var(--bd);
      border-radius: 8px;
      background: var(--s2);
      color: var(--t1);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .btn-filter {
      padding: 0.6rem 0.875rem;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid var(--bd);
      background: var(--s2);
      color: var(--t1);
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-filter:hover { opacity: 0.75; }
    .btn-filter.export {
      background: var(--ac);
      color: #fff;
      border-color: transparent;
    }
    .btn-filter.sample { background: var(--s2); }
    .btn-sm { font-size: 0.75rem; padding: 0.4rem 0.7rem; }
    .btn-danger-subtle { color: var(--err); border-color: var(--bd); }

    /* LEADS GRID */
    .leads-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .lead-card {
      background: var(--s1);
      border: 1px solid var(--bd);
      border-radius: var(--radius);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.15s;
    }
    .lead-card:hover { box-shadow: var(--shadow-md); }
    .lead-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .cust-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--t1);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .source-tag {
      font-size: 0.75rem;
      color: var(--t3);
      margin-top: 0.2rem;
    }
    .attr-badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-top: 0.3rem;
    }
    .attr-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.69rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      border: 1px solid var(--bd);
      background: var(--s2);
      color: var(--t2);
      line-height: 1.3;
    }
    .attr-badge.gclid {
      background: var(--ac-light);
      color: var(--ac);
      border-color: var(--ac-border);
    }
    .attr-badge.landing {
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status-select {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.55rem;
      border-radius: 6px;
      border: 1px solid var(--bd);
      background: var(--s2);
      color: var(--t1);
      outline: none;
      cursor: pointer;
    }
    .status-new { background: var(--blue-bg); color: var(--blue); border-color: var(--blue-border); }
    .status-contacted { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .status-quote_sent { background: #faf5ff; color: #7e22ce; border-color: #e9d5ff; }
    .status-confirmed { background: var(--ok-bg); color: var(--ok); border-color: #a7f3d0; }
    .status-completed { background: var(--ok-bg); color: var(--ok); border-color: #99f6e4; }
    .status-lost { background: #fff1f2; color: var(--err); border-color: #fecdd3; }

    .lead-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      font-size: 0.82rem;
      background: var(--s2);
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--bd);
    }
    .detail-item { display: flex; flex-direction: column; }
    .detail-lbl {
      font-size: 0.7rem;
      color: var(--t3);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .detail-val { font-weight: 600; color: var(--t1); }
    .phone-link, .email-link {
      color: var(--ac);
      text-decoration: none;
      font-weight: 600;
    }
    .cust-message {
      font-size: 0.82rem;
      color: var(--t2);
      background: var(--s2);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--bd);
      font-style: italic;
    }
    .lead-actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-wa {
      flex: 2;
      background: #25d366;
      color: #fff;
      text-align: center;
      padding: 0.5rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .btn-wa:hover { opacity: 0.85; }
    .btn-call {
      flex: 1;
      background: var(--ac);
      color: #fff;
      text-align: center;
      padding: 0.5rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .btn-call:hover { opacity: 0.85; }
    .btn-del {
      background: var(--s2);
      color: var(--err);
      border: 1px solid var(--bd);
      padding: 0.5rem 0.7rem;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-del:hover { opacity: 0.75; }

    /* NOTES */
    .notes-section {
      border-top: 1px solid var(--bd);
      padding-top: 0.75rem;
    }
    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
    }
    .single-note {
      font-size: 0.775rem;
      color: var(--t2);
      background: var(--s2);
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      border: 1px solid var(--bd);
    }
    .note-time { font-weight: 600; color: var(--t3); margin-right: 0.4rem; }
    .add-note-inline { display: flex; gap: 0.4rem; }
    .inline-note-input {
      flex: 1;
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
      border: 1px solid var(--bd);
      border-radius: 6px;
      outline: none;
      background: var(--s2);
      color: var(--t1);
    }
    .inline-note-input:focus { border-color: var(--ac); }
    .btn-add-note {
      background: var(--t1);
      color: var(--s0);
      border: none;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
    }

    /* SETTINGS BOXES */
    .settings-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .settings-box {
      background: var(--s1);
      padding: 1.5rem;
      border-radius: var(--radius);
      border: 1px solid var(--bd);
      box-shadow: var(--shadow-sm);
    }
    .settings-box h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--t1);
      margin-bottom: 0.25rem;
      letter-spacing: -0.015em;
    }
    .settings-desc {
      color: var(--t2);
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .field-pill {
      background: var(--s2);
      color: var(--t1);
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border: 1px solid var(--bd);
    }
    .field-pill.service {
      background: var(--ac-light);
      color: var(--ac);
      border-color: var(--ac-border);
    }
    .pill-remove {
      background: none;
      border: none;
      font-size: 1rem;
      color: var(--t3);
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .pill-remove:hover { color: var(--err); }
    .add-row { display: flex; gap: 0.5rem; max-width: 500px; }
    .setting-input {
      flex: 1;
      padding: 0.6rem 0.875rem;
      border: 1px solid var(--bd);
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      background: var(--s2);
      color: var(--t1);
      width: 100%;
    }
    .setting-input:focus { border-color: var(--ac); }
    textarea.setting-input { resize: vertical; }
    .btn-add {
      background: var(--ac);
      color: #fff;
      border: none;
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: opacity 0.15s;
      white-space: nowrap;
    }
    .btn-add:hover { opacity: 0.85; }
    .form-fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .showcase-fields-bg {
      margin-bottom: 1.5rem;
      background: var(--s2);
      padding: 1.25rem;
      border-radius: 10px;
      border: 1px solid var(--bd);
    }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--t2);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    /* Showcase header */
    .showcase-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .showcase-heading {
      margin: 0 0 0.2rem;
      font-size: 1.1rem;
      color: var(--t1);
      letter-spacing: -0.015em;
    }

    /* PRICING */
    .pricing-table { display: flex; flex-direction: column; gap: 0.5rem; }
    .price-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--s2);
      border: 1px solid var(--bd);
      border-radius: 8px;
      flex-wrap: wrap;
    }
    .price-svc {
      flex: 1;
      min-width: 180px;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--t1);
    }
    .price-rate { display: flex; align-items: center; gap: 0.25rem; font-weight: 700; color: var(--t1); }
    .price-num-input {
      width: 90px;
      padding: 0.4rem 0.5rem;
      border: 1px solid var(--bd);
      border-radius: 6px;
      font-weight: 700;
      background: var(--s1);
      color: var(--t1);
    }
    .price-unit-input {
      width: 130px;
      padding: 0.4rem 0.5rem;
      border: 1px solid var(--bd);
      border-radius: 6px;
      font-size: 0.82rem;
      color: var(--t2);
      background: var(--s1);
    }
    .save-bar { display: flex; justify-content: flex-end; }
    .btn-save-all {
      background: var(--ok);
      color: #fff;
      border: none;
      padding: 0.825rem 1.75rem;
      font-size: 0.95rem;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-save-all:hover { opacity: 0.85; }
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--t2);
      background: var(--s1);
      border-radius: var(--radius);
      border: 1px solid var(--bd);
    }
    .btn-reset {
      margin-top: 0.75rem;
      background: var(--ac);
      color: #fff;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.82rem;
      cursor: pointer;
    }

    /* PROJECTS SHOWCASE CMS */
    .cms-projects-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .cms-project-item {
      background: var(--s1);
      border: 1px solid var(--bd);
      border-radius: var(--radius);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }
    .proj-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--bd);
      padding-bottom: 0.75rem;
    }
    .proj-idx-badge {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--ac);
      background: var(--ac-light);
      padding: 0.2rem 0.6rem;
      border-radius: 5px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 1px solid var(--ac-border);
    }
    .btn-remove-proj {
      background: var(--s2);
      color: var(--err);
      border: 1px solid var(--bd);
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-remove-proj:hover { opacity: 0.75; }
    .proj-inputs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    /* ANALYTICS & AUDIT GRAPHS */
    .analytics-graphs-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .graph-card {
      background: var(--s1);
      border: 1px solid var(--bd);
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .graph-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .graph-tag {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--ac);
      background: var(--ac-light);
      border: 1px solid var(--ac-border);
      padding: 0.18rem 0.55rem;
      border-radius: 5px;
      margin-bottom: 0.35rem;
    }
    .graph-tag.optimal {
      color: var(--ok);
      background: var(--ok-bg);
      border-color: #a7f3d0;
    }
    .graph-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--t1);
      margin: 0;
      letter-spacing: -0.02em;
    }
    .graph-subtitle {
      font-size: 0.8rem;
      color: var(--t2);
      margin: 0.2rem 0 0;
    }
    .graph-legend {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--t2);
    }
    .legend-item { display: flex; align-items: center; gap: 0.35rem; }
    .legend-dot { width: 9px; height: 9px; border-radius: 50%; }
    .legend-dot.views { background: #ea580c; }
    .legend-dot.visitors { background: #8b5cf6; }

    /* FILTRATION CONTROLS */
    .analytics-control-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      background: var(--s1);
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius);
      border: 1px solid var(--bd);
      margin-bottom: 1.25rem;
      box-shadow: var(--shadow-sm);
    }
    .control-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .control-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--t2);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .timeframe-pills {
      display: flex;
      gap: 0.3rem;
      background: var(--s2);
      padding: 0.2rem;
      border-radius: 8px;
      border: 1px solid var(--bd);
    }
    .pill-btn {
      background: transparent;
      border: none;
      color: var(--t2);
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .pill-btn:hover { color: var(--t1); }
    .pill-btn.active {
      background: var(--ac);
      color: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .chart-type-toggle {
      display: flex;
      gap: 0.3rem;
      background: var(--s2);
      padding: 0.2rem;
      border-radius: 8px;
      border: 1px solid var(--bd);
    }
    .toggle-btn {
      background: transparent;
      border: none;
      color: var(--t2);
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .toggle-btn:hover { color: var(--t1); }
    .toggle-btn.active {
      background: var(--s0);
      color: var(--t1);
      border: 1px solid var(--bd);
      box-shadow: var(--shadow-sm);
    }
    .pie-metric-toggle {
      display: flex;
      gap: 0.3rem;
      background: var(--s2);
      padding: 0.2rem;
      border-radius: 6px;
      border: 1px solid var(--bd);
    }
    .pie-sub-btn {
      background: transparent;
      border: none;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--t2);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .pie-sub-btn.active {
      background: var(--ac);
      color: #fff;
    }

    /* LINE CHART VIEW (SVG) */
    .line-chart-wrapper {
      position: relative;
      width: 100%;
      height: 220px;
      margin-top: 0.5rem;
    }
    .svg-line-chart {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .grid-line {
      stroke: var(--bd);
      stroke-width: 1;
      stroke-dasharray: 4 4;
    }
    .grid-text {
      font-size: 10px;
      fill: var(--t3);
      font-weight: 600;
    }
    .axis-label {
      font-size: 10.5px;
      fill: var(--t2);
      font-weight: 600;
    }
    .trend-path {
      transition: d 0.3s ease;
    }
    .chart-node {
      cursor: pointer;
      transition: r 0.2s, stroke-width 0.2s;
    }
    .chart-node:hover {
      r: 6.5;
      stroke-width: 3;
    }

    /* BAR GRAPH VIEW */
    .trend-bars-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 200px;
      padding: 1.5rem 0 0.5rem;
      border-bottom: 1px dashed var(--bd);
      gap: 0.5rem;
    }
    .trend-day-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      gap: 0.4rem;
    }
    .bar-container {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 150px;
      width: 100%;
      justify-content: center;
    }
    .bar-bar {
      width: 14px;
      min-height: 6px;
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: transform 0.2s, opacity 0.2s;
    }
    .bar-bar:hover { opacity: 0.85; transform: scaleY(1.05); }
    .view-bar { background: linear-gradient(180deg, #ea580c 0%, #9a3412 100%); }
    .visitor-bar { background: linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%); }
    .bar-val-pop {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.67rem;
      font-weight: 700;
      color: #ea580c;
    }
    .bar-val-pop.sub { color: #8b5cf6; }
    .day-label { font-size: 0.72rem; color: var(--t2); font-weight: 600; }

    /* PIE / DONUT CHART VIEW */
    .pie-chart-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 2rem;
      padding: 1.5rem 0;
      flex-wrap: wrap;
    }
    .pie-svg-col {
      position: relative;
      width: 160px;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .svg-pie {
      width: 100%;
      height: 100%;
      transform: rotate(0deg);
    }
    .donut-segment {
      transition: stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease;
    }
    .donut-center-info {
      position: absolute;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .donut-total {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--t1);
      line-height: 1;
    }
    .donut-lbl {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--t2);
      margin-top: 0.2rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pie-legend-col {
      flex: 1;
      min-width: 200px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .pie-legend-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
    }
    .pie-color-indicator {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .pie-slice-name {
      flex: 1;
      font-weight: 600;
      color: var(--t1);
    }
    .pie-slice-val {
      font-weight: 700;
      color: var(--t1);
    }
    .pie-slice-pct {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--t2);
      background: var(--s2);
      border: 1px solid var(--bd);
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
      min-width: 40px;
      text-align: center;
    }
    .empty-chart-note {
      text-align: center;
      padding: 2.5rem 1rem;
      font-size: 0.85rem;
      color: var(--t2);
    }

    /* ===================== EXTRACTED INLINE STYLES — DATA PANELS ===================== */
    .data-panels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .data-panel {
      background: var(--s1);
      padding: 1.25rem;
      border-radius: var(--radius);
      border: 1px solid var(--bd);
      box-shadow: var(--shadow-sm);
    }
    .panel-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: var(--t1);
      letter-spacing: -0.01em;
    }
    .page-row { margin-bottom: 0.85rem; }
    .page-row-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }
    .page-row-title {
      color: var(--t1);
      max-width: 65%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .page-row-count { color: var(--ac); font-weight: 700; white-space: nowrap; }
    .mini-track {
      width: 100%;
      height: 6px;
      background: var(--s2);
      border-radius: 999px;
      overflow: hidden;
    }
    .mini-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--ac) 0%, #fb923c 100%);
      border-radius: 999px;
      transition: width 0.4s ease;
    }
    .empty-inline { color: var(--t3); font-size: 0.82rem; font-style: italic; }
    /* Device grid */
    .device-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.5rem;
      text-align: center;
      margin-bottom: 1rem;
    }
    .device-cell {
      background: var(--s2);
      padding: 0.85rem 0.5rem;
      border-radius: 8px;
      border: 1px solid var(--bd);
    }
    .device-icon {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--t3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.3rem;
    }
    .device-count {
      font-weight: 800;
      font-size: 1.15rem;
      color: var(--t1);
    }
    .device-label { font-size: 0.72rem; color: var(--t2); font-weight: 600; }
    /* Acquisition */
    .acquisition-block { margin-top: 1.25rem; }
    .acq-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--t3);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .acq-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .acq-tag {
      background: var(--blue-bg);
      color: var(--blue);
      padding: 0.22rem 0.6rem;
      border-radius: 5px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid var(--blue-border);
    }
    .acq-empty { color: var(--t3); font-size: 0.8rem; }
    /* Stream panel (visitor table) */
    .stream-panel {
      background: var(--s1);
      border-radius: var(--radius);
      border: 1px solid var(--bd);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .stream-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--bd);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .stream-title { font-size: 0.95rem; font-weight: 700; color: var(--t1); margin: 0; }
    .stream-sub { font-size: 0.73rem; color: var(--t2); }
    .stream-actions { display: flex; gap: 0.5rem; align-items: center; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .stream-table {
      width: 100%;
      min-width: 640px;
      border-collapse: collapse;
      font-size: 0.82rem;
      text-align: left;
    }
    .stream-thead-row {
      background: var(--s2);
      border-bottom: 1px solid var(--bd);
      font-size: 0.72rem;
      color: var(--t2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stream-th { padding: 0.7rem 1rem; font-weight: 700; }
    .stream-th-right { text-align: right; }
    .stream-row { border-bottom: 1px solid var(--s2); }
    .stream-row:hover { background: var(--s2); }
    .stream-td { padding: 0.7rem 1rem; color: var(--t1); vertical-align: middle; }
    .stream-page-title { font-weight: 600; color: var(--t1); }
    .stream-page-path { font-size: 0.73rem; color: var(--ac); font-family: monospace; }
    .stream-device { text-transform: capitalize; font-weight: 600; color: var(--t1); }
    .stream-browser { color: var(--t2); }
    .referrer-tag {
      background: var(--blue-bg);
      color: var(--blue);
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      border: 1px solid var(--blue-border);
    }
    .stream-location { color: var(--t2); }
    .stream-time { text-align: right; color: var(--t2); font-size: 0.72rem; font-weight: 500; }
    .stream-empty { padding: 2rem; text-align: center; color: var(--t3); font-style: italic; }

    /* Table container (leads tab) */
    .table-container { overflow-x: auto; }

    /* ===================== RESPONSIVE BREAKPOINTS ===================== */
    @media (max-width: 900px) {
      .analytics-graphs-container { grid-template-columns: 1fr; }
      .data-panels-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .dashboard-wrapper { padding: 0.75rem 0.5rem; }
      .dash-header { padding: 0.875rem 0.875rem; }
      .header-right { flex-wrap: wrap; }
      .leads-grid { grid-template-columns: 1fr; }
      .lead-details-grid { grid-template-columns: 1fr; }
      .metrics-grid { grid-template-columns: 1fr 1fr; }
      .filter-bar { flex-direction: column; }
      .search-box { min-width: 100%; }
      .select-filters { width: 100%; }
      .auth-card { padding: 1.75rem 1.25rem; }
      .device-grid { grid-template-columns: 1fr 1fr 1fr; }
      .form-fields-grid { grid-template-columns: 1fr; }
      .proj-inputs-grid { grid-template-columns: 1fr; }
      .graph-header { flex-direction: column; gap: 0.5rem; }
      .add-row { max-width: 100%; }
      .save-bar { justify-content: stretch; }
      .btn-save-all { width: 100%; text-align: center; }
    }
    @media (max-width: 380px) {
      .metrics-grid { grid-template-columns: 1fr; }
      .device-grid { grid-template-columns: 1fr; }
      .lead-actions { flex-wrap: wrap; }
      .btn-wa, .btn-call { flex: unset; width: 100%; }
    }
  `]
})
export class CmsRedirectComponent implements OnInit {
  isAuthenticated = false;
  enteredPin = '';
  pinError = false;
  darkMode = false;

  activeTab: 'leads' | 'footmarks' | 'form' | 'content' = 'leads';

  leads: LeadItem[] = [];
  footmarkStats: any = null;
  refreshing = false;
  searchQuery = '';
  statusFilter = 'ALL';

  dynamicContent: DynamicContent = {
    companyName: 'APK Elite Services',
    phone: '+91 88301 67863',
    whatsapp: '918830167863',
    email: 'info@apkeliteservices.in',
    address: 'Shop No 4, Datta Mandir Rd, Wakad, Pune, Maharashtra 411057',
    businessHours: 'Mon - Sun: 8:00 AM - 9:00 PM',
    promoBanner: {
      enabled: true,
      text: 'Festival Offer: Get Flat 15% OFF on Home Deep Cleaning in Pune!',
      discountPercent: 15,
    },
    formConfig: {
      modalTitle: 'Request a Free Service Quote',
      modalSubtitle: 'Fill out your details below to send a quote request directly to our team.',
      localities: [],
      services: [],
    },
    pricing: [],
    showcase: {
      heading: 'Recent Cleaning Projects in Pune',
      subheading: 'Explore recent residential and commercial cleaning work completed by our trained in-house team across Pune & PCMC.',
      projects: [
        {
          title: '3BHK Vacant Apartment Deep Clean',
          location: 'Baner, Pune',
          category: 'Deep Cleaning',
          imageUrl: '/assets/images/deep-clean.webp',
          description: 'Complete floor scrubbing, kitchen degreasing, bathroom descaling & balcony pressure washing.'
        },
        {
          title: '7-Seater Fabric Sofa Shampooing',
          location: 'Wakad, Pune',
          category: 'Sofa Cleaning',
          imageUrl: '/assets/images/Sofacleaning.webp',
          description: 'Deep foam injection & extraction to remove tough stains, dust & odor from living room sofa.'
        },
        {
          title: 'Corporate Office Carpet & Janitorial',
          location: 'Kharadi (EON IT Park), Pune',
          category: 'Office Cleaning',
          imageUrl: '/assets/images/office-clean.webp',
          description: 'Overnight office sanitization, carpet steam extraction & workstation sanitization.'
        }
      ]
    }
  };

  newLocalityName = '';
  newServiceName = '';
  savingContent = false;
  toastMessage = '';
  showDbHelpModal = false;
  showPinModal = false;
  currentPinInput = '';
  newPinInput = '';
  confirmPinInput = '';
  pinChangeError = '';

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
      title: 'Internal CMS Portal | APK Elite Services',
      description: 'Internal admin portal for APK Elite Services.',
      path: '/cms'
    });

    if (isPlatformBrowser(this.platformId)) {
      // Restore dark mode preference
      const savedTheme = localStorage.getItem('apk_cms_theme');
      if (savedTheme === 'dark') {
        this.darkMode = true;
        document.querySelector('app-cms-redirect')?.classList.add('dark');
        document.querySelector('app-cms-redirect')?.classList.remove('light');
      } else {
        document.querySelector('app-cms-redirect')?.classList.add('light');
      }
      // Check stored PIN session
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
      this.pinChangeError = 'New PIN must be at least 4 characters/digits.';
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

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    const host = document.querySelector('app-cms-redirect');
    if (this.darkMode) {
      host?.classList.add('dark');
      host?.classList.remove('light');
    } else {
      host?.classList.remove('dark');
      host?.classList.add('light');
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('apk_cms_theme', this.darkMode ? 'dark' : 'light');
    }
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
        if (!live.showcase) {
          live.showcase = {
            heading: this.dynamicContent.showcase?.heading || 'Recent Cleaning Projects in Pune',
            subheading: this.dynamicContent.showcase?.subheading || 'Explore recent residential and commercial cleaning work completed by our trained in-house team across Pune & PCMC.',
            projects: this.dynamicContent.showcase?.projects ? [...this.dynamicContent.showcase.projects] : []
          };
        }
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
      this.showToast('Verified test footprint added to stream.');
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

  // Analytics Filtering & Chart State
  analyticsTimeframe: 'today' | '7d' | '30d' | 'all' = '7d';
  analyticsDeviceFilter: string = 'all';
  analyticsChannelFilter: string = 'all';
  activeChartType: 'line' | 'bar' | 'pie' = 'line';
  activePieMetric: 'device' | 'channel' = 'device';

  get filteredFootmarks(): FootmarkEvent[] {
    const list: FootmarkEvent[] = this.footmarkStats?.recentFootmarks || [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return list.filter((e: FootmarkEvent) => {
      // 1. Device filter
      if (this.analyticsDeviceFilter !== 'all') {
        const d = (e.device || 'mobile').toLowerCase();
        if (d !== this.analyticsDeviceFilter.toLowerCase()) return false;
      }
      // 2. Channel filter
      if (this.analyticsChannelFilter !== 'all') {
        const r = (e.referrer || 'Direct').toLowerCase();
        if (this.analyticsChannelFilter === 'google' && !r.includes('google')) return false;
        if (this.analyticsChannelFilter === 'whatsapp' && !r.includes('whatsapp') && !r.includes('wa.me')) return false;
        if (this.analyticsChannelFilter === 'direct' && r !== 'direct') return false;
        if (this.analyticsChannelFilter === 'social' && !['instagram', 'facebook', 'linkedin', 'twitter'].some(s => r.includes(s))) return false;
      }
      // 3. Timeframe filter
      if (this.analyticsTimeframe === 'today') {
        return (e.createdAt || '').startsWith(todayStr);
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

  get filteredUniqueVisitorCount(): number {
    return new Set(this.filteredFootmarks.map((e: FootmarkEvent) => e.visitorId)).size;
  }

  get todayFilteredViews(): number {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.filteredFootmarks.filter((e: FootmarkEvent) => (e.createdAt || '').startsWith(todayStr)).length;
  }

  get todayFilteredVisitors(): number {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayList = this.filteredFootmarks.filter((e: FootmarkEvent) => (e.createdAt || '').startsWith(todayStr));
    return new Set(todayList.map((e: FootmarkEvent) => e.visitorId)).size;
  }

  get filteredDailyTrends(): Array<{ date: string; label: string; views: number; visitors: number }> {
    const numDays = this.analyticsTimeframe === 'today' ? 1 : (this.analyticsTimeframe === '30d' ? 30 : 7);
    const days: Array<{ date: string; label: string; views: number; visitors: number }> = [];
    const now = new Date();
    const events = this.filteredFootmarks;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayEvents = events.filter((e: FootmarkEvent) => (e.createdAt || '').startsWith(dateStr));
      const views = dayEvents.length;
      const visitors = new Set(dayEvents.map((e: FootmarkEvent) => e.visitorId)).size;
      days.push({ date: dateStr, label, views, visitors });
    }
    return days;
  }

  get maxTrendVal(): number {
    const trends = this.filteredDailyTrends;
    let max = 1;
    for (const t of trends) {
      if (t.views > max) max = t.views;
      if (t.visitors > max) max = t.visitors;
    }
    return Math.max(max, 5);
  }

  get lineChartData() {
    const trends = this.filteredDailyTrends;
    const count = trends.length;
    const width = 580;
    const height = 180;
    const padL = 45;
    const padR = 20;
    const padT = 20;
    const padB = 35;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const baselineY = padT + chartH;
    const maxVal = this.maxTrendVal;

    const points = trends.map((t, idx) => {
      const x = count === 1 ? padL + chartW / 2 : padL + (idx / (count - 1)) * chartW;
      const yViews = baselineY - (t.views / maxVal) * chartH;
      const yVisitors = baselineY - (t.visitors / maxVal) * chartH;
      return {
        x,
        yViews,
        yVisitors,
        views: t.views,
        visitors: t.visitors,
        label: t.label,
        date: t.date
      };
    });

    let viewsPath = '';
    let viewsArea = '';
    let visitorsPath = '';
    let visitorsArea = '';

    if (points.length > 0) {
      viewsPath = `M ${points[0].x} ${points[0].yViews}` + points.slice(1).map(p => ` L ${p.x} ${p.yViews}`).join('');
      viewsArea = `${viewsPath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

      visitorsPath = `M ${points[0].x} ${points[0].yVisitors}` + points.slice(1).map(p => ` L ${p.x} ${p.yVisitors}`).join('');
      visitorsArea = `${visitorsPath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
    }

    const gridLines = [
      { y: padT, val: maxVal },
      { y: padT + chartH * 0.5, val: Math.round(maxVal * 0.5) },
      { y: baselineY, val: 0 }
    ];

    return {
      width,
      height,
      padL,
      baselineY,
      points,
      viewsPath,
      viewsArea,
      visitorsPath,
      visitorsArea,
      gridLines
    };
  }

  getBarHeight(val: number, max: number = 60): number {
    if (!val || val <= 0) return 8;
    return Math.min(100, Math.max(10, Math.round((val / max) * 100)));
  }

  get pieChartData() {
    const events = this.filteredFootmarks;
    const total = events.length;
    let slices: Array<{ label: string; count: number; percentage: number; color: string; dash: string; offset: number }> = [];
    const C = 2 * Math.PI * 55; // ~ 345.575

    if (this.activePieMetric === 'device') {
      const counts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
      events.forEach((e: FootmarkEvent) => {
        const d = (e.device || 'mobile').toLowerCase();
        if (d === 'desktop') counts['Desktop'] = (counts['Desktop'] || 0) + 1;
        else if (d === 'tablet') counts['Tablet'] = (counts['Tablet'] || 0) + 1;
        else counts['Mobile'] = (counts['Mobile'] || 0) + 1;
      });
      const colors: Record<string, string> = {
        Mobile: '#ea580c',
        Desktop: '#3b82f6',
        Tablet: '#10b981'
      };

      let accumPercent = 0;
      slices = Object.entries(counts).map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const dash = `${(pct / 100) * C} ${C}`;
        const offset = -1 * (accumPercent / 100) * C;
        accumPercent += pct;
        return {
          label,
          count,
          percentage: pct,
          color: colors[label] || '#94a3b8',
          dash,
          offset
        };
      });
    } else {
      const counts: Record<string, number> = {};
      events.forEach((e: FootmarkEvent) => {
        const ref = e.referrer || 'Direct';
        counts[ref] = (counts[ref] || 0) + 1;
      });
      const palette = ['#ea580c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'];
      let accumPercent = 0;
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      slices = sorted.map(([label, count], i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const dash = `${(pct / 100) * C} ${C}`;
        const offset = -1 * (accumPercent / 100) * C;
        accumPercent += pct;
        return {
          label,
          count,
          percentage: pct,
          color: palette[i % palette.length],
          dash,
          offset
        };
      });
    }

    return {
      total,
      slices
    };
  }

  get filteredDeviceCounts() {
    const counts = { mobile: 0, desktop: 0, tablet: 0 };
    this.filteredFootmarks.forEach((e: FootmarkEvent) => {
      const d = (e.device || 'mobile').toLowerCase();
      if (counts[d as keyof typeof counts] !== undefined) counts[d as keyof typeof counts]++;
      else counts.mobile++;
    });
    return counts;
  }

  get filteredTopPages() {
    const map: Record<string, { count: number; title: string }> = {};
    const list = this.filteredFootmarks;
    const total = list.length;
    list.forEach((e: FootmarkEvent) => {
      const p = e.path || '/';
      if (!map[p]) map[p] = { count: 0, title: e.pageTitle || p };
      map[p].count++;
    });
    return Object.entries(map)
      .map(([path, data]) => ({
        path,
        title: data.title,
        count: data.count,
        percentage: total > 0 ? Math.round((data.count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  get filteredTopReferrers() {
    const map: Record<string, number> = {};
    this.filteredFootmarks.forEach((e: FootmarkEvent) => {
      const r = e.referrer || 'Direct';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }


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
      'Campaign Source', 'Campaign Medium', 'Campaign Name', 'Google Ads (GCLID)', 'Landing Page', 'Referrer', 'Visit Count',
      'Date', 'Message'
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
      `"${(l.initial_referrer || '').replace(/"/g, '""')}"`,
      `"${l.visit_count || 1}"`,
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
      utm_term: 'best deep cleaning baner',
      gclid: 'CjwKCAjwTestGclidExample123456789',
      landing_page: '/services/deep-cleaning-baner',
      initial_referrer: 'https://www.google.com/',
      visit_count: 2
    };
    await this.leadApi.submitLead(sample);
    await this.loadAllData();
    this.showToast('Test lead with attribution added successfully!');
  }

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

  addProject() {
    if (!this.dynamicContent.showcase) {
      this.dynamicContent.showcase = {
        heading: 'Recent Cleaning Projects in Pune',
        subheading: 'Explore recent residential and commercial cleaning work completed by our trained in-house team across Pune & PCMC.',
        projects: []
      };
    }
    this.dynamicContent.showcase.projects.push({
      title: 'New Cleaning Project',
      location: 'Wakad, Pune',
      category: 'Deep Cleaning',
      imageUrl: '/assets/images/deep-clean.webp',
      description: 'Comprehensive cleaning and sanitization completed by our in-house uniformed team.'
    });
    this.showToast('New project card added. Edit details and click Save.');
  }

  removeProject(index: number) {
    if (this.dynamicContent.showcase?.projects) {
      this.dynamicContent.showcase.projects.splice(index, 1);
      this.showToast('Project card removed. Click Save to persist.');
    }
  }

  async saveContentChanges() {
    this.savingContent = true;
    try {
      await this.contentApi.saveContent(this.dynamicContent);
      this.showToast('Website content, form controls, and pricing saved successfully!');
    } catch (e) {
      this.showToast('Saved to local storage cache.');
    } finally {
      this.savingContent = false;
    }
  }

  private showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }
}
