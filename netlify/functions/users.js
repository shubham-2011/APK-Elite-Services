const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const {
  getSessionToken,
  verifySessionToken,
  isSessionRevoked,
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
    console.error('CMS user database connection failed:', err.message);
    return null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({}) };
  }

  const session = verifySessionToken(getSessionToken(event));
  if (!session.valid || session.payload.role !== 'admin') {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Administrator authentication required.' })
    };
  }

  let db;
  try {
    db = await getDb();
    if (!db) throw new Error('User storage is unavailable');
    if (await isSessionRevoked(db, session.payload)) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Administrator authentication required.' })
      };
    }
  } catch (err) {
    console.error('CMS user session verification failed:', err.message);
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Authentication storage is unavailable.' })
    };
  }

  // GET /api/users
  if (event.httpMethod === 'GET') {
    try {
      const users = await db.collection('users')
        .find({}, { projection: { password: 0, passwordHash: 0 } })
        .toArray();
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, users })
      };
    } catch (err) {
      console.error('CMS user list failed:', err.message);
      return {
        statusCode: 503,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'User storage is unavailable.' })
      };
    }
  }

  // POST /api/users
  if (event.httpMethod === 'POST') {
    let body = {};
    try {
      const parsed = JSON.parse(event.body || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed;
    } catch {
      // Invalid JSON uses the standard input validation response.
    }

    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role || 'admin';

    if (!username || username.length < 3 || username.length > 100) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Username must be at least 3 characters' })
      };
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Password must be at least 8 characters' })
      };
    }

    if (role !== 'admin' && role !== 'editor') {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Role must be admin or editor.' })
      };
    }

    const newUser = {
      username,
      role,
      createdAt: new Date()
    };

    try {
      const result = await db.collection('users').insertOne({
        ...newUser,
        passwordHash: await bcrypt.hash(password, 10),
      });
      newUser._id = result.insertedId;
    } catch (err) {
      console.error('CMS user creation failed:', err.message);
      return {
        statusCode: 503,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'User storage is unavailable. The account was not created.' })
      };
    }

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        user: { ...newUser, _id: String(newUser._id), createdAt: newUser.createdAt.toISOString() }
      })
    };
  }

  if (event.httpMethod === 'PATCH') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Invalid request body.' })
      };
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Invalid request body.' })
      };
    }

    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || !password || password.length < 8 || password.length > 200) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Username or password is invalid.' })
      };
    }

    try {
      const result = await db.collection('users').updateOne(
        { username },
        { $set: { passwordHash: await bcrypt.hash(password, 10) }, $unset: { password: '' } }
      );
      if (!result.matchedCount) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'User not found.' })
        };
      }
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true })
      };
    } catch (err) {
      console.error('CMS user password update failed:', err.message);
      return {
        statusCode: 503,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'User storage is unavailable.' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
  };
};
