import fs from 'fs';
import path from 'path';
import { connectToDatabase } from './mongodb';
import RevokedSession from '@/models/RevokedSession';

// Fallback JSON file path for offline / local mode
const DATA_DIR = path.join(process.cwd(), 'data');
const REVOKED_FILE = path.join(DATA_DIR, 'revoked-sessions.json');

// In-memory set for microsecond verification lookup
const localRevokedCache = new Set<string>();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

function loadLocalRevoked(): Set<string> {
  try {
    ensureDataDir();
    if (fs.existsSync(REVOKED_FILE)) {
      const raw = fs.readFileSync(REVOKED_FILE, 'utf-8');
      const list: string[] = JSON.parse(raw);
      list.forEach((id) => localRevokedCache.add(id));
    }
  } catch {}
  return localRevokedCache;
}

// Initial load
loadLocalRevoked();

function saveLocalRevoked(sessionId: string) {
  try {
    ensureDataDir();
    localRevokedCache.add(sessionId);
    fs.writeFileSync(REVOKED_FILE, JSON.stringify(Array.from(localRevokedCache)), 'utf-8');
  } catch {}
}

/**
 * Revokes a session server-side.
 */
export async function revokeSession(
  sessionId: string,
  adminUsername: string,
  expiresAtSeconds: number
): Promise<void> {
  if (!sessionId) return;

  // 1. Immediately store in local memory and fallback file
  saveLocalRevoked(sessionId);

  // 2. Persist to MongoDB with TTL
  try {
    await connectToDatabase();
    await RevokedSession.updateOne(
      { sessionId },
      {
        $set: {
          sessionId,
          adminUsername,
          revokedAt: new Date(),
          expiresAt: new Date(expiresAtSeconds * 1000),
        },
      },
      { upsert: true }
    );
  } catch (err: any) {
    console.warn('MongoDB offline; session revoked in local fallback store:', err.message);
  }
}

/**
 * Checks whether a session has been revoked.
 */
export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  if (!sessionId) return true;

  // 1. Check fast memory cache
  if (localRevokedCache.has(sessionId)) {
    return true;
  }

  // 2. Check MongoDB
  try {
    await connectToDatabase();
    const found = await RevokedSession.findOne({ sessionId }).lean();
    if (found) {
      localRevokedCache.add(sessionId);
      return true;
    }
  } catch {}

  return false;
}
