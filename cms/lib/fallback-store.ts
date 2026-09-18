import fs from 'fs';
import path from 'path';

export interface FallbackLead {
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
  notes: Array<{ note: string; author?: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'leads.json');

const INITIAL_SAMPLE_LEADS: FallbackLead[] = [];

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_SAMPLE_LEADS, null, 2), 'utf-8');
  }
}

export function getFallbackLeads(): FallbackLead[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_LEADS;
  }
}

export function saveFallbackLead(leadData: Partial<FallbackLead>): FallbackLead {
  ensureFile();
  const leads = getFallbackLeads();
  const newLead: FallbackLead = {
    _id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: leadData.name || 'Anonymous',
    phone: leadData.phone || '',
    email: leadData.email,
    service: leadData.service || 'Deep Cleaning',
    locality: leadData.locality || 'Pune',
    propertyType: leadData.propertyType || 'Residential',
    message: leadData.message || '',
    source: leadData.source || 'website',
    status: 'NEW',
    notes: [
      {
        note: `Lead received via ${leadData.source || 'Website'}`,
        author: 'System',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  leads.unshift(newLead);
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return newLead;
}

export function updateFallbackLead(id: string, updates: any): FallbackLead | null {
  ensureFile();
  const leads = getFallbackLeads();
  const idx = leads.findIndex((l) => l._id === id);
  if (idx === -1) return null;

  if (updates.status) leads[idx].status = updates.status;
  if (updates.locality) leads[idx].locality = updates.locality;
  if (updates.service) leads[idx].service = updates.service;
  if (updates.propertyType) leads[idx].propertyType = updates.propertyType;
  if (updates.note) {
    leads[idx].notes.push({
      note: updates.note,
      author: updates.author || 'Admin',
      createdAt: new Date().toISOString(),
    });
  }
  leads[idx].updatedAt = new Date().toISOString();

  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return leads[idx];
}

export function deleteFallbackLead(id: string): boolean {
  ensureFile();
  const leads = getFallbackLeads();
  const filtered = leads.filter((l) => l._id !== id);
  if (filtered.length === leads.length) return false;

  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

// ---------------------------------------------------------------------------
// Footmarks / Visitor Tracking Fallback Store
// ---------------------------------------------------------------------------
export interface FallbackFootmark {
  _id: string;
  visitorId: string;
  sessionId: string;
  path: string;
  pageTitle: string;
  referrer: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os?: string;
  city: string;
  ip?: string;
  createdAt: string;
}

const FOOTMARKS_FILE = path.join(DATA_DIR, 'footmarks.json');

const INITIAL_SAMPLE_FOOTMARKS: FallbackFootmark[] = [];

function ensureFootmarksFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FOOTMARKS_FILE)) {
    fs.writeFileSync(FOOTMARKS_FILE, JSON.stringify(INITIAL_SAMPLE_FOOTMARKS, null, 2), 'utf-8');
  }
}

export function getFallbackFootmarks(): FallbackFootmark[] {
  ensureFootmarksFile();
  try {
    const raw = fs.readFileSync(FOOTMARKS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_FOOTMARKS;
  }
}

export function saveFallbackFootmark(data: Partial<FallbackFootmark>): FallbackFootmark {
  ensureFootmarksFile();
  const footmarks = getFallbackFootmarks();
  const newFootmark: FallbackFootmark = {
    _id: 'foot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    visitorId: data.visitorId || 'vis_anon_' + Math.random().toString(36).substring(2, 6),
    sessionId: data.sessionId || 'sess_anon_' + Math.random().toString(36).substring(2, 6),
    path: data.path || '/',
    pageTitle: data.pageTitle || 'APK Elite Services',
    referrer: data.referrer || 'Direct',
    device: data.device || 'mobile',
    browser: data.browser || 'Chrome',
    os: data.os || 'Android',
    city: data.city || 'Pune',
    ip: data.ip || 'anonymous',
    createdAt: new Date().toISOString(),
  };

  footmarks.unshift(newFootmark);
  // Cap at 1000 items in fallback storage to prevent huge JSON files
  const capped = footmarks.slice(0, 1000);
  fs.writeFileSync(FOOTMARKS_FILE, JSON.stringify(capped, null, 2), 'utf-8');
  return newFootmark;
}

export function getFallbackFootmarkStats() {
  const footmarks = getFallbackFootmarks();
  const totalFootmarks = footmarks.length;
  const uniqueVisitorSet = new Set(footmarks.map((f) => f.visitorId));
  const uniqueVisitors = uniqueVisitorSet.size;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFootmarksList = footmarks.filter((f) => f.createdAt.startsWith(todayStr));
  const todayFootmarks = todayFootmarksList.length;
  const todayUniqueVisitors = new Set(todayFootmarksList.map((f) => f.visitorId)).size;

  // Page distribution
  const pageMap: Record<string, { count: number; title: string }> = {};
  footmarks.forEach((f) => {
    if (!pageMap[f.path]) {
      pageMap[f.path] = { count: 0, title: f.pageTitle || f.path };
    }
    pageMap[f.path].count++;
  });
  const topPages = Object.entries(pageMap)
    .map(([path, data]) => ({
      path,
      title: data.title,
      count: data.count,
      percentage: totalFootmarks > 0 ? Math.round((data.count / totalFootmarks) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Device distribution
  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  footmarks.forEach((f) => {
    const dev = f.device?.toLowerCase() as 'mobile' | 'desktop' | 'tablet';
    if (deviceCounts[dev] !== undefined) {
      deviceCounts[dev]++;
    } else {
      deviceCounts.mobile++;
    }
  });

  // Referrer distribution
  const refMap: Record<string, number> = {};
  footmarks.forEach((f) => {
    const ref = f.referrer || 'Direct';
    refMap[ref] = (refMap[ref] || 0) + 1;
  });
  const topReferrers = Object.entries(refMap)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalFootmarks,
    uniqueVisitors,
    todayFootmarks,
    todayUniqueVisitors,
    topPages,
    deviceCounts,
    topReferrers,
    recentFootmarks: footmarks.slice(0, 50),
  };
}

