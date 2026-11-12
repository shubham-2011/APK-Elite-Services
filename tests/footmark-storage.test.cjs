const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

function runHandler({ method, mongoUri }) {
  const script = `
    const { handler } = require('./netlify/functions/footmark');
    handler({ httpMethod: ${JSON.stringify(method)}, body: '{}', headers: {} })
      .then((response) => process.stdout.write(JSON.stringify(response)))
      .catch((error) => { console.error(error); process.exit(1); });
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10000,
    env: { ...process.env, MONGODB_URI: mongoUri || '', MONGODB_DB: 'apk_elite_services' },
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

for (const method of ['GET', 'POST']) {
  test(`${method} reports an explicit error when MongoDB is not configured`, () => {
    const response = runHandler({ method });
    const body = JSON.parse(response.body);

    assert.equal(response.statusCode, 503);
    assert.equal(body.success, false);
    assert.equal(body.source, 'mongodb');
    assert.equal(body.dbConnected, false);
  });
}

test('POST reports an explicit error when MongoDB is unreachable', () => {
  const response = runHandler({ method: 'POST', mongoUri: 'mongodb://127.0.0.1:1/apk_elite_services' });
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 503);
  assert.equal(body.success, false);
  assert.match(body.error, /not saved/i);
});

test('OPTIONS remains available without a MongoDB connection', () => {
  const response = runHandler({ method: 'OPTIONS' });

  assert.equal(response.statusCode, 204);
  assert.equal(response.body, '');
});
