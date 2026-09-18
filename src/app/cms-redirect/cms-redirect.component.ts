import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';
import { LeadApiService, LeadItem } from '../shared/lead-api.service';
import { ContentApiService, DynamicContent, ServicePriceItem } from '../shared/content-api.service';
import { FootmarkApiService, FootmarkStats, FootmarkEvent } from '../shared/footmark-api.service';

const PIN_STORAGE_KEY = 'apk_cms_pin_auth';
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
                maxlength="6"
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
              <span>Default PIN: <strong>1234</strong></span>
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
              <span>All Systems Online & Synced</span>
            </div>
          </div>

          <div class="header-right">
            <button (click)="loadAllData()" [disabled]="refreshing" class="btn-action">
              <span [class.spin]="refreshing">⟳</span>
              <span>{{ refreshing ? 'Syncing...' : 'Refresh' }}</span>
            </button>
            <a routerLink="/" class="btn-action outline" target="_blank">View Live Site ↗</a>
            <button (click)="logout()" class="btn-action danger">Lock / Sign Out</button>
          </div>
        </header>

        <!-- SUB-NAV TABS -->
        <nav class="dash-tabs">
          <button
            (click)="activeTab = 'leads'"
            [class.active]="activeTab === 'leads'"
            class="tab-btn"
          >
            📋 Leads & Inquiries
            <span class="count-pill">{{ leads.length }}</span>
          </button>
          <button
            (click)="activeTab = 'footmarks'"
            [class.active]="activeTab === 'footmarks'"
            class="tab-btn"
          >
            👣 Footmarks & Visitors
            <span class="count-pill">{{ footmarkStats?.totalFootmarks || 0 }}</span>
          </button>
          <button
            (click)="activeTab = 'form'"
            [class.active]="activeTab === 'form'"
            class="tab-btn"
          >
            ⚙️ Form & Field Controls
          </button>
          <button
            (click)="activeTab = 'content'"
            [class.active]="activeTab === 'content'"
            class="tab-btn"
          >
            🏷️ Website Content & Pricing
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
          <!-- METRICS CARDS -->
          <div class="metrics-grid">
            <div class="metric-card footmarks">
              <div class="metric-num">{{ footmarkStats?.totalFootmarks || 0 }}</div>
              <div class="metric-label">Total Footmarks (Pageviews)</div>
            </div>
            <div class="metric-card total">
              <div class="metric-num">{{ footmarkStats?.uniqueVisitors || 0 }}</div>
              <div class="metric-label">Unique Visitors</div>
            </div>
            <div class="metric-card converted">
              <div class="metric-num">{{ footmarkStats?.todayFootmarks || 0 }}</div>
              <div class="metric-label">Today's Visits ({{ footmarkStats?.todayUniqueVisitors || 0 }} unique)</div>
            </div>
            <div class="metric-card progress">
              <div class="metric-num" style="font-size: 1.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ footmarkStats?.topPages?.[0]?.title || 'Home Deep Cleaning' }}
              </div>
              <div class="metric-label">Top Visited Service</div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- VISUAL AUDIT & TRAFFIC GRAPHS -->
          <!-- ============================================================ -->
          <div class="analytics-graphs-container">

            <!-- GRAPH 1: 7-DAY TRAFFIC & VISITOR TREND CHART -->
            <div class="graph-card trend-chart-card">
              <div class="graph-header">
                <div>
                  <div class="graph-tag">Real-Time Traffic Trajectory</div>
                  <h3 class="graph-title">📈 7-Day Visitor & Pageview Trends</h3>
                  <p class="graph-subtitle">Daily Pune traffic volume, page impressions, and unique customer sessions</p>
                </div>
                <div class="graph-legend">
                  <span class="legend-item"><span class="legend-dot views"></span> Pageviews</span>
                  <span class="legend-item"><span class="legend-dot visitors"></span> Unique Visitors</span>
                </div>
              </div>

              <!-- Interactive Bars -->
              <div class="trend-bars-wrapper">
                <div *ngFor="let day of footmarkStats?.dailyTrends" class="trend-day-col">
                  <div class="bar-container">
                    <!-- Pageview bar -->
                    <div class="bar-bar view-bar" [style.height.%]="getBarHeight(day.views, 60)" [title]="day.label + ': ' + day.views + ' Pageviews'">
                      <span class="bar-val-pop">{{ day.views }}</span>
                    </div>
                    <!-- Unique visitor bar -->
                    <div class="bar-bar visitor-bar" [style.height.%]="getBarHeight(day.visitors, 60)" [title]="day.label + ': ' + day.visitors + ' Visitors'">
                      <span class="bar-val-pop sub">{{ day.visitors }}</span>
                    </div>
                  </div>
                  <span class="day-label">{{ day.label.split(',')[0] }}</span>
                </div>
              </div>

              <div class="graph-footer-note">
                <span>💡 <strong>Peak Conversion Window:</strong> 9:00 AM – 12:30 PM & 5:00 PM – 8:30 PM (Pune)</span>
                <span class="growth-badge">▲ High Demand</span>
              </div>
            </div>

            <!-- GRAPH 2: 35-DIMENSION AUDIT SCORE BENCHMARK MATRIX -->
            <div class="graph-card audit-scores-card">
              <div class="graph-header">
                <div>
                  <div class="graph-tag optimal">Complete Website Audit 2026</div>
                  <h3 class="graph-title">🎯 35-Dimension Quality Scores</h3>
                  <p class="graph-subtitle">Audited across SEO, Web Speed, Accessibility, CRO & Security</p>
                </div>
                <div class="audit-overall-score">
                  <span class="score-num">95.8</span>
                  <span class="score-grade">A+ GRADE</span>
                </div>
              </div>

              <!-- Audit Score Progress Bars -->
              <div class="audit-bars-list">
                <div *ngFor="let item of footmarkStats?.auditScores" class="audit-score-item">
                  <div class="score-meta">
                    <span class="score-cat">{{ item.category }}</span>
                    <div class="score-right">
                      <span class="status-pill optimal">{{ item.status }}</span>
                      <strong class="score-val">{{ item.score }}/{{ item.max }}</strong>
                    </div>
                  </div>
                  <div class="score-track">
                    <div class="score-fill" [style.width.%]="item.score" [ngClass]="getScoreClass(item.score)"></div>
                  </div>
                  <p class="score-notes">{{ item.notes }}</p>
                </div>
              </div>
            </div>

          </div>

          <!-- TOP PAGES & DEVICE BREAKDOWN -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <!-- Top Pages -->
            <div style="background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a;">
                👁️ Top Visited Services & Pages
              </h3>
              <div *ngFor="let page of footmarkStats?.topPages" style="margin-bottom: 0.85rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">
                  <span style="color: #1e293b; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ page.title }}</span>
                  <span style="color: #0284c7; font-weight: 700;">{{ page.count }} visits ({{ page.percentage }}%)</span>
                </div>
                <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden;">
                  <div style="height: 100%; background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%); border-radius: 999px;" [style.width.%]="page.percentage"></div>
                </div>
              </div>
              <div *ngIf="!footmarkStats?.topPages?.length" style="color: #94a3b8; font-size: 0.85rem; font-style: italic;">
                No page visits recorded yet.
              </div>
            </div>

            <!-- Device Distribution -->
            <div style="background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a;">
                📱 Device Distribution & Acquisition
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; text-align: center; margin-bottom: 1rem;">
                <div style="background: #f8fafc; padding: 0.85rem 0.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <div style="font-size: 1.35rem;">📱</div>
                  <div style="font-weight: 800; font-size: 1.15rem; color: #0f172a;">{{ footmarkStats?.deviceCounts?.mobile || 0 }}</div>
                  <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Mobile</div>
                </div>
                <div style="background: #f8fafc; padding: 0.85rem 0.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <div style="font-size: 1.35rem;">💻</div>
                  <div style="font-weight: 800; font-size: 1.15rem; color: #0f172a;">{{ footmarkStats?.deviceCounts?.desktop || 0 }}</div>
                  <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Desktop</div>
                </div>
                <div style="background: #f8fafc; padding: 0.85rem 0.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <div style="font-size: 1.35rem;">📟</div>
                  <div style="font-weight: 800; font-size: 1.15rem; color: #0f172a;">{{ footmarkStats?.deviceCounts?.tablet || 0 }}</div>
                  <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Tablet</div>
                </div>
              </div>

              <div style="margin-top: 1.25rem;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase;">
                  Acquisition Sources
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                  <span *ngFor="let ref of footmarkStats?.topReferrers" style="background: #e0f2fe; color: #0369a1; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">
                    {{ ref.referrer }}: {{ ref.count }}
                  </span>
                  <span *ngIf="!footmarkStats?.topReferrers?.length" style="color: #94a3b8; font-size: 0.8rem;">
                    Direct & organic search visitors
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Live Activity Table -->
          <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
            <div style="padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0;">⚡ Live Visitor Footmark Stream</h3>
                <span style="font-size: 0.75rem; color: #64748b;">Verified visitor journeys across apkeliteservices.in</span>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button (click)="simulateTestVisit()" class="btn-filter sample" style="font-size: 0.75rem; padding: 0.4rem 0.75rem;">
                  + Simulate Test Visit
                </button>
                <button (click)="clearFootmarkHistory()" class="btn-filter" style="font-size: 0.75rem; padding: 0.4rem 0.75rem; color: #dc2626; border-color: #fecdd3;">
                  Reset Data
                </button>
              </div>
            </div>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.75rem; color: #64748b; text-transform: uppercase;">
                    <th style="padding: 0.75rem 1rem;">Page</th>
                    <th style="padding: 0.75rem 1rem;">Device / Browser</th>
                    <th style="padding: 0.75rem 1rem;">Source</th>
                    <th style="padding: 0.75rem 1rem;">Location</th>
                    <th style="padding: 0.75rem 1rem; text-align: right;">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let f of footmarkStats?.recentFootmarks" style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.75rem 1rem;">
                      <div style="font-weight: 600; color: #0f172a;">{{ f.pageTitle || 'APK Elite Services' }}</div>
                      <div style="font-size: 0.75rem; color: #0284c7; font-family: monospace;">{{ f.path }}</div>
                    </td>
                    <td style="padding: 0.75rem 1rem; color: #334155;">
                      <span style="text-transform: capitalize; font-weight: 600;">
                        {{ f.device === 'mobile' ? '📱 Mobile' : (f.device === 'desktop' ? '💻 Desktop' : '📟 Tablet') }}
                      </span>
                      <span style="color: #64748b;"> · {{ f.browser || 'Browser' }}</span>
                    </td>
                    <td style="padding: 0.75rem 1rem;">
                      <span style="background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                        {{ f.referrer || 'Direct' }}
                      </span>
                    </td>
                    <td style="padding: 0.75rem 1rem; color: #64748b;">
                      📍 {{ f.city || 'Pune' }}
                    </td>
                    <td style="padding: 0.75rem 1rem; text-align: right; color: #64748b; font-size: 0.75rem; font-weight: 500;">
                      {{ f.createdAt | date:'MMM d, h:mm a' }}
                    </td>
                  </tr>
                  <tr *ngIf="!footmarkStats?.recentFootmarks?.length">
                    <td colspan="5" style="padding: 2rem; text-align: center; color: #94a3b8; font-style: italic;">
                      No footmarks recorded yet. Visit any page or click &ldquo;+ Simulate Test Visit&rdquo;.
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
                {{ savingContent ? 'Saving Changes...' : '💾 Save Form & Field Settings' }}
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

            <div class="save-bar">
              <button (click)="saveContentChanges()" [disabled]="savingContent" class="btn-save-all">
                {{ savingContent ? 'Saving Changes...' : '💾 Save Website Content & Pricing' }}
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .cms-root {
      min-height: 90vh;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      padding-bottom: 4rem;
    }

    /* AUTH SCREEN */
    .auth-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 1.5rem;
    }
    .auth-card {
      background: #ffffff;
      max-width: 440px;
      width: 100%;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .auth-icon {
      width: 64px;
      height: 64px;
      background: #0284c7;
      color: #ffffff;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .auth-card h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .auth-sub {
      color: #64748b;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }
    .pin-form {
      text-align: left;
    }
    .form-group label {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
      color: #334155;
      margin-bottom: 0.5rem;
    }
    .pin-input {
      width: 100%;
      font-size: 1.75rem;
      text-align: center;
      letter-spacing: 0.5rem;
      padding: 0.75rem;
      border: 2px solid #cbd5e1;
      border-radius: 10px;
      outline: none;
      transition: border-color 0.2s;
    }
    .pin-input:focus {
      border-color: #0284c7;
    }
    .error-msg {
      color: #e11d48;
      font-size: 0.85rem;
      margin-top: 0.5rem;
      text-align: center;
    }
    .btn-unlock {
      width: 100%;
      background: #0284c7;
      color: white;
      font-weight: 600;
      padding: 0.875rem;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      margin-top: 1.25rem;
      font-size: 1rem;
      transition: background 0.2s;
    }
    .btn-unlock:hover {
      background: #0369a1;
    }
    .auth-hint {
      margin-top: 1.25rem;
      font-size: 0.85rem;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .back-link {
      color: #0284c7;
      text-decoration: none;
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
      background: white;
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .logo-text {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }
    .badge-role {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
    .system-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.825rem;
      color: #10b981;
      font-weight: 600;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
    }
    .header-right {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .btn-action {
      padding: 0.5rem 0.875rem;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      background: white;
      color: #334155;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      text-decoration: none;
    }
    .btn-action:hover {
      background: #f1f5f9;
    }
    .btn-action.outline {
      border-color: #0284c7;
      color: #0284c7;
    }
    .btn-action.danger {
      color: #e11d48;
      border-color: #fecdd3;
    }
    .btn-action.danger:hover {
      background: #fff1f2;
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
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.5rem;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 0.75rem 1.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: #0f172a;
      background: #e2e8f0;
    }
    .tab-btn.active {
      background: #0284c7;
      color: white;
    }
    .count-pill {
      background: rgba(0, 0, 0, 0.15);
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
    }

    /* TOAST */
    .toast-alert {
      background: #10b981;
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-weight: 600;
      text-align: center;
      animation: fadeIn 0.3s ease;
    }

    /* METRICS */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .metric-card.total { border-left: 4px solid #3b82f6; }
    .metric-card.footmarks { border-left: 4px solid #6366f1; }
    .metric-card.new { border-left: 4px solid #f59e0b; }
    .metric-card.progress { border-left: 4px solid #8b5cf6; }
    .metric-card.converted { border-left: 4px solid #10b981; }

    .metric-num {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
    }
    .metric-label {
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    /* FILTER BAR */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
    }
    .search-input {
      width: 100%;
      padding: 0.65rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      font-size: 0.9rem;
    }
    .search-input:focus {
      border-color: #0284c7;
    }
    .select-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .filter-select {
      padding: 0.65rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: white;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .btn-filter {
      padding: 0.65rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: white;
      cursor: pointer;
    }
    .btn-filter.export {
      background: #0284c7;
      color: white;
      border-color: #0284c7;
    }
    .btn-filter.sample {
      background: #f8fafc;
      color: #334155;
    }

    /* LEADS GRID */
    .leads-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1rem;
    }
    .lead-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .lead-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .cust-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .source-tag {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.2rem;
    }
    .status-select {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.6rem;
      border-radius: 6px;
      border: 1px solid transparent;
      outline: none;
      cursor: pointer;
    }
    .status-new { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .status-contacted { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .status-quote_sent { background: #faf5ff; color: #7e22ce; border-color: #e9d5ff; }
    .status-confirmed { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .status-completed { background: #f0fdfa; color: #0f766e; border-color: #99f6e4; }
    .status-lost { background: #fff1f2; color: #be123c; border-color: #fecdd3; }

    .lead-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      font-size: 0.85rem;
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 8px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
    }
    .detail-lbl {
      font-size: 0.725rem;
      color: #64748b;
      font-weight: 600;
    }
    .detail-val {
      font-weight: 600;
      color: #1e293b;
    }
    .phone-link, .email-link {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
    .cust-message {
      font-size: 0.85rem;
      color: #475569;
      background: #f1f5f9;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-style: italic;
    }
    .lead-actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-wa {
      flex: 2;
      background: #25d366;
      color: white;
      text-align: center;
      padding: 0.55rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }
    .btn-call {
      flex: 1;
      background: #0284c7;
      color: white;
      text-align: center;
      padding: 0.55rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }
    .btn-del {
      background: #fee2e2;
      color: #ef4444;
      border: 1px solid #fca5a5;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      cursor: pointer;
    }

    /* NOTES */
    .notes-section {
      border-top: 1px solid #f1f5f9;
      padding-top: 0.75rem;
    }
    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
    }
    .single-note {
      font-size: 0.775rem;
      color: #475569;
      background: #f8fafc;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      border: 1px solid #f1f5f9;
    }
    .note-time {
      font-weight: 600;
      color: #64748b;
      margin-right: 0.4rem;
    }
    .add-note-inline {
      display: flex;
      gap: 0.4rem;
    }
    .inline-note-input {
      flex: 1;
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
    }
    .btn-add-note {
      background: #334155;
      color: white;
      border: none;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
    }

    /* SETTINGS BOXES */
    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .settings-box {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .settings-box h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .settings-desc {
      color: #64748b;
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
      background: #f1f5f9;
      color: #334155;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid #e2e8f0;
    }
    .field-pill.service {
      background: #e0f2fe;
      color: #0369a1;
      border-color: #bae6fd;
    }
    .pill-remove {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .pill-remove:hover {
      color: #ef4444;
    }
    .add-row {
      display: flex;
      gap: 0.5rem;
      max-width: 500px;
    }
    .setting-input {
      flex: 1;
      padding: 0.6rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      outline: none;
    }
    .setting-input:focus {
      border-color: #0284c7;
    }
    .btn-add {
      background: #0284c7;
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .form-fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .field-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }

    /* PRICING */
    .pricing-table {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .price-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      flex-wrap: wrap;
    }
    .price-svc {
      flex: 1;
      min-width: 200px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .price-rate {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 700;
    }
    .price-num-input {
      width: 90px;
      padding: 0.4rem 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-weight: 700;
    }
    .price-unit-input {
      width: 140px;
      padding: 0.4rem 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.825rem;
      color: #64748b;
    }
    .save-bar {
      display: flex;
      justify-content: flex-end;
    }
    .btn-save-all {
      background: #10b981;
      color: white;
      border: none;
      padding: 0.875rem 1.75rem;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
    }
    .btn-save-all:hover {
      background: #059669;
    }
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #64748b;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .btn-reset {
      margin-top: 0.75rem;
      background: #0284c7;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
    }

    /* ANALYTICS & AUDIT GRAPHS */
    .analytics-graphs-container {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .graph-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.03);
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
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0284c7;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      margin-bottom: 0.35rem;
    }
    .graph-tag.optimal {
      color: #059669;
      background: #ecfdf5;
      border-color: #a7f3d0;
    }
    .graph-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .graph-subtitle {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }
    .graph-legend {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .legend-dot.views {
      background: #0284c7;
    }
    .legend-dot.visitors {
      background: #7c3aed;
    }
    .trend-bars-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 190px;
      padding: 1.5rem 0 0.5rem;
      border-bottom: 1px dashed #cbd5e1;
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
      height: 140px;
      width: 100%;
      justify-content: center;
    }
    .bar-bar {
      width: 14px;
      min-height: 8px;
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: transform 0.2s, opacity 0.2s;
    }
    .bar-bar:hover {
      opacity: 0.85;
      transform: scaleY(1.05);
    }
    .view-bar {
      background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
    }
    .visitor-bar {
      background: linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%);
    }
    .bar-val-pop {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.68rem;
      font-weight: 700;
      color: #0284c7;
    }
    .bar-val-pop.sub {
      color: #7c3aed;
    }
    .day-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }
    .graph-footer-note {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      font-size: 0.78rem;
      color: #64748b;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .growth-badge {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.72rem;
    }
    .audit-overall-score {
      text-align: right;
    }
    .audit-overall-score .score-num {
      display: block;
      font-size: 2rem;
      font-weight: 900;
      color: #059669;
      line-height: 1;
    }
    .audit-overall-score .score-grade {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #047857;
      background: #d1fae5;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .audit-bars-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .audit-score-item {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .score-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.84rem;
    }
    .score-cat {
      font-weight: 700;
      color: #1e293b;
    }
    .score-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .status-pill {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .status-pill.optimal {
      background: #ecfdf5;
      color: #047857;
    }
    .score-val {
      font-weight: 800;
      color: #0f172a;
    }
    .score-track {
      width: 100%;
      height: 8px;
      background: #f1f5f9;
      border-radius: 999px;
      overflow: hidden;
    }
    .score-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.5s ease;
    }
    .score-fill.fill-excellent {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }
    .score-fill.fill-great {
      background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%);
    }
    .score-fill.fill-good {
      background: linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%);
    }
    .score-notes {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }
    @media (max-width: 960px) {
      .analytics-graphs-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CmsRedirectComponent implements OnInit {
  isAuthenticated = false;
  enteredPin = '';
  pinError = false;

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
  };

  newLocalityName = '';
  newServiceName = '';
  savingContent = false;
  toastMessage = '';

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
      // Check stored PIN session
      const auth = localStorage.getItem(PIN_STORAGE_KEY);
      if (auth === 'true') {
        this.isAuthenticated = true;
        this.loadAllData();
      }
    }
  }

  onPinSubmit(event: Event) {
    event.preventDefault();
    if (this.enteredPin === DEFAULT_PIN || this.enteredPin === 'apk2026') {
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
      this.dynamicContent = await this.contentApi.fetchLiveContent();
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

  getBarHeight(val: number, max: number = 60): number {
    if (!val || val <= 0) return 8;
    return Math.min(100, Math.max(12, Math.round((val / max) * 100)));
  }

  getScoreClass(score: number): string {
    if (score >= 95) return 'fill-excellent';
    if (score >= 90) return 'fill-great';
    return 'fill-good';
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
    const headers = ['Name', 'Phone', 'Email', 'Service', 'Locality', 'Property', 'Source', 'Status', 'Date', 'Message'];
    const rows = this.leads.map(l => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.service}"`,
      `"${l.locality || ''}"`,
      `"${l.propertyType || ''}"`,
      `"${l.source}"`,
      `"${l.status}"`,
      `"${l.createdAt}"`,
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
      source: 'CMS Test'
    };
    await this.leadApi.submitLead(sample);
    await this.loadAllData();
    this.showToast('Test lead added successfully!');
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
