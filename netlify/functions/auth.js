const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const AUTH_SECRET = process.env.AUTH_SECRET || '8ce346ae38aed6ff58b5b9c04c07c647e7200eb5faeb9143af169382a9a6af89';
const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'apk_elite_services';

let cachedDb = null;
async function getDb() {
  if (!MONGODB_URI) return null;
  if (cachedDb) return cachedDb;
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    cachedDb = client.db(DB_NAME);
    return cachedDb;
  } catch (err) {
    return null;
  }
}

// Built-in verified CMS users
const VERIFIED_CREDENTIALS = {
  'admin': 'Admin@ApkElite2026!',
  'shubhammisra800@gmail.com': 'Shubham@ApkElite2026!',
  'manager@apkeliteservices.in': 'ApkElite#Manager2026!'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

function createSessionToken(username) {
  const sessionId = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const payload = {
    sid: sessionId,
    username,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: expiresAt
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url');
  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { valid: false };
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({}) };
  }

  const path = (event.path || '').toLowerCase();

  // -------------------------------------------------------------
  // GET /api/auth/me
  // -------------------------------------------------------------
  if (event.httpMethod === 'GET' || path.includes('/me')) {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
    if (!token && event.headers.cookie) {
      const match = event.headers.cookie.match(/apk_cms_session=([^;]+)/);
      if (match) token = match[1];
    }

    const verification = verifySessionToken(token);
    if (verification.valid) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          authenticated: true,
          username: verification.payload.username,
          role: verification.payload.role || 'admin'
        })
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, authenticated: false })
    };
  }

  // -------------------------------------------------------------
  // POST /api/auth/logout
  // -------------------------------------------------------------
  if (path.includes('/logout')) {
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Set-Cookie': 'apk_cms_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
      },
      body: JSON.stringify({ success: true, message: 'Logged out successfully' })
    };
  }

  // -------------------------------------------------------------
  // POST /api/auth/login
  // -------------------------------------------------------------
  if (event.httpMethod === 'POST') {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      body = {};
    }

    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    if (!username || !password) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Username and password required' })
      };
    }

    let authenticated = false;
    let userRole = 'admin';

    // 1. Check verified credentials map
    if (VERIFIED_CREDENTIALS[username] && VERIFIED_CREDENTIALS[username] === password) {
      authenticated = true;
    }

    // 2. Check MongoDB users if available
    if (!authenticated) {
      try {
        const db = await getDb();
        if (db) {
          const userDoc = await db.collection('users').findOne({ username });
          if (userDoc && userDoc.password === password) {
            authenticated = true;
            userRole = userDoc.role || 'admin';
          }
        }
      } catch (err) {}
    }

    if (!authenticated) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Invalid username or password' })
      };
    }

    const token = createSessionToken(username);
    const cookieHeader = `apk_cms_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Set-Cookie': cookieHeader
      },
      body: JSON.stringify({
        success: true,
        token,
        user: {
          username,
          role: userRole
        }
      })
    };
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: 'Endpoint not found' })
  };
};
