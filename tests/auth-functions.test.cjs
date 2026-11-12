const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const Module = require('node:module');

const mongoUri = process.env.MONGODB_URI;
process.env.MONGODB_URI = '';
const auth = require('../netlify/functions/auth');
const users = require('../netlify/functions/users');
const {
  createSessionToken,
  getSessionToken,
  isSessionRevoked,
  revokeSession,
  verifySessionToken,
} = require('../netlify/auth-session');
if (mongoUri === undefined) delete process.env.MONGODB_URI;
else process.env.MONGODB_URI = mongoUri;

const SECRET = 'local-test-secret-with-at-least-32-characters';

async function withEnv(values, run) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function request(method, path, headers = {}, body = '') {
  return { httpMethod: method, path, headers, body };
}

function loadFunctionsWithFakeMongo(connectError) {
  const revokedSessions = new Map();
  const userUpdates = [];
  const users = [];
  const database = {
    collection(name) {
      return {
        createIndex: async () => `${name}_expiresAt`,
        findOne: async (query) => {
          if (name === 'revoked_sessions') {
            const record = revokedSessions.get(query._id);
            return record && record.expiresAt > query.expiresAt.$gt ? record : null;
          }
          return users.find((user) => user.username === query.username) || null;
        },
        updateOne: async (query, update) => {
          if (name === 'revoked_sessions') {
            if (!revokedSessions.has(query._id)) revokedSessions.set(query._id, update.$setOnInsert);
          } else {
            userUpdates.push({ query, update });
          }
          return { matchedCount: 1 };
        },
        insertOne: async (user) => {
          users.push(user);
          return { insertedId: 'mock-user-id' };
        },
        find: () => ({ toArray: async () => users }),
      };
    },
  };
  class FakeMongoClient {
    async connect() {
      if (connectError) throw connectError;
    }
    async close() {}
    db() { return database; }
  }

  const authPath = require.resolve('../netlify/functions/auth');
  const usersPath = require.resolve('../netlify/functions/users');
  const cachedAuth = require.cache[authPath];
  const cachedUsers = require.cache[usersPath];
  const originalLoad = Module._load;
  let authWithDb;
  let usersWithDb;
  try {
    delete require.cache[authPath];
    delete require.cache[usersPath];
    Module._load = function (requestName, parent, isMain) {
      if (requestName === 'mongodb') return { MongoClient: FakeMongoClient };
      return originalLoad.call(this, requestName, parent, isMain);
    };
    authWithDb = require(authPath);
    usersWithDb = require(usersPath);
  } finally {
    Module._load = originalLoad;
    if (cachedAuth) require.cache[authPath] = cachedAuth;
    if (cachedUsers) require.cache[usersPath] = cachedUsers;
  }
  return { auth: authWithDb, users: usersWithDb, database, userUpdates };
}

test('session tokens are signed, expire, and reject tampering', async () => {
  await withEnv({ AUTH_SECRET: SECRET }, async () => {
    const token = createSessionToken('owner@example.test', 'admin');
    assert.equal(verifySessionToken(token).valid, true);
    assert.equal(verifySessionToken(`${token}x`).valid, false);
    assert.equal(verifySessionToken('not-a-token').valid, false);
    assert.equal(getSessionToken(request('GET', '/', { cookie: `other=1; apk_cms_session=${token}` })), token);
  });
});

test('session tokens are rejected when the signing secret is weak or missing', async () => {
  await withEnv({ AUTH_SECRET: 'too-short' }, async () => {
    assert.throws(() => createSessionToken('owner@example.test'));
    assert.equal(verifySessionToken('anything').valid, false);
  });
});

test('admin login verifies the configured bcrypt hash and does not expose a bearer token', async () => {
  const password = 'a-test-password-that-is-not-a-real-credential';
  const passwordHash = await bcrypt.hash(password, 4);
  await withEnv({
    AUTH_SECRET: SECRET,
    ADMIN_USERNAME: 'owner@example.test',
    ADMIN_PASSWORD_HASH: passwordHash,
  }, async () => {
    const response = await auth.handler(request(
      'POST',
      '/api/auth/login',
      { 'x-forwarded-proto': 'https' },
      JSON.stringify({ username: 'OWNER@example.test', password })
    ));
    const result = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(result.user.username, 'owner@example.test');
    assert.equal(Object.hasOwn(result, 'token'), false);
    assert.match(response.headers['Set-Cookie'], /HttpOnly/);
    assert.match(response.headers['Set-Cookie'], /Secure/);
  });
});

test('login fails clearly when AUTH_SECRET is missing', async () => {
  await withEnv({
    AUTH_SECRET: undefined,
    ADMIN_USERNAME: 'owner@example.test',
    ADMIN_PASSWORD_HASH: await bcrypt.hash('test-password', 4),
  }, async () => {
    const response = await auth.handler(request(
      'POST',
      '/api/auth/login',
      {},
      JSON.stringify({ username: 'owner@example.test', password: 'test-password' })
    ));
    assert.equal(response.statusCode, 503);
    assert.match(JSON.parse(response.body).error, /AUTH_SECRET/);
  });
});

test('user management endpoints reject requests without an administrator session', async () => {
  await withEnv({ AUTH_SECRET: SECRET }, async () => {
    for (const method of ['GET', 'POST', 'PATCH']) {
      const response = await users.handler(request(method, '/api/users'));
      assert.equal(response.statusCode, 401);
      assert.equal(JSON.parse(response.body).success, false);
    }
  });
});

test('unauthenticated session endpoint reports no active session', async () => {
  await withEnv({ AUTH_SECRET: SECRET }, async () => {
    const response = await auth.handler(request(
      'GET',
      '/api/auth/me'
    ));
    const result = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(result.authenticated, false);
  });
});

test('revoked sessions are rejected by the shared session store', async () => {
  await withEnv({ AUTH_SECRET: SECRET }, async () => {
    const records = new Map();
    const db = {
      collection: () => ({
        createIndex: async () => 'expiresAt_1',
        findOne: async (query) => {
          const record = records.get(query._id);
          return record && record.expiresAt > query.expiresAt.$gt ? record : null;
        },
        updateOne: async (query, update) => {
          if (!records.has(query._id)) records.set(query._id, update.$setOnInsert);
        },
      }),
    };
    const token = createSessionToken('owner@example.test', 'admin');
    const payload = verifySessionToken(token).payload;
    assert.equal(await isSessionRevoked(db, payload), false);
    await revokeSession(db, payload);
    assert.equal(await isSessionRevoked(db, payload), true);
  });
});

test('logout revokes the session and prevents later user-management access', async () => {
  await withEnv({
    AUTH_SECRET: SECRET,
    MONGODB_URI: 'mongodb://test.invalid',
    MONGODB_DB: 'auth_test',
  }, async () => {
    const fake = loadFunctionsWithFakeMongo();
    const token = createSessionToken('owner@example.test', 'admin');
    const logout = await fake.auth.handler(request(
      'POST',
      '/api/auth/logout',
      { cookie: `apk_cms_session=${token}` }
    ));
    assert.equal(logout.statusCode, 200);
    assert.match(logout.headers['Set-Cookie'], /Max-Age=0/);

    const response = await fake.users.handler(request(
      'GET',
      '/api/users',
      { cookie: `apk_cms_session=${token}` }
    ));
    assert.equal(response.statusCode, 401);
  });
});

test('logout keeps the session cookie when revocation storage is unavailable', async () => {
  await withEnv({
    AUTH_SECRET: SECRET,
    MONGODB_URI: 'mongodb://test.invalid',
    MONGODB_DB: 'auth_test',
  }, async () => {
    const fake = loadFunctionsWithFakeMongo(new Error('database unavailable'));
    const token = createSessionToken('owner@example.test', 'admin');
    const response = await fake.auth.handler(request(
      'POST',
      '/api/auth/logout',
      { cookie: `apk_cms_session=${token}` }
    ));
    assert.equal(response.statusCode, 503);
    assert.equal(response.headers['Set-Cookie'], undefined);
  });
});

test('admin password updates hash the new password in MongoDB', async () => {
  await withEnv({
    AUTH_SECRET: SECRET,
    MONGODB_URI: 'mongodb://test.invalid',
    MONGODB_DB: 'auth_test',
  }, async () => {
    const fake = loadFunctionsWithFakeMongo();
    const token = createSessionToken('owner@example.test', 'admin');
    const response = await fake.users.handler(request(
      'PATCH',
      '/api/users',
      { cookie: `apk_cms_session=${token}` },
      JSON.stringify({ username: 'staff@example.test', password: 'a-different-test-password' })
    ));

    assert.equal(response.statusCode, 200);
    assert.equal(fake.userUpdates.length, 1);
    const passwordHash = fake.userUpdates[0].update.$set.passwordHash;
    assert.notEqual(passwordHash, 'a-different-test-password');
    assert.equal(await bcrypt.compare('a-different-test-password', passwordHash), true);
    assert.equal(fake.userUpdates[0].update.$unset.password, '');
  });
});
