const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'apk_cms_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const revocationIndexes = new WeakMap();

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  return typeof secret === 'string' && secret.length >= 32 ? secret : '';
}

function createSessionToken(username, role = 'admin') {
  const secret = getAuthSecret();
  if (!secret) throw new Error('AUTH_SECRET must contain at least 32 characters');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sid: crypto.randomUUID(),
    username,
    role,
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token) {
  const secret = getAuthSecret();
  if (!secret || typeof token !== 'string' || token.length > 4096) return { valid: false };

  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (
      typeof payload.username !== 'string' ||
      !payload.username ||
      typeof payload.sid !== 'string' ||
      !payload.sid ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000) ||
      !['admin', 'editor'].includes(payload.role)
    ) {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

async function ensureRevocationIndex(db) {
  if (!revocationIndexes.has(db)) {
    revocationIndexes.set(
      db,
      db.collection('revoked_sessions').createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      )
    );
  }
  await revocationIndexes.get(db);
}

async function isSessionRevoked(db, payload) {
  await ensureRevocationIndex(db);
  const record = await db.collection('revoked_sessions').findOne({
    _id: payload.sid,
    expiresAt: { $gt: new Date() },
  });
  return Boolean(record);
}

async function revokeSession(db, payload) {
  await ensureRevocationIndex(db);
  await db.collection('revoked_sessions').updateOne(
    { _id: payload.sid },
    {
      $setOnInsert: {
        createdAt: new Date(),
        expiresAt: new Date(payload.exp * 1000),
      },
    },
    { upsert: true }
  );
}

function getSessionToken(event) {
  const headers = event.headers || {};
  const authHeader = headers.authorization || headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.substring(7).trim();

  const cookie = headers.cookie || headers.Cookie || '';
  const match = cookie.match(/(?:^|;\s*)apk_cms_session=([^;]+)/);
  return match ? match[1] : '';
}

module.exports = {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  verifySessionToken,
  isSessionRevoked,
  revokeSession,
  getSessionToken,
};
