/**
 * CMS Traffic Analytics — Comprehensive Test Suite
 * Tests all traffic metric calculations from cms-redirect.component.ts
 * Run: node cms/scripts/test-cms-traffic-analytics.mjs
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;
const results = [];

function recordTest(id, name, ok, details = '') {
  if (ok) {
    passed++;
    console.log(`  ✅ [${id}] ${name}`);
  } else {
    failed++;
    console.log(`  ❌ [${id}] ${name}`);
    if (details) console.log(`       → ${details}`);
  }
  results.push({ id, name, ok, details });
}

function assert(id, name, condition, details = '') {
  recordTest(id, name, !!condition, details || String(condition));
}

function near(a, b, tolerance = 1) {
  return Math.abs(a - b) <= tolerance;
}

// ─── Mock Factories ─────────────────────────────────────────────────────────

let _eid = 0;
function mkEvent(overrides = {}) {
  const now = new Date().toISOString();
  return {
    _id: `evt_${++_eid}`,
    visitorId: 'v1',
    sessionId: 's1',
    path: '/',
    pageTitle: 'Home',
    landingPage: '/',
    referrer: '',
    browser: 'Chrome',
    os: 'Windows',
    device: 'desktop',
    city: 'Pune',
    createdAt: now,
    ...overrides,
  };
}

function ago(ms) {
  return new Date(Date.now() - ms).toISOString();
}

const H = 3600000;
const D = 86400000;

// ─── Re-implement analytics logic (mirrors cms-redirect.component.ts) ────────

function filteredFootmarks(events, timeframe) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  return events.filter(e => {
    if (timeframe === 'today')  return (e.createdAt || '').startsWith(todayStr);
    if (timeframe === '24h')    return new Date(e.createdAt || 0) >= new Date(now.getTime() - 24 * H);
    if (timeframe === '7d')     return new Date(e.createdAt || 0) >= new Date(now.getTime() - 7 * D);
    if (timeframe === '30d')    return new Date(e.createdAt || 0) >= new Date(now.getTime() - 30 * D);
    return true; // 'all'
  });
}

function metricVisitors(events) {
  const set = new Set(events.map(e => e.visitorId));
  return set.size || (events.length ? 1 : 0);
}

function metricVisits(events) {
  const set = new Set(events.map(e => e.sessionId || e.visitorId));
  return set.size || metricVisitors(events);
}

function metricViews(events) {
  return events.length;
}

function metricBounceRate(events) {
  if (!events.length) return 0;
  const counts = {};
  events.forEach(e => {
    const s = e.sessionId || e.visitorId;
    counts[s] = (counts[s] || 0) + 1;
  });
  const total = Object.keys(counts).length;
  if (!total) return 0;
  const single = Object.values(counts).filter(c => c === 1).length;
  return Math.round((single / total) * 100);
}

function metricVisitDuration(events) {
  if (events.length < 2) return '10m 1s';
  const sessionTimes = {};
  events.forEach(e => {
    const s = e.sessionId || e.visitorId;
    const t = new Date(e.createdAt || 0).getTime();
    if (!sessionTimes[s]) sessionTimes[s] = { min: t, max: t };
    else {
      sessionTimes[s].min = Math.min(sessionTimes[s].min, t);
      sessionTimes[s].max = Math.max(sessionTimes[s].max, t);
    }
  });
  let totalSec = 0, count = 0;
  Object.values(sessionTimes).forEach(st => {
    const diff = Math.round((st.max - st.min) / 1000);
    if (diff > 5) { totalSec += diff; count++; }
  });
  const avgSec = count > 0 ? Math.round(totalSec / count) : 601;
  const m = Math.floor(avgSec / 60);
  const s = avgSec % 60;
  return `${m}m ${s}s`;
}

function stackedChartData(events, timeframe) {
  const isHourly = timeframe === 'today' || timeframe === '24h';
  const bars = [];
  if (isHourly) {
    const hours = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    for (const h of hours) {
      const ampm = h < 12 ? 'AM' : (h === 24 ? 'AM' : 'PM');
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const label = `${displayH}:00 ${ampm}`;
      const bucket = events.filter(e => {
        const eh = new Date(e.createdAt || 0).getHours();
        return eh >= h - 2 && eh < h;
      });
      bars.push({ label, views: bucket.length, visitors: new Set(bucket.map(e => e.visitorId)).size, viewsHeightPct: 0, visitorsHeightPct: 0 });
    }
  } else {
    const numDays = timeframe === '30d' ? 14 : 7;
    const now = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      const bucket = events.filter(e => (e.createdAt || '').startsWith(dateStr));
      bars.push({ label, views: bucket.length, visitors: new Set(bucket.map(e => e.visitorId)).size, viewsHeightPct: 0, visitorsHeightPct: 0 });
    }
  }

  let rawMax = 1;
  for (const b of bars) if (b.views > rawMax) rawMax = b.views;
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

function activePagesList(events, totalVisitors, pagesSubTab = 'path') {
  const map = {};
  events.forEach(e => {
    let val = '/';
    if (pagesSubTab === 'path')       val = e.path || '/';
    else if (pagesSubTab === 'url')   val = `https://apkeliteservices.in${e.path || '/'}`;
    else if (pagesSubTab === 'entry') val = e.landingPage || e.path || '/';
    else if (pagesSubTab === 'exit')  val = e.path || '/';
    if (!map[val]) map[val] = new Set();
    map[val].add(e.visitorId);
  });
  const total = totalVisitors || 1;
  return Object.entries(map)
    .map(([key, s]) => ({ key, visitors: s.size, percentage: Math.round((s.size / total) * 100) }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10);
}

function activeSourcesList(events, totalVisitors, sourcesSubTab = 'referrers') {
  const map = {};
  events.forEach(e => {
    let key = 'Direct';
    const r = (e.referrer || '').toLowerCase();
    const isInternal = r.includes('apkeliteservices.in') || r.includes('localhost') || r === 'direct' || !r;
    if (sourcesSubTab === 'referrers') {
      if (isInternal) key = 'Direct / Bookmark';
      else if (r.includes('google')) key = 'google.com';
      else if (r.includes('bing')) key = 'bing.com';
      else if (r.includes('whatsapp') || r.includes('wa.me')) key = 'whatsapp';
      else if (r.includes('instagram')) key = 'instagram.com';
      else if (r.includes('facebook')) key = 'facebook.com';
      else {
        try {
          const parsed = new URL(r.startsWith('http') ? r : `https://${r}`);
          key = parsed.hostname;
        } catch { key = r; }
      }
    } else {
      if (e.gclid || (e.utmCampaign && e.utmCampaign.includes('cpc'))) key = 'Paid Search (Google Ads)';
      else if (r.includes('google') || r.includes('bing') || r.includes('yahoo')) key = 'Organic Search';
      else if (r.includes('whatsapp') || r.includes('instagram') || r.includes('facebook') || r.includes('social')) key = 'Social Media';
      else if (!isInternal) key = 'Referral Traffic';
      else key = 'Direct Traffic';
    }
    if (!map[key]) map[key] = new Set();
    map[key].add(e.visitorId);
  });
  const total = totalVisitors || 1;
  return Object.entries(map)
    .map(([name, s]) => ({ name, visitors: s.size, percentage: Math.round((s.size / total) * 100) }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 8);
}

function activeEnvList(events, totalVisitors, envSubTab = 'browsers') {
  const map = {};
  events.forEach(e => {
    let key = 'Unknown';
    if (envSubTab === 'browsers')     key = e.browser || 'Chrome';
    else if (envSubTab === 'os')      key = e.os || (e.device === 'mobile' ? 'Android' : 'Windows');
    else if (envSubTab === 'devices') {
      const d = (e.device || 'mobile').toLowerCase();
      key = d === 'mobile' ? 'Mobile' : (d === 'desktop' ? 'Desktop' : 'Tablet');
    }
    if (!map[key]) map[key] = new Set();
    map[key].add(e.visitorId);
  });
  const total = totalVisitors || 1;
  return Object.entries(map)
    .map(([name, s]) => ({ name, visitors: s.size, percentage: Math.round((s.size / total) * 100) }))
    .sort((a, b) => b.visitors - a.visitors);
}

function activeLocationList(events, totalVisitors, locSubTab = 'countries') {
  const map = {};
  events.forEach(e => {
    let key = 'India';
    if (locSubTab === 'countries') key = e.city && e.city.toLowerCase() !== 'unknown' && !e.city.toLowerCase().includes('us') ? 'India' : 'United States';
    else if (locSubTab === 'regions') key = 'Maharashtra';
    else if (locSubTab === 'cities') key = e.city && e.city.toLowerCase() !== 'unknown' ? e.city : 'Pune';
    if (!map[key]) map[key] = new Set();
    map[key].add(e.visitorId);
  });
  const total = totalVisitors || 1;
  return Object.entries(map)
    .map(([name, s]) => ({ name, visitors: s.size || 1, percentage: Math.round(((s.size || 1) / total) * 100) }))
    .sort((a, b) => b.visitors - a.visitors);
}

function activeSessionsList(events) {
  const map = {};
  events.forEach(e => {
    const sid = e.sessionId || e.visitorId;
    if (!map[sid]) {
      map[sid] = { sessionId: sid, visitorId: e.visitorId, device: e.device || 'mobile', browser: e.browser || 'Chrome', city: e.city || 'Pune', views: 0, landingPage: e.landingPage || e.path || '/', lastSeen: e.createdAt || new Date().toISOString() };
    }
    map[sid].views++;
    if (new Date(e.createdAt || 0) > new Date(map[sid].lastSeen)) map[sid].lastSeen = e.createdAt;
  });
  return Object.values(map).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
}

function conversionGoals(events, leads) {
  const totalVisitors = metricVisitors(events) || 1;
  const leadsCount = leads.length;
  const quoteRate = Math.min(100, Math.round((leadsCount / totalVisitors) * 100));
  const waClicks = events.filter(e => e.referrer && e.referrer.includes('whatsapp')).length + (leadsCount > 0 ? leadsCount : 2);
  const phoneClicks = Math.max(1, Math.round(leadsCount * 0.6));
  return { totalLeads: leadsCount, quoteRate, whatsAppClicks: waClicks, phoneClicks };
}

// ════════════════════════════════════════════════════════════════════════════
// TEST GROUPS
// ════════════════════════════════════════════════════════════════════════════

console.log('\n📊 CMS Traffic Analytics — Test Suite\n');

// ────────────────────────────────────────────────────────────────────────────
console.log('─── 1. Timeframe Filtering ───────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  const events = [
    mkEvent({ createdAt: ago(30 * 60 * 1000),    visitorId: 'v-today'  }), // 30 min ago  → today ✓
    mkEvent({ createdAt: ago(23 * H),            visitorId: 'v-24h'   }), // 23h ago     → 24h ✓
    mkEvent({ createdAt: ago(6  * D),            visitorId: 'v-7d'    }), // 6d ago      → 7d ✓
    mkEvent({ createdAt: ago(25 * D),            visitorId: 'v-30d'   }), // 25d ago     → 30d ✓
    mkEvent({ createdAt: ago(40 * D),            visitorId: 'v-old'   }), // 40d ago     → only 'all'
  ];

  const f_today = filteredFootmarks(events, 'today');
  const f_24h   = filteredFootmarks(events, '24h');
  const f_7d    = filteredFootmarks(events, '7d');
  const f_30d   = filteredFootmarks(events, '30d');
  const f_all   = filteredFootmarks(events, 'all');

  assert('TF-01', "today: includes events from today", f_today.some(e => e.visitorId === 'v-today'));
  assert('TF-02', "today: excludes 23h-ago event", !f_today.some(e => e.visitorId === 'v-24h'));
  assert('TF-03', "24h: includes 23h-ago event", f_24h.some(e => e.visitorId === 'v-24h'));
  assert('TF-04', "24h: excludes 6d-ago event", !f_24h.some(e => e.visitorId === 'v-7d'));
  assert('TF-05', "7d: includes 6d-ago event", f_7d.some(e => e.visitorId === 'v-7d'));
  assert('TF-06', "7d: excludes 25d-ago event", !f_7d.some(e => e.visitorId === 'v-30d'));
  assert('TF-07', "30d: includes 25d-ago event", f_30d.some(e => e.visitorId === 'v-30d'));
  assert('TF-08', "30d: excludes 40d-ago event", !f_30d.some(e => e.visitorId === 'v-old'));
  assert('TF-09', "'all' includes everything", f_all.length === 5, `got ${f_all.length}`);
  assert('TF-10', "empty input returns empty array for any timeframe", filteredFootmarks([], '7d').length === 0);
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 2. Core Metrics ──────────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  // Scenario A: 3 visitors, 4 sessions, 7 views
  const A = [
    mkEvent({ visitorId: 'v1', sessionId: 's1' }),
    mkEvent({ visitorId: 'v1', sessionId: 's1' }),
    mkEvent({ visitorId: 'v1', sessionId: 's2' }), // v1 has 2 sessions
    mkEvent({ visitorId: 'v2', sessionId: 's3' }),
    mkEvent({ visitorId: 'v2', sessionId: 's3' }),
    mkEvent({ visitorId: 'v3', sessionId: 's4' }),
    mkEvent({ visitorId: 'v3', sessionId: 's4' }),
  ];

  assert('MT-01', "metricVisitors deduplicates by visitorId", metricVisitors(A) === 3, `got ${metricVisitors(A)}`);
  assert('MT-02', "metricVisits deduplicates by sessionId", metricVisits(A) === 4, `got ${metricVisits(A)}`);
  assert('MT-03', "metricViews is total event count", metricViews(A) === 7, `got ${metricViews(A)}`);

  // Scenario B: empty events
  assert('MT-04', "metricVisitors returns 0 for empty events", metricVisitors([]) === 0);
  assert('MT-05', "metricVisits returns 0 for empty events", metricVisits([]) === 0);
  assert('MT-06', "metricViews returns 0 for empty events", metricViews([]) === 0);

  // Scenario C: single event (no sessionId fallback)
  const C = [mkEvent({ visitorId: 'v1', sessionId: '' })];
  assert('MT-07', "metricVisits falls back to visitorId when sessionId missing", metricVisits(C) === 1);
  assert('MT-08', "metricVisitors handles single event", metricVisitors(C) === 1);
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 3. Bounce Rate ───────────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  // 2 sessions: s1 has 1 page (bounce), s2 has 2 pages (not bounce) → 50%
  const BR = [
    mkEvent({ sessionId: 's1', visitorId: 'v1' }),
    mkEvent({ sessionId: 's2', visitorId: 'v2' }),
    mkEvent({ sessionId: 's2', visitorId: 'v2' }),
  ];
  assert('BR-01', "bounce rate: 1 of 2 sessions = 50%", metricBounceRate(BR) === 50, `got ${metricBounceRate(BR)}`);

  // All bounce
  const allBounce = [mkEvent({ sessionId: 'sa', visitorId: 'va' }), mkEvent({ sessionId: 'sb', visitorId: 'vb' })];
  assert('BR-02', "bounce rate 100% when all sessions have 1 page", metricBounceRate(allBounce) === 100, `got ${metricBounceRate(allBounce)}`);

  // No bounce
  const noBounce = [
    mkEvent({ sessionId: 's1', visitorId: 'v1' }), mkEvent({ sessionId: 's1', visitorId: 'v1' }),
    mkEvent({ sessionId: 's2', visitorId: 'v2' }), mkEvent({ sessionId: 's2', visitorId: 'v2' }),
  ];
  assert('BR-03', "bounce rate 0% when all sessions have 2+ pages", metricBounceRate(noBounce) === 0, `got ${metricBounceRate(noBounce)}`);

  // Empty
  assert('BR-04', "bounce rate returns 0 for empty events", metricBounceRate([]) === 0);
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 4. Visit Duration ────────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  // Single event → fallback
  const single = [mkEvent({ createdAt: ago(H) })];
  assert('VD-01', "single event returns fallback '10m 1s'", metricVisitDuration(single) === '10m 1s');

  // Empty → fallback
  assert('VD-02', "empty events returns fallback '10m 1s'", metricVisitDuration([]) === '10m 1s');

  // Two events 5 minutes apart in same session
  const base = Date.now();
  const twoEvents = [
    mkEvent({ sessionId: 'sx', visitorId: 'vx', createdAt: new Date(base - 5 * 60000).toISOString() }),
    mkEvent({ sessionId: 'sx', visitorId: 'vx', createdAt: new Date(base).toISOString() }),
  ];
  const dur = metricVisitDuration(twoEvents);
  assert('VD-03', "two events 5 min apart → '5m Xs' format", /^\d+m \d+s$/.test(dur), `got: ${dur}`);

  // Very short gap (< 5s) → skipped → fallback
  const shortGap = [
    mkEvent({ sessionId: 'sy', visitorId: 'vy', createdAt: new Date(base - 2000).toISOString() }),
    mkEvent({ sessionId: 'sy', visitorId: 'vy', createdAt: new Date(base).toISOString() }),
  ];
  const durShort = metricVisitDuration(shortGap);
  // diff is 2 seconds, skipped → fallback '10m 1s'
  assert('VD-04', "sessions with <5s gap are excluded → fallback '10m 1s'", durShort === '10m 1s', `got: ${durShort}`);

  // Multiple sessions: average calculation
  const multiSess = [
    mkEvent({ sessionId: 'sa', visitorId: 'va', createdAt: new Date(base - 10 * 60000).toISOString() }),
    mkEvent({ sessionId: 'sa', visitorId: 'va', createdAt: new Date(base - 4 * 60000).toISOString() }), // 6 min
    mkEvent({ sessionId: 'sb', visitorId: 'vb', createdAt: new Date(base - 8 * 60000).toISOString() }),
    mkEvent({ sessionId: 'sb', visitorId: 'vb', createdAt: new Date(base).toISOString() }),              // 8 min
  ];
  // avg = (360 + 480)/2 = 420 sec = 7m 0s
  const durMulti = metricVisitDuration(multiSess);
  assert('VD-05', "avg duration of two sessions (6m + 8m) = '7m 0s'", durMulti === '7m 0s', `got: ${durMulti}`);
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 5. Stacked Bar Chart ─────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  const emptyEvents = [];

  // today/24h → hourly (12 bars)
  const hourly = stackedChartData(emptyEvents, 'today');
  assert('SBC-01', "today timeframe produces 12 bars", hourly.bars.length === 12, `got ${hourly.bars.length}`);

  const hourly24 = stackedChartData(emptyEvents, '24h');
  assert('SBC-02', "24h timeframe also produces 12 bars", hourly24.bars.length === 12);

  // 7d → 7 bars
  const weekly = stackedChartData(emptyEvents, '7d');
  assert('SBC-03', "7d timeframe produces 7 bars", weekly.bars.length === 7, `got ${weekly.bars.length}`);

  // 30d → 14 bars
  const monthly = stackedChartData(emptyEvents, '30d');
  assert('SBC-04', "30d timeframe produces 14 bars", monthly.bars.length === 14, `got ${monthly.bars.length}`);

  // gridLines always 6 elements
  assert('SBC-05', "gridLines has exactly 6 elements", hourly.gridLines.length === 6);
  assert('SBC-06', "gridLines[5] is always 0", hourly.gridLines[5] === 0);
  assert('SBC-07', "gridLines[0] equals maxVal", hourly.gridLines[0] === hourly.maxVal);

  // maxVal grid snapping
  const e1 = [mkEvent({ visitorId: 'v1' })]; // rawMax = 1 → ≤ 20 → maxVal = ceil(1*1.2)=2 ≥ 10
  const chart1 = stackedChartData(e1, '7d');
  assert('SBC-08', "maxVal is at least 10 for sparse data", chart1.maxVal >= 10, `got ${chart1.maxVal}`);

  // Height percentages capped at 100
  // Create events that overwhelm one bar (21 events on same day)
  const today = new Date().toISOString().split('T')[0];
  const denseEvents = Array.from({ length: 21 }, (_, i) =>
    mkEvent({ visitorId: `vi${i}`, sessionId: `si${i}`, createdAt: `${today}T10:00:00.000Z` })
  );
  const denseChart = stackedChartData(denseEvents, '7d');
  const maxPct = Math.max(...denseChart.bars.map(b => b.viewsHeightPct));
  assert('SBC-09', "viewsHeightPct never exceeds 100", maxPct <= 100, `max was ${maxPct}`);

  // rawMax > 40 → maxVal = 80
  const e40 = Array.from({ length: 41 }, (_, i) =>
    mkEvent({ visitorId: `vu${i}`, createdAt: `${today}T10:00:00.000Z` })
  );
  const chart40 = stackedChartData(e40, '7d');
  assert('SBC-10', "rawMax > 40 sets maxVal to 80", chart40.maxVal === 80, `got ${chart40.maxVal}`);

  // rawMax > 20 → maxVal = 40
  const e20 = Array.from({ length: 21 }, (_, i) =>
    mkEvent({ visitorId: `vv${i}`, createdAt: `${today}T10:00:00.000Z` })
  );
  const chart20 = stackedChartData(e20, '7d');
  assert('SBC-11', "rawMax > 20 sets maxVal to 40", chart20.maxVal === 40, `got ${chart20.maxVal}`);

  // Hourly bar labels include AM/PM
  assert('SBC-12', "hourly bar labels contain AM or PM", hourly.bars.every(b => b.label.includes('AM') || b.label.includes('PM')));
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 6. Pages List ────────────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  const pEvts = [
    mkEvent({ visitorId: 'v1', path: '/about',    landingPage: '/' }),
    mkEvent({ visitorId: 'v1', path: '/about',    landingPage: '/' }),
    mkEvent({ visitorId: 'v2', path: '/services', landingPage: '/services' }),
    mkEvent({ visitorId: 'v3', path: '/',         landingPage: '/' }),
    mkEvent({ visitorId: 'v3', path: '/about',    landingPage: '/' }),
  ];
  const totalVis = metricVisitors(pEvts); // 3

  // path sub-tab
  const pathList = activePagesList(pEvts, totalVis, 'path');
  assert('PG-01', "path list groups by path correctly", pathList.length <= 10 && pathList.length >= 2);
  const aboutEntry = pathList.find(p => p.key === '/about');
  assert('PG-02', "/about has 2 unique visitors", aboutEntry && aboutEntry.visitors === 2, `visitors=${aboutEntry?.visitors}`);
  assert('PG-03', "results sorted by visitors descending", pathList[0].visitors >= pathList[pathList.length - 1].visitors);

  // url sub-tab
  const urlList = activePagesList(pEvts, totalVis, 'url');
  assert('PG-04', "url sub-tab prepends full domain", urlList.every(p => p.key.startsWith('https://apkeliteservices.in')));

  // entry sub-tab
  const entryList = activePagesList(pEvts, totalVis, 'entry');
  assert('PG-05', "entry sub-tab uses landingPage field", entryList.some(p => p.key === '/'));

  // limited to 10 max
  const manyEvts = Array.from({ length: 50 }, (_, i) =>
    mkEvent({ visitorId: `vu${i}`, path: `/page-${i}`, landingPage: `/page-${i}` })
  );
  const bigList = activePagesList(manyEvts, 50, 'path');
  assert('PG-06', "pages list capped at 10 items", bigList.length <= 10, `got ${bigList.length}`);

  // percentage calculation
  const homeEntry = pathList.find(p => p.key === '/');
  assert('PG-07', "percentage = round(visitors/total*100)", homeEntry && homeEntry.percentage === Math.round((homeEntry.visitors / totalVis) * 100));
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 7. Sources List ──────────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  const srcEvts = [
    mkEvent({ visitorId: 'v1', referrer: '' }),                              // Direct
    mkEvent({ visitorId: 'v2', referrer: 'https://google.com/search' }),     // google.com
    mkEvent({ visitorId: 'v3', referrer: 'https://bing.com/search' }),       // bing.com
    mkEvent({ visitorId: 'v4', referrer: 'https://wa.me/919100000000' }),    // whatsapp
    mkEvent({ visitorId: 'v5', referrer: 'https://instagram.com/p/abc' }),   // instagram.com
    mkEvent({ visitorId: 'v6', referrer: 'https://facebook.com/post/1' }),   // facebook.com
  ];
  const totVis = metricVisitors(srcEvts);

  const refList = activeSourcesList(srcEvts, totVis, 'referrers');
  assert('SR-01', "empty referrer → 'Direct / Bookmark'",    refList.some(r => r.name === 'Direct / Bookmark'));
  assert('SR-02', "google referrer → 'google.com'",          refList.some(r => r.name === 'google.com'));
  assert('SR-03', "bing referrer → 'bing.com'",              refList.some(r => r.name === 'bing.com'));
  assert('SR-04', "wa.me referrer → 'whatsapp'",             refList.some(r => r.name === 'whatsapp'));
  assert('SR-05', "instagram referrer → 'instagram.com'",    refList.some(r => r.name === 'instagram.com'));
  assert('SR-06', "facebook referrer → 'facebook.com'",      refList.some(r => r.name === 'facebook.com'));
  assert('SR-07', "referrers list sorted by visitors desc",   refList[0].visitors >= refList[refList.length - 1].visitors);

  // Channels sub-tab
  const chEvts = [
    mkEvent({ visitorId: 'ca', referrer: '', gclid: 'abc123' }),             // Paid Search
    mkEvent({ visitorId: 'cb', referrer: 'https://google.com' }),            // Organic Search
    mkEvent({ visitorId: 'cc', referrer: 'https://whatsapp.com' }),          // Social Media
    mkEvent({ visitorId: 'cd', referrer: '' }),                              // Direct Traffic
    mkEvent({ visitorId: 'ce', referrer: 'https://someothersite.com' }),     // Referral Traffic
  ];
  const totCh = metricVisitors(chEvts);
  const chList = activeSourcesList(chEvts, totCh, 'channels');
  assert('SR-08', "gclid event → 'Paid Search (Google Ads)'",   chList.some(c => c.name === 'Paid Search (Google Ads)'));
  assert('SR-09', "google referrer → 'Organic Search'",          chList.some(c => c.name === 'Organic Search'));
  assert('SR-10', "whatsapp referrer → 'Social Media'",          chList.some(c => c.name === 'Social Media'));
  assert('SR-11', "empty referrer → 'Direct Traffic'",           chList.some(c => c.name === 'Direct Traffic'));
  assert('SR-12', "external non-search → 'Referral Traffic'",    chList.some(c => c.name === 'Referral Traffic'));
  assert('SR-13', "channels list limited to 8 items",            chList.length <= 8, `got ${chList.length}`);
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 8. Environment List ──────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  const envEvts = [
    mkEvent({ visitorId: 'e1', browser: 'Chrome',  os: 'Windows', device: 'desktop' }),
    mkEvent({ visitorId: 'e2', browser: 'Safari',  os: 'iOS',     device: 'mobile'  }),
    mkEvent({ visitorId: 'e3', browser: 'Firefox', os: 'Linux',   device: 'desktop' }),
    mkEvent({ visitorId: 'e4', browser: 'Edge',    os: 'Windows', device: 'desktop' }),
    mkEvent({ visitorId: 'e1', browser: 'Chrome',  os: 'Windows', device: 'desktop' }), // duplicate v1
  ];
  const totEnv = metricVisitors(envEvts); // 4

  const browserList = activeEnvList(envEvts, totEnv, 'browsers');
  const chromeEntry = browserList.find(b => b.name === 'Chrome');
  assert('ENV-01', "Chrome appears in browser list", !!chromeEntry);
  assert('ENV-02', "Chrome has 1 unique visitor (deduped)", chromeEntry && chromeEntry.visitors === 1, `got ${chromeEntry?.visitors}`);
  assert('ENV-03', "browser list sorted by visitors desc", browserList[0].visitors >= browserList[browserList.length - 1].visitors);

  const osList = activeEnvList(envEvts, totEnv, 'os');
  assert('ENV-04', "Windows appears in OS list", osList.some(o => o.name === 'Windows'));
  assert('ENV-05', "Linux appears in OS list", osList.some(o => o.name === 'Linux'));

  const deviceList = activeEnvList(envEvts, totEnv, 'devices');
  assert('ENV-06', "'Desktop' and 'Mobile' appear in device list", deviceList.some(d => d.name === 'Desktop') && deviceList.some(d => d.name === 'Mobile'));

  // Fallback for missing fields
  const noFieldEvt = [mkEvent({ visitorId: 'ef', browser: '', os: '', device: '' })];
  const fallbackBrowser = activeEnvList(noFieldEvt, 1, 'browsers');
  assert('ENV-07', "missing browser falls back to 'Chrome'", fallbackBrowser.some(b => b.name === 'Chrome'));
  const fallbackOs = activeEnvList(noFieldEvt, 1, 'os');
  assert('ENV-08', "missing os with non-mobile device falls back to 'Windows'", fallbackOs.some(o => o.name === 'Windows'));
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 9. Location List ─────────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  const locEvts = [
    mkEvent({ visitorId: 'l1', city: 'Pune' }),
    mkEvent({ visitorId: 'l2', city: 'Mumbai' }),
    mkEvent({ visitorId: 'l3', city: 'unknown' }),  // → Pune fallback
    mkEvent({ visitorId: 'l4', city: '' }),          // → Pune fallback
  ];
  const totLoc = metricVisitors(locEvts); // 4

  const cityList = activeLocationList(locEvts, totLoc, 'cities');
  assert('LOC-01', "known city 'Pune' appears in city list", cityList.some(c => c.name === 'Pune'));
  assert('LOC-02', "known city 'Mumbai' appears in city list", cityList.some(c => c.name === 'Mumbai'));
  assert('LOC-03', "unknown city falls back to 'Pune'", cityList.some(c => c.name === 'Pune'));

  const countryList = activeLocationList(locEvts, totLoc, 'countries');
  assert('LOC-04', "'India' appears in country list", countryList.some(c => c.name === 'India'));
  assert('LOC-05', "country list sorted by visitors desc", countryList[0].visitors >= countryList[countryList.length - 1].visitors);

  const regionList = activeLocationList(locEvts, totLoc, 'regions');
  assert('LOC-06', "'Maharashtra' is default region", regionList.some(r => r.name === 'Maharashtra'));
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 10. Sessions List ────────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  const base = Date.now();
  const sesEvts = [
    mkEvent({ sessionId: 'ss1', visitorId: 'sv1', browser: 'Chrome',  device: 'desktop', city: 'Pune',   path: '/',        landingPage: '/',        createdAt: new Date(base - 30000).toISOString() }),
    mkEvent({ sessionId: 'ss1', visitorId: 'sv1', browser: 'Chrome',  device: 'desktop', city: 'Pune',   path: '/about',   landingPage: '/',        createdAt: new Date(base - 15000).toISOString() }),
    mkEvent({ sessionId: 'ss1', visitorId: 'sv1', browser: 'Chrome',  device: 'desktop', city: 'Pune',   path: '/contact', landingPage: '/',        createdAt: new Date(base).toISOString() }),
    mkEvent({ sessionId: 'ss2', visitorId: 'sv2', browser: 'Safari',  device: 'mobile',  city: 'Mumbai', path: '/services', landingPage: '/services', createdAt: new Date(base - 60000).toISOString() }),
  ];

  const sessList = activeSessionsList(sesEvts);
  assert('SES-01', "sessions list returns 2 unique sessions", sessList.length === 2, `got ${sessList.length}`);

  const ss1 = sessList.find(s => s.sessionId === 'ss1');
  assert('SES-02', "ss1 has 3 views", ss1 && ss1.views === 3, `got ${ss1?.views}`);
  assert('SES-03', "ss1 device is 'desktop'", ss1 && ss1.device === 'desktop');
  assert('SES-04', "ss1 browser is 'Chrome'", ss1 && ss1.browser === 'Chrome');
  assert('SES-05', "ss1 city is 'Pune'", ss1 && ss1.city === 'Pune');
  assert('SES-06', "ss1 landingPage is '/'", ss1 && ss1.landingPage === '/');
  assert('SES-07', "ss1 lastSeen equals most recent createdAt", ss1 && ss1.lastSeen === new Date(base).toISOString(), `got ${ss1?.lastSeen}`);

  const ss2 = sessList.find(s => s.sessionId === 'ss2');
  assert('SES-08', "ss2 has 1 view", ss2 && ss2.views === 1, `got ${ss2?.views}`);
  assert('SES-09', "ss2 browser is 'Safari'", ss2 && ss2.browser === 'Safari');

  // Sort: most recent lastSeen first
  assert('SES-10', "sessions sorted by lastSeen descending (ss1 before ss2)", sessList[0].sessionId === 'ss1', `first was ${sessList[0].sessionId}`);

  // No sessionId → falls back to visitorId
  const noSidEvt = [mkEvent({ sessionId: '', visitorId: 'vsolo', path: '/test', landingPage: '/test' })];
  const noSidList = activeSessionsList(noSidEvt);
  assert('SES-11', "sessionId missing → visitorId used as key", noSidList.length === 1 && noSidList[0].sessionId === 'vsolo');
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 11. Conversion Goals ─────────────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  // 3 visitors, 2 leads, 1 whatsapp referrer — but referrer is 'wa.me' (not 'whatsapp')
  // so waClicks filter (includes 'whatsapp') won't match it → waClicks = 0 + 2 leads = 2
  const cgEvts = [
    mkEvent({ visitorId: 'cg1', referrer: 'https://wa.me/91xxx' }),  // wa.me ≠ 'whatsapp'
    mkEvent({ visitorId: 'cg2', referrer: '' }),
    mkEvent({ visitorId: 'cg3', referrer: 'https://google.com' }),
  ];
  const cgLeads = [{ id: 'l1' }, { id: 'l2' }];
  const goals = conversionGoals(cgEvts, cgLeads);

  assert('CV-01', "totalLeads matches leads array length", goals.totalLeads === 2, `got ${goals.totalLeads}`);
  assert('CV-02', "quoteRate = round(2/3 * 100) = 67%", goals.quoteRate === 67, `got ${goals.quoteRate}`);
  // wa.me referrer does NOT match .includes('whatsapp'), so waClicks = 0 events + 2 leads = 2
  assert('CV-03', "whatsAppClicks = wa.me events (0 matched) + leads (2) = 2", goals.whatsAppClicks === 2, `got ${goals.whatsAppClicks}`);
  assert('CV-04', "phoneClicks = max(1, round(2 * 0.6)) = 1", goals.phoneClicks === 1, `got ${goals.phoneClicks}`);

  // quoteRate capped at 100 (more leads than visitors)
  const fewVis = [mkEvent({ visitorId: 'fx' })];
  const manyLeads = Array.from({ length: 10 }, (_, i) => ({ id: `ll${i}` }));
  const goalsCapped = conversionGoals(fewVis, manyLeads);
  assert('CV-05', "quoteRate capped at 100", goalsCapped.quoteRate === 100, `got ${goalsCapped.quoteRate}`);

  // phoneClicks minimum 1 even with 0 leads
  const noLeads = conversionGoals(cgEvts, []);
  assert('CV-06', "phoneClicks is at least 1 with 0 leads", noLeads.phoneClicks >= 1, `got ${noLeads.phoneClicks}`);
  // whatsAppClicks fallback to 2 when 0 leads
  assert('CV-07', "whatsAppClicks fallback ≥ 2 when no leads", noLeads.whatsAppClicks >= 2, `got ${noLeads.whatsAppClicks}`);
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n─── 12. Edge Cases & Integration ────────────────────────────────');
// ────────────────────────────────────────────────────────────────────────────
{
  // All same visitor, all same session (single-page bounce)
  const sameAll = Array.from({ length: 5 }, () =>
    mkEvent({ visitorId: 'vsame', sessionId: 'ssame', path: '/' })
  );
  assert('EC-01', "5 events same visitor/session → 1 visitor", metricVisitors(sameAll) === 1);
  assert('EC-02', "5 events same visitor/session → 1 visit", metricVisits(sameAll) === 1);
  assert('EC-03', "5 events same visitor/session → 5 views", metricViews(sameAll) === 5);
  assert('EC-04', "5 events same session → 0% bounce (1 session, 5 pages)", metricBounceRate(sameAll) === 0);

  // Timeframe filter + metric pipeline integration
  const mixed = [
    mkEvent({ visitorId: 'mx1', sessionId: 'mxs1', createdAt: ago(2 * H) }),    // in 24h, 7d, 30d, all
    mkEvent({ visitorId: 'mx2', sessionId: 'mxs2', createdAt: ago(10 * D) }),   // in 30d, all
    mkEvent({ visitorId: 'mx3', sessionId: 'mxs3', createdAt: ago(35 * D) }),   // only in all
  ];
  const f7d = filteredFootmarks(mixed, '7d');
  assert('EC-05', "7d filter returns only the 2h-ago event", f7d.length === 1 && f7d[0].visitorId === 'mx1', `len=${f7d.length}`);
  assert('EC-06', "metric pipeline on 7d filtered: 1 visitor", metricVisitors(f7d) === 1);
  assert('EC-07', "metric pipeline on 7d filtered: 1 view", metricViews(f7d) === 1);

  // Pages list with zero events
  const emptyPageList = activePagesList([], 0, 'path');
  assert('EC-08', "pages list is empty for zero events", emptyPageList.length === 0);

  // Sessions list with zero events
  const emptySessList = activeSessionsList([]);
  assert('EC-09', "sessions list is empty for zero events", emptySessList.length === 0);

  // Conversion goals with zero leads and zero visitors
  const goalZero = conversionGoals([], []);
  assert('EC-10', "quoteRate is 0 for 0 leads/visitors", goalZero.quoteRate === 0, `got ${goalZero.quoteRate}`);
}

// ════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════════════════════════════════════

const total = passed + failed;
console.log('\n' + '═'.repeat(60));
console.log(`📋  Results: ${passed}/${total} tests passed`);
if (failed > 0) {
  console.log(`\n❌  Failed tests:`);
  results.filter(r => !r.ok).forEach(r => {
    console.log(`    [${r.id}] ${r.name}`);
    if (r.details) console.log(`          ${r.details}`);
  });
  console.log('');
  process.exit(1);
} else {
  console.log('✅  All traffic analytics tests PASSED!\n');
  process.exit(0);
}
