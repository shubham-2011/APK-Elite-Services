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

const INITIAL_SAMPLE_LEADS: FallbackLead[] = [
  {
    _id: 'lead_sample_1',
    name: 'Rahul Deshmukh',
    phone: '9876543210',
    email: 'rahul.d@gmail.com',
    service: 'Deep Cleaning',
    locality: 'Baner',
    propertyType: '3 BHK',
    message: 'Need complete deep home cleaning before moving in this Saturday.',
    source: 'quote_modal',
    status: 'NEW',
    notes: [{ note: 'Inquiry received via Quote Modal', author: 'System', createdAt: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'lead_sample_2',
    name: 'Pooja Kulkarni',
    phone: '9822012345',
    email: 'pooja.k@outlook.com',
    service: 'Sofa Cleaning',
    locality: 'Wakad',
    propertyType: '5 Seater + Lounger',
    message: 'Stains on fabric sofa, need shampooing.',
    source: 'contact_page',
    status: 'CONTACTED',
    notes: [
      { note: 'Called client, shared quote ₹1,499 on WhatsApp', author: 'Staff', createdAt: new Date(Date.now() - 3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'lead_sample_3',
    name: 'Amit Patel',
    phone: '9765432109',
    service: 'Office Cleaning',
    locality: 'Hinjewadi Phase 1',
    propertyType: '2,500 sq ft Commercial',
    message: 'Looking for monthly AMC cleaning contract for IT startup.',
    source: 'quote_modal',
    status: 'QUOTE_SENT',
    notes: [{ note: 'Sent commercial proposal PDF via email', author: 'Staff', createdAt: new Date(Date.now() - 86400000).toISOString() }],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
