const { MongoClient } = require('mongodb');

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

const DEFAULT_USERS = [
  { _id: 'usr_admin', username: 'admin', role: 'admin', createdAt: '2026-11-12T07:13:13.209Z' },
  { _id: 'usr_initial_shubham', username: 'shubhammisra800@gmail.com', role: 'admin', createdAt: '2026-11-12T07:13:13.209Z' },
  { _id: 'usr_initial_manager', username: 'manager@apkeliteservices.in', role: 'admin', createdAt: '2026-11-12T07:32:00.000Z' }
];

let inMemoryUsers = [...DEFAULT_USERS];

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

  // GET /api/users
  if (event.httpMethod === 'GET') {
    try {
      const db = await getDb();
      if (db) {
        const dbUsers = await db.collection('users').find({}, { projection: { password: 0, passwordHash: 0 } }).toArray();
        if (dbUsers && dbUsers.length > 0) {
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: true, users: dbUsers })
          };
        }
      }
    } catch {}

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, users: inMemoryUsers })
    };
  }

  // POST /api/users
  if (event.httpMethod === 'POST') {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {}

    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';
    const role = body.role || 'admin';

    if (!username || username.length < 3) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Username must be at least 3 characters' })
      };
    }

    if (!password || password.length < 8) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Password must be at least 8 characters' })
      };
    }

    const newUser = {
      _id: 'usr_' + Date.now(),
      username,
      role,
      createdAt: new Date().toISOString()
    };

    try {
      const db = await getDb();
      if (db) {
        await db.collection('users').insertOne({ ...newUser, password });
      }
    } catch {}

    inMemoryUsers.push(newUser);

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, user: newUser })
    };
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
  };
};
