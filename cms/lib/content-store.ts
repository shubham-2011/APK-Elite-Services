import fs from 'fs';
import path from 'path';
import { SiteContentData, DEFAULT_SITE_CONTENT } from './content-types';

export * from './content-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

function ensureContentFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(DEFAULT_SITE_CONTENT, null, 2), 'utf-8');
  }
}

export function getSiteContent(): SiteContentData {
  ensureContentFile();
  try {
    const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function saveSiteContent(data: Partial<SiteContentData>): SiteContentData {
  ensureContentFile();
  const current = getSiteContent();
  const updated: SiteContentData = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(CONTENT_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
