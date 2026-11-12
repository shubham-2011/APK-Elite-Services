const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  verifySessionToken,
  isSessionRevoked,
  revokeSession,
  getSessionToken,
} = require('../auth-session');

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'apk_elite_services';

let cachedDb = null;
async function getDb() {
  if (!MONGODB_URI) return null;
  if (cachedDb) return cachedDb;
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    try {
      await client.connect();
      cachedDb = client.db(DB_NAME);
      return cachedDb;
    } catch (err) {
      await client.close().catch(() => {});
      throw err;
    }
  } catch (err) {
    console.error('CMS authentication database connection failed:', err.message);
    return null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({}) };
  }

  const path = (event.path || '').toLowerCase();

  // -------------------------------------------------------------
  // GET /api/auth/me
  // -------------------------------------------------------------
  if (event.httpMethod === 'GET' || path.includes('/me')) {
    const token = getSessionToken(event);
    const verification = verifySessionToken(token);
    if (verification.valid) {
      try {
        const db = await getDb();
        if (!db) throw new Error('Authentication storage is unavailable');
        if (await isSessionRevoked(db, verification.payload)) {
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: true, authenticated: false })
          };
        }
      } catch (err) {
        console.error('CMS session verification failed:', err.message);
        return {
          statusCode: 503,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Authentication storage is unavailable. Please try again later.' })
        };
      }

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
    let statusCode = 200;
    let body = { success: true, message: 'Logged out successfully' };
    const verification = verifySessionToken(getSessionToken(event));
    if (verification.valid) {
      try {
        const db = await getDb();
        if (!db) throw new Error('Authentication storage is unavailable');
        await revokeSession(db, verification.payload);
      } catch (err) {
        console.error('CMS session revocation failed:', err.message);
        statusCode = 503;
        body = { success: false, error: 'Session could not be revoked because authentication storage is unavailable.' };
      }
    }

    const headers = { ...CORS_HEADERS };
    if (statusCode === 200) {
      headers['Set-Cookie'] = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure`;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify(body)
    };
  }

  // -------------------------------------------------------------
  // POST /api/auth/login
  // -------------------------------------------------------------
  if (event.httpMethod === 'POST') {
    let body = {};
    try {
      const parsed = JSON.parse(event.body || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed;
    } catch {
      // Invalid JSON uses the same validation error as missing credentials.
    }

    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (typeof process.env.AUTH_SECRET !== 'string' || process.env.AUTH_SECRET.length < 32) {
      return {
        statusCode: 503,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Authentication is not configured. AUTH_SECRET must contain at least 32 characters.' })
      };
    }

    if (!username || !password || username.length > 100 || password.length > 200) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Username or password is invalid.' })
      };
    }

    let authenticated = false;
    let userRole = 'admin';
    const adminUsername = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';

    if (adminUsername && adminPasswordHash && username === adminUsername) {
      authenticated = await bcrypt.compare(password, adminPasswordHash).catch(() => false);
    }

    if (!authenticated) {
      const db = await getDb();
      if (!db) {
        return {
          statusCode: 503,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Authentication storage is unavailable. Please try again later.' })
        };
      }

      try {
        const userDoc = await db.collection('users').findOne({ username });
        if (userDoc && typeof userDoc.passwordHash === 'string') {
          authenticated = await bcrypt.compare(password, userDoc.passwordHash).catch(() => false);
          userRole = userDoc.role === 'editor' ? 'editor' : 'admin';
        } else if (userDoc && typeof userDoc.password === 'string' && userDoc.password === password) {
          const passwordHash = await bcrypt.hash(password, 10);
          await db.collection('users').updateOne(
            { _id: userDoc._id },
            { $set: { passwordHash }, $unset: { password: '' } }
          );
          authenticated = true;
          userRole = userDoc.role === 'editor' ? 'editor' : 'admin';
        }
      } catch (err) {
        console.error('CMS credential lookup failed:', err.message);
        return {
          statusCode: 503,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Authentication storage is unavailable. Please try again later.' })
        };
      }
    }

    if (!authenticated) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Invalid username or password' })
      };
    }

    const token = createSessionToken(username, userRole);
    const headers = event.headers || {};
    const forwardedProto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'] || '';
    const secureCookie = forwardedProto.split(',')[0].trim() === 'https' ? '; Secure' : '';
    const cookieHeader = `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secureCookie}`;

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Set-Cookie': cookieHeader
      },
      body: JSON.stringify({
        success: true,
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
