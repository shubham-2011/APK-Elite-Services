import { connectToDatabase } from './mongodb';
import RateLimit from '@/models/RateLimit';

// Local in-memory fallback for offline development
const memoryRateMap = new Map<string, { attempts: number; lockUntil: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
}

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks rate limit for a given key (e.g. client IP or username) across serverless instances.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const now = Date.now();

  try {
    await connectToDatabase();
    let record = await RateLimit.findOne({ key });

    if (!record) {
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
    }

    if (record.lockUntil && record.lockUntil.getTime() > now) {
      const retryAfterSeconds = Math.ceil((record.lockUntil.getTime() - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      // Re-lock
      record.lockUntil = new Date(now + LOCK_TIME_MS);
      await record.save();
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds: Math.ceil(LOCK_TIME_MS / 1000) };
    }

    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts, retryAfterSeconds: 0 };
  } catch {
    // Fallback to local memory if DB offline
    const record = memoryRateMap.get(key);
    if (!record) return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
    if (record.lockUntil > now) {
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds: Math.ceil((record.lockUntil - now) / 1000) };
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      record.lockUntil = now + LOCK_TIME_MS;
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds: Math.ceil(LOCK_TIME_MS / 1000) };
    }
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts, retryAfterSeconds: 0 };
  }
}

/**
 * Records a failed attempt in MongoDB (and local fallback).
 */
export async function recordFailedAttempt(key: string): Promise<void> {
  const now = Date.now();

  try {
    await connectToDatabase();
    let record = await RateLimit.findOne({ key });
    if (!record) {
      record = new RateLimit({ key, attempts: 1 });
    } else {
      record.attempts += 1;
      if (record.attempts >= MAX_ATTEMPTS) {
        record.lockUntil = new Date(now + LOCK_TIME_MS);
      }
    }
    await record.save();
  } catch {
    // Fallback
    const record = memoryRateMap.get(key) || { attempts: 0, lockUntil: 0 };
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      record.lockUntil = now + LOCK_TIME_MS;
    }
    memoryRateMap.set(key, record);
  }
}

/**
 * Resets attempts upon successful authentication.
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await connectToDatabase();
    await RateLimit.deleteOne({ key });
  } catch {}
  memoryRateMap.delete(key);
}
