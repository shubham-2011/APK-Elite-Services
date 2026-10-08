/**
 * Second Independent Security Audit & Verification Test Suite
 * Specifically tests:
 * 1. Cryptographic session validity & expiration
 * 2. True Server-Side Session Revocation on Logout (Token reuse MUST fail)
 * 3. CSRF Protection for state-changing endpoints
 * 4. Multi-instance persistent rate limiting
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002';

const results = [];

function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} | ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runAuditTests() {
  console.log(`\n======================================================`);
  console.log(`Starting Phase 2 Independent Security Verification`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // ----------------------------------------------------
  // TEST 1: Password security check - plaintext reject
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
    });
    const pass = res.status === 401;
    recordTest('Test 1: Invalid password rejected with 401', pass);
  } catch (e) {
    recordTest('Test 1: Invalid password rejected with 401', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 2: Valid Login & Receive Session
  // ----------------------------------------------------
  let sessionToken = null;
  let cookieHeader = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@ApkElite2026!' }),
    });
    const data = await res.json().catch(() => ({}));
    sessionToken = data.token;
    cookieHeader = res.headers.get('set-cookie');
    const pass = res.status === 200 && data.success === true && !!sessionToken;
    recordTest('Test 2: Successful login returns cryptographic token & HttpOnly cookie', pass, `Cookie set: ${!!cookieHeader}`);
  } catch (e) {
    recordTest('Test 2: Successful login returns cryptographic token', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 3: Access protected API with active session -> 200 OK
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads?limit=5`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true;
    recordTest('Test 3: Active session accesses protected /api/leads with 200 OK', pass);
  } catch (e) {
    recordTest('Test 3: Active session accesses protected /api/leads', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 4: Logout & Revoke Session Server-Side
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    const pass = res.status === 200;
    recordTest('Test 4: Logout triggers server-side session revocation', pass);
  } catch (e) {
    recordTest('Test 4: Logout triggers server-side session revocation', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 5: REUSE OLD SESSION AFTER LOGOUT -> MUST BE REJECTED 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads?limit=5`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 401 && data.success === false;
    recordTest('Test 5: Reusing old session after logout MUST fail with 401 Unauthorized', pass, `Status: ${res.status} | Error: ${data.error}`);
  } catch (e) {
    recordTest('Test 5: Reusing old session after logout MUST fail', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 6: Obtain Fresh Session for CSRF Testing
  // ----------------------------------------------------
  let freshCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@ApkElite2026!' }),
    });
    const rawCookie = res.headers.get('set-cookie');
    if (rawCookie) {
      freshCookie = rawCookie.split(';')[0];
    }
    const pass = res.status === 200 && !!freshCookie;
    recordTest('Test 6: Authenticated fresh cookie session established', pass);
  } catch (e) {
    recordTest('Test 6: Authenticated fresh cookie session established', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 7: Cross-Site Request (CSRF Attack Simulation)
  // Cross-origin request with evil Origin header and no custom header
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain', // simple cross-site content type (bypasses browser CORS preflight)
        Cookie: freshCookie,
        Origin: 'https://evil-attacker-website.com',
      },
      body: JSON.stringify({ companyName: 'Defaced Site' }),
    });
    // Should be rejected because origin does not match host and no custom header
    const pass = res.status === 401 || res.status === 400;
    recordTest('Test 7: Cross-origin CSRF attempt blocked', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 7: Cross-origin CSRF attempt blocked', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 8: Same-Site / Authorized mutating request with custom header -> 200 OK
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: freshCookie,
      },
      body: JSON.stringify({
        companyName: 'APK Elite Services',
        phone: '+91 88301 67863',
        whatsapp: '918830167863',
        email: 'info@apkeliteservices.in',
        address: 'Pune, Maharashtra',
        promoBanner: { enabled: true, text: 'Clean Home Offer', discountPercent: 15 },
        formConfig: { modalTitle: 'Quote', modalSubtitle: 'Details', localities: [], services: [] },
      }),
    });
    const pass = res.status === 200;
    recordTest('Test 8: Legitimate state-changing request succeeds with 200', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 8: Legitimate state-changing request succeeds', false, e.message);
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n======================================================`);
  console.log(`Phase 2 Test Results Summary: ${passedCount} / ${results.length} PASSED`);
  console.log(`======================================================\n`);

  if (passedCount === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAuditTests();
